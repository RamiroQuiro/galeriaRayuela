import makeWASocket, { 
  useMultiFileAuthState, 
  DisconnectReason, 
  fetchLatestBaileysVersion,
  delay,
  type WASocket
} from "@whiskeysockets/baileys";
import { Boom } from "@hapi/boom";

import path from "path";
import fs from "fs";
import { db } from "../../db";
import { whatsappSesiones, events } from "../../db/schemas";
import { eq, and } from "drizzle-orm";
import { RateLimiter } from "./RateLimiter";
import { ImageProcessor } from "./ImageProcessor";
import { withRetry } from "../../utils/DBUtils";

import pino from "pino";

/**
 * Servicio para gestionar las sesiones de WhatsApp con Baileys.
 * En el VPS, esto debería correr en un proceso dedicado (worker).
 */
export class BaileysService {
  private static sockets: Map<string, WASocket> = new Map();
  private static sessionsPath = path.join(process.cwd(), "sessions");
  private static logger = pino({ level: "silent" }); // Logger silencioso para evitar ruidos, pero válido para Baileys

  /**
   * Inicializa las sesiones guardadas en la base de datos al arrancar.
   */
  static async initAllSessions() {
    const sesiones = await db.select().from(whatsappSesiones).where(eq(whatsappSesiones.estado, "activo"));
    for (const sesion of sesiones) {
      this.conectar(sesion.usuarioId).catch(console.error);
    }
  }

  /**
   * Inicia el proceso de conexión para un usuario específico.
   */
  static async conectar(usuarioId: string) {
    const userSessionPath = path.join(this.sessionsPath, `user_${usuarioId}`);
    
    // Si ya hay un socket activo, no hacemos nada o lo cerramos primero
    if (this.sockets.has(usuarioId)) {
      return this.sockets.get(usuarioId);
    }

    const { state, saveCreds } = await useMultiFileAuthState(userSessionPath);
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
      version,
      auth: state,
      logger: this.logger as any, 
    });

    this.sockets.set(usuarioId, sock);

    // Manejo de eventos
    sock.ev.on("creds.update", saveCreds);

    sock.ev.on("connection.update", async (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        console.log(`[WhatsApp] 📥 Recibido QR del servidor (len: ${qr.length})`);
        console.log(`[WhatsApp] QR RAW PREVIEW: ${qr.substring(0, 50)}...`);
        
        try {
          await withRetry(async () => {
             await db.update(whatsappSesiones)
              .set({ qrVinculacion: qr, estado: "pendiente" })
              .where(eq(whatsappSesiones.usuarioId, usuarioId))
              .run();
          }, `Guardar QR para ${usuarioId}`);
          console.log(`[WhatsApp] ✅ QR guardado en DB correctamente.`);
        } catch (error) {
          console.error(`[WhatsApp] ❌ Error crítico guardando QR:`, error);
        }
      }

      if (connection === "close") {
        const statusCode = (lastDisconnect?.error as Boom)?.output?.statusCode;
        const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
        console.log(`[WhatsApp] 🔌 Conexión cerrada. Reconectar: ${shouldReconnect}`);
        
        if (shouldReconnect) {
          // Esperar un poco antes de reconectar para evitar bucles rápidos
          await delay(2000); 
          this.conectar(usuarioId);
        } else {
          this.sockets.delete(usuarioId);
          await withRetry(async () => {
            await db.update(whatsappSesiones)
              .set({ estado: "desconectado", qrVinculacion: null })
              .where(eq(whatsappSesiones.usuarioId, usuarioId))
              .run();
          }, "Update Desconectado");
        }
      }

      if (connection === "open") {
        console.log(`[WhatsApp] 🎉 ¡CONEXIÓN ESTABLECIDA!`);
        const numero = sock.user?.id.split(":")[0];
        
        await withRetry(async () => {
          await db.update(whatsappSesiones)
            .set({ 
              estado: "activo", 
              numeroWhatsapp: numero,
              qrVinculacion: null,
              fechaVinculacion: new Date(),
              ultimaActividad: new Date()
            })
            .where(eq(whatsappSesiones.usuarioId, usuarioId))
            .run();
        }, "Update Conectado");
      }
    });

    // Escuchar mensajes
    sock.ev.on("messages.upsert", async (m) => {
      if (m.type !== "notify") return;

      for (const msg of m.messages) {
        if (!msg.message || msg.key.fromMe) continue;

        const remoteJid = msg.key.remoteJid;
        if (!remoteJid) continue;

        const numeroTelefono = remoteJid.split("@")[0];
        
        // Verificar si es una imagen
        const imageMsg = msg.message.imageMessage;
        if (imageMsg) {
          console.log(`[WhatsApp] Imagen recibida de ${numeroTelefono} para usuario ${usuarioId}`);

          try {
            // 1. Encontrar el evento activo para este organizador
            const evento = await db
              .select()
              .from(events)
              .where(
                and(
                  eq(events.tenantId, usuarioId),
                  eq(events.estado, "activo")
                )
              )
              .get();

            if (!evento) {
              await sock.sendMessage(remoteJid, { text: "❌ Lo siento, no hay ningún evento activo en este momento para recibir fotos." });
              continue;
            }

            // 2. Verificar Rate Limit
            const { permitido, esperaMinutos } = await RateLimiter.puedeSubir(evento.id, numeroTelefono);
            
            if (!permitido) {
              await sock.sendMessage(remoteJid, { 
                text: `⏳ Has alcanzado el límite de envío (2 fotos cada 10 min). Por favor, intenta de nuevo en unos minutos.` 
              });
              continue;
            }

            // 3. Descargar imagen
            const { downloadContentFromMessage } = await import("@whiskeysockets/baileys");
            const stream = await downloadContentFromMessage(imageMsg, "image");
            let buffer = Buffer.from([]);
            for await (const chunk of stream) {
              buffer = Buffer.concat([buffer, chunk]);
            }

            // 4. Procesar y guardar
            const result = await ImageProcessor.procesarImagenWhatsapp(
              buffer,
              usuarioId,
              numeroTelefono,
              imageMsg.mimetype || "image/jpeg"
            );

            if (result.success) {
              // 5. Registrar en Rate Limiter
              await RateLimiter.registrarSubida(evento.id, numeroTelefono, result.imageId);
              
              await sock.sendMessage(remoteJid, { text: "✅ ¡Tu foto ha sido recibida y se mostrará en la galería! Gracias por compartir." });
            } else {
              await sock.sendMessage(remoteJid, { text: `❌ Hubo un problema al procesar tu imagen: ${result.error}` });
            }

          } catch (error) {
            console.error("[WhatsApp] Error procesando mensaje:", error);
            await sock.sendMessage(remoteJid, { text: "❌ Error interno al recibir la imagen." });
          }
        }
      }
    });

    return sock;
  }

  /**
   * Obtiene el socket activo de un usuario.
   */
  static getSocket(usuarioId: string): WASocket | undefined {
    return this.sockets.get(usuarioId);
  }

  /**
   * Cierra la sesión de un usuario.
   */
  static async logout(usuarioId: string) {
    const sock = this.sockets.get(usuarioId);
    if (sock) {
      await sock.logout();
      this.sockets.delete(usuarioId);
    }
    
    // Limpiar carpeta de sesión
    const userSessionPath = path.join(this.sessionsPath, `user_${usuarioId}`);
    if (fs.existsSync(userSessionPath)) {
      fs.rmSync(userSessionPath, { recursive: true, force: true });
    }

    await db.update(whatsappSesiones)
      .set({ estado: "desconectado", qrVinculacion: null, numeroWhatsapp: null })
      .where(eq(whatsappSesiones.usuarioId, usuarioId));
  }
}
