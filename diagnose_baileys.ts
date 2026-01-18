import { BaileysService } from "./src/services/whatsapp/BaileysService";
import { db } from "./src/db";
import { whatsappSesiones, users } from "./src/db/schemas";
import { eq } from "drizzle-orm";

async function diagnose() {
  console.log("🔍 Iniciando Diagnóstico de Baileys...");

  // 0. Obtener un usuario real para evitar error de Foreign Key
  const existingUser = await db.select().from(users).limit(1).get();
  if (!existingUser) {
    console.error("❌ No se encontraron usuarios en la base de datos para probar.");
    process.exit(1);
  }
  const userId = existingUser.id;
  console.log(`👤 Usando usuario existente: ${userId} (${existingUser.username})`);

  // 1. Limpiar estado previo
  console.log("🧹 Limpiando sesión de prueba...");
  try {
    await db.delete(whatsappSesiones).where(eq(whatsappSesiones.usuarioId, userId)).run();
    await BaileysService.logout(userId);
  } catch (e) {
    console.log("No había sesión previa o error al limpiar (ignorable):", e);
  }

  // 2. Crear entrada en DB
  console.log("📝 Reservando sesión en DB...");
  await db.insert(whatsappSesiones).values({
    usuarioId: userId,
    estado: "pendiente"
  }).run();

  // 3. Iniciar conexión
  console.log("🚀 Intentando conectar con Baileys...");
  try {
    const sock = await BaileysService.conectar(userId);
    console.log("✅ Socket creado. Esperando eventos...");

    // Monitorear DB por 30 segundos
    let checks = 0;
    const interval = setInterval(async () => {
      checks++;
      const session = await db.select().from(whatsappSesiones).where(eq(whatsappSesiones.usuarioId, userId)).get();
      if (session?.qrVinculacion) {
        console.log("\n🎉 ¡ÉXITO! QR Generado y guardado en DB:");
        console.log(session.qrVinculacion.substring(0, 50) + "...");
        clearInterval(interval);
        process.exit(0);
      } else {
        process.stdout.write(".");
      }

      if (checks > 30) {
        console.log("\n❌ TIEMPO AGOTADO: El QR no se generó después de 30 segundos.");
        clearInterval(interval);
        process.exit(1);
      }
    }, 1000);

  } catch (error) {
    console.error("\n❌ ERROR FATAL al conectar:", error);
    process.exit(1);
  }
}

diagnose();
