import { BaileysService } from "../services/whatsapp/BaileysService";

/**
 * Script independiente para mantener vivas las sesiones de WhatsApp.
 * Se ejecuta con: tsx src/workers/whatsapp-worker.ts
 */
async function main() {
  console.log("🚀 Iniciando Worker de WhatsApp...");
  
  try {
    // Asegurar que el directorio de sesiones existe
    const sessionsPath = path.join(process.cwd(), "sessions");
    if (!fs.existsSync(sessionsPath)) {
      fs.mkdirSync(sessionsPath, { recursive: true });
    }

    // Inicializar todas las sesiones activas guardadas en la DB
    await BaileysService.initAllSessions();
    
    console.log("✅ Worker de WhatsApp listo y escuchando.");

    // Mantener el proceso vivo y buscar nuevas solicitudes cada 5 segundos
    setInterval(async () => {
      try {
        // Buscar sesiones que necesiten conectarse (estado pendiente o activo pero sin socket)
        const sesiones = await db.select().from(whatsappSesiones);
        // console.log(`[Worker] Verificando ${sesiones.length} sesiones...`);
        
        for (const sesion of sesiones) {
          const socketActivo = BaileysService.getSocket(sesion.usuarioId);
          
          if ((sesion.estado === "activo" || sesion.estado === "pendiente") && !socketActivo) {
             console.log(`[Worker] Conectando usuario: ${sesion.usuarioId} (estado: ${sesion.estado})`);
             await BaileysService.conectar(sesion.usuarioId);
          }
          
          // Manejo de desvinculación solicitada desde la DB (opcional)
          if (sesion.estado === "desconectado" && socketActivo) {
            await BaileysService.logout(sesion.usuarioId);
          }
        }
      } catch (err) {
        console.error("[Worker Polling Error]:", err);
      }
    }, 5000);

  } catch (error) {
    console.error("❌ Error iniciando el worker:", error);
    process.exit(1);
  }
}

// Importar fs y path necesarios para el main renovado
import fs from "fs";
import path from "path";
import { db } from "../db";
import { whatsappSesiones } from "../db/schemas";

// Manejo de errores globales
process.on("uncaughtException", (err) => {
  console.error("🔥 Excepción no capturada:", err);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("🔥 Promesa rechazada no manejada:", promise, "razón:", reason);
});

main();
