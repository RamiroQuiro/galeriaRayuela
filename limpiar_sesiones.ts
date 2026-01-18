import { db } from "./src/db";
import { whatsappSesiones } from "./src/db/schemas";
import fs from "fs";
import path from "path";

async function clearSessions() {
  console.log("🧹 Limpiando sesiones de WhatsApp en DB...");
  try {
    const result = await db.delete(whatsappSesiones).run();
    console.log("✅ Base de datos limpiada. Filas borradas:", result.rowsAffected);

    const sessionsDir = path.join(process.cwd(), "sessions");
    if (fs.existsSync(sessionsDir)) {
      console.log("📂 Borrando carpeta de sesiones físicas...");
      fs.rmSync(sessionsDir, { recursive: true, force: true });
      console.log("✅ Carpeta 'sessions' eliminada.");
    } else {
      console.log("ℹ️ No se encontró carpeta 'sessions' (ya estaba limpia).");
    }

  } catch (error) {
    console.error("❌ Error al limpiar. ¿Tenés el Worker o Studio abierto?", error);
  }
  process.exit(0);
}

clearSessions();

clearSessions();
