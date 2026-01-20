import { db } from "./src/db/index";
import { whatsappSesiones, events } from "./src/db/schemas";
import { eq } from "drizzle-orm";

async function check() {
  const sessions = await db.select().from(whatsappSesiones).all();
  console.log("--- SESIONES DE WHATSAPP ---");
  sessions.forEach(s => {
    console.log(`Usuario: ${s.usuarioId} | Estado: ${s.estado} | Número: ${s.numeroWhatsapp}`);
  });

  const activeEvents = await db.select().from(events).where(eq(events.estado, 'activo')).all();
  console.log("\n--- EVENTOS ACTIVOS ---");
  activeEvents.forEach(e => {
    console.log(`Evento: ${e.name} | Código: ${e.codigoAcceso} | Tenant: ${e.tenantId}`);
  });
}

check();
