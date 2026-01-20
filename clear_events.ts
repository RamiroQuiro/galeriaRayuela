import { db } from "./src/db/index";
import { events, images, whatsappSubidas } from "./src/db/schemas";
import fs from "node:fs/promises";
import path from "node:path";

async function clearData() {
  console.log("🧹 Iniciando limpieza de datos...");

  try {
    // 1. Borrar registros de la base de datos
    console.log("- Eliminando fotos de la DB...");
    await db.delete(images).run();
    
    console.log("- Eliminando registros de subidas de WhatsApp...");
    await db.delete(whatsappSubidas).run();
    
    console.log("- Eliminando eventos de la DB...");
    await db.delete(events).run();

    // 2. Limpiar archivos físicos
    const storagePath = path.join(process.cwd(), "storage", "uploads");
    console.log(`- Limpiando carpeta de archivos: ${storagePath}`);
    
    try {
      await fs.rm(storagePath, { recursive: true, force: true });
      await fs.mkdir(storagePath, { recursive: true });
      console.log("✅ Archivos físicos eliminados.");
    } catch (err) {
      console.error("⚠️ Error al limpiar archivos:", err.message);
    }

    console.log("\n✨ Base de Datos limpia (Eventos y Fotos eliminados). Los usuarios se mantienen.");
  } catch (error) {
    console.error("❌ Error durante la limpieza:", error);
  }
}

clearData();
