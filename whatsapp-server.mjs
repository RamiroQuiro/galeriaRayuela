
import { createClient } from '@libsql/client';
import {
  DisconnectReason,
  fetchLatestBaileysVersion,
  makeWASocket,
  useMultiFileAuthState,
  delay
} from '@whiskeysockets/baileys';
import 'dotenv/config';
import { and, eq, sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/libsql';
import http from 'http';
import pino from 'pino';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// Import esquema desde TS (usando tsx se resuelve bien)
import * as schema from './src/db/schemas/index'; 

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// --- CONFIGURACION DB ---
// Usamos la DB local ../sqlite.db relativa a la carpeta de ejecución (raiz)
const client = createClient({
  url: process.env.TURSO_DB_URL || 'file:sqlite.db', 
  authToken: process.env.TURSO_DB_AUTH_TOKEN,
});
const db = drizzle(client, { schema });

// --- PROCESADOR DE IMÁGENES (Minimalista) ---
async function procesarImagen(buffer, usuarioId, numeroTelefono, mimetype) {
  try {
    const imagesDir = path.join(process.cwd(), 'storage', 'uploads');
    if (!fs.existsSync(imagesDir)) fs.mkdirSync(imagesDir, { recursive: true });

    const ext = mimetype.split('/')[1] || 'jpg';
    const filename = `whatsapp_${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`;
    const filepath = path.join(imagesDir, filename);

    fs.writeFileSync(filepath, buffer);
    console.log(`[ImageProcessor] Imagen guardada en: ${filepath}`);

    // Buscar evento activo
    const evento = await db
        .select()
        .from(schema.events)
        .where(
            and(
                eq(schema.events.estado, 'activo'), 
                // Buscamos eventos que pertenezcan al usuario vinculado O a 'vendedor-id' (por si acaso)
                sql`(${schema.events.tenantId} = ${usuarioId} OR ${schema.events.tenantId} = 'vendedor-id')`
            )
        )
        .get();

    if (!evento) return { success: false, error: 'No hay evento activo' };

    // Guardar en DB respetando el esquema real (src/db/schemas/images.schema.ts)
    await db.insert(schema.images).values({
      eventId: evento.id,
      path: `/uploads/${filename}`,
      // No generamos thumbnail real por ahora, usamos la misma o null
      thumbnail: null, 
      nombreInvitado: `WhatsApp (${numeroTelefono})`,
      tamanioBytes: buffer.length
    });

    // Registrar subida en rate limiter (simplificado)
    await db.insert(schema.whatsappSubidas).values({
      eventoId: evento.id,
      numeroTelefono: numeroTelefono,
      fechaSubida: new Date()
    });

    return { success: true };
  } catch (error) {
    console.error('[ImageProcessor] Error:', error);
    return { success: false, error: error.message };
  }
}


// --- GESTIÓN DE CLIENTES BAILEYS ---
const clients = new Map();

async function getOrCreateBaileysClient(userId) {
  const id = String(userId);
  if (clients.has(id)) return clients.get(id);

  console.log(`[Baileys-Smart] Iniciando cliente para: ${id}`);

  // Carpeta de sesión dedicada dentro de whatsapp-server/sessions (para mantener orden)
  const sessionDir = path.join(process.cwd(), 'whatsapp-server', 'sessions', `user_${id}`);
  if (!fs.existsSync(sessionDir)) fs.mkdirSync(sessionDir, { recursive: true });

  const { state, saveCreds } = await useMultiFileAuthState(sessionDir);
  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    version,
    auth: state,
    printQRInTerminal: false,
    connectTimeoutMs: 60000,
    retryRequestDelayMs: 2000,
    // Logger silencioso
    logger: pino({ level: "silent" }) 
  });

  // Eventos
  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      console.log(`[Baileys-Smart] 📥 QR generado para ${id}`);
      await db.update(schema.whatsappSesiones)
        .set({ qrVinculacion: qr, estado: 'pendiente' })
        .where(eq(schema.whatsappSesiones.usuarioId, id))
        .run();
    }

    if (connection === 'close') {
      const statusCode = (lastDisconnect?.error)?.output?.statusCode;
      // 515 = Stream Errored (Reconectar agresivamente)
      // 401 = Logged Out (Borrar sesión)
      
      if (statusCode === 515) {
         console.log("⚠️ Stream Errored (515). Reintentando...");
         clients.delete(id);
         getOrCreateBaileysClient(id);
         return;
      }

      const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
      console.log(`[Baileys-Smart] Cerrado (${statusCode}). Reconnect: ${shouldReconnect}`);

      if (shouldReconnect) {
        clients.delete(id);
        // Esperar un poco y reconectar
        setTimeout(() => getOrCreateBaileysClient(id), 2000);
      } else {
        console.log("🚫 Desconexión definitiva (401). Limpiando.");
        clients.delete(id);
        // Limpiar DB
        await db.update(schema.whatsappSesiones)
          .set({ estado: 'desconectado', qrVinculacion: null })
          .where(eq(schema.whatsappSesiones.usuarioId, id))
          .run();
        
        // Limpiar archivos (opcional, cuidado con bloqueos)
        try { fs.rmSync(sessionDir, { recursive: true, force: true }); } catch (e) {}
      }
    }

    if (connection === 'open') {
        console.log(`[Baileys-Smart] ✅ Conectado: ${id}`);
        const numero = sock.user?.id.split(":")[0];
        
        await db.update(schema.whatsappSesiones)
            .set({ 
              estado: 'activo', 
              qrVinculacion: null, 
              numeroWhatsapp: numero,
              fechaVinculacion: new Date()
            })
            .where(eq(schema.whatsappSesiones.usuarioId, id))
            .run();
    }
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return;
    for (const msg of messages) {
       if (!msg.message || msg.key.fromMe) continue;
       
       // Procesar Imagen
       const imageMsg = msg.message.imageMessage;
       if (imageMsg) {
          const remoteJid = msg.key.remoteJid;
          const numeroTelefono = remoteJid.split("@")[0];
          console.log(`[WhatsApp] Imagen de ${numeroTelefono}`);
          
          const { downloadContentFromMessage } = await import('@whiskeysockets/baileys');
          const stream = await downloadContentFromMessage(imageMsg, 'image');
          let buffer = Buffer.from([]);
          for await (const chunk of stream) {
            buffer = Buffer.concat([buffer, chunk]);
          }

          const res = await procesarImagen(buffer, id, numeroTelefono, imageMsg.mimetype);
          if (res.success) {
             await sock.sendMessage(remoteJid, { text: "✅ Foto recibida! Gracias." });
          } else {
             console.error(`[ImageProcessor] ❌ Falla para ${numeroTelefono}: ${res.error}`);
             await sock.sendMessage(remoteJid, { text: `❌ Error guardando foto: ${res.error}` });
          }
       }
    }
  });

  clients.set(id, sock);
  return sock;
}


// --- SERVIDOR HTTP SIMPLE (Puerto 3001 para compatibilidad) ---
const PORT = 3001;
const server = http.createServer(async (req, res) => {
  // CORS simple
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

  const url = new URL(req.url, `http://${req.headers.host}`);

  // Endpoint INIT
  if (url.pathname === '/session/init' && req.method === 'POST') {
     let body = '';
     req.on('data', chunk => body += chunk);
     req.on('end', async () => {
        try {
           const { userId } = JSON.parse(body);
           if (!userId) throw new Error("userId missing");
           getOrCreateBaileysClient(userId); // Async trigger
           res.writeHead(200, { 'Content-Type': 'application/json' });
           res.end(JSON.stringify({ success: true }));
        } catch(e) {
           res.writeHead(500); res.end(JSON.stringify({ error: e.message }));
        }
     });
  } 
  // Endpoint LOGOUT
  else if (url.pathname === '/session/logout' && req.method === 'POST') {
     let body = '';
     req.on('data', chunk => body += chunk);
     req.on('end', async () => {
        try {
           const { userId } = JSON.parse(body);
           const client = clients.get(String(userId));
           if (client) {
              await client.logout();
              clients.delete(String(userId));
           }
           // Forzar limpieza DB
           await db.update(schema.whatsappSesiones)
               .set({ estado: 'desconectado', qrVinculacion: null })
               .where(eq(schema.whatsappSesiones.usuarioId, userId))
               .run();

           res.writeHead(200); res.end(JSON.stringify({ success: true }));
        } catch(e) {
           res.writeHead(500); res.end(JSON.stringify({ error: e.message }));
        }
     });
  } 
  // Endpoint STATUS
  else if (url.pathname === '/health') {
     res.writeHead(200, { 'Content-Type': 'application/json' });
     res.end(JSON.stringify({ status: 'ok', mode: 'single-file-smart' }));
  } else {
     res.writeHead(404); res.end();
  }
});

// Inicializar sesiones existentes
async function init() {
   console.log("🚀 Iniciando Servidor WhatsApp Unificado...");
   try {
     const sessions = await db.select().from(schema.whatsappSesiones).where(eq(schema.whatsappSesiones.estado, 'activo'));
     for (const s of sessions) {
        getOrCreateBaileysClient(s.usuarioId);
     }
     server.listen(PORT, () => console.log(`✅ Servidor escuchando en http://localhost:${PORT}`));
   } catch(e) {
     console.error("Error init:", e);
   }
}

init();
