import { db } from "./src/db";
import { whatsappSesiones } from "./src/db/schemas";
import { eq } from "drizzle-orm";

async function simulateVincular(userId: string) {
  console.log(`🧪 Simulando vinculación para: ${userId}`);
  try {
    const existing = await db.select().from(whatsappSesiones).where(eq(whatsappSesiones.usuarioId, userId)).get();
    if (existing) {
      console.log("Ya existe, borrando para limpiar...");
      await db.delete(whatsappSesiones).where(eq(whatsappSesiones.usuarioId, userId)).run();
    }
    
    await db.insert(whatsappSesiones).values({
      usuarioId: userId,
      estado: "pendiente",
    }).run();
    
    console.log("✅ Sesión creada exitosamente.");
    
    const check = await db.select().from(whatsappSesiones).where(eq(whatsappSesiones.usuarioId, userId)).get();
    console.log("Check DB:", check);
  } catch (error) {
    console.error("❌ Error en simulación:", error);
  }
  process.exit(0);
}

simulateVincular("admin-id");
