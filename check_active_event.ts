import { db } from "./src/db/index";
import { events } from "./src/db/schemas/index";
import { eq, and } from "drizzle-orm";

async function check() {
  const userId = "vendedor-id"; // ID hardcodeado de las pruebas
  const evento = await db
        .select()
        .from(events)
        .where(and(eq(events.tenantId, userId), eq(events.estado, 'activo')))
        .get();
  
  if (evento) {
    console.log(`✅ TIENES EVENTO ACTIVO: "${evento.nombre}" (ID: ${evento.id})`);
  } else {
    console.log("❌ NO TIENES EVENTO ACTIVO. Crea uno o activa uno existente.");
  }
}

check();
