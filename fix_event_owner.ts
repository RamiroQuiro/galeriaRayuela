import { db } from "./src/db/index";
import { events } from "./src/db/schemas/index";
import { eq } from "drizzle-orm";

async function fixEvents() {
  const targetUser = "vendedor-id";
  const oldUser = "vendor-test";
  
  console.log(`Reasignando eventos de '${oldUser}' a '${targetUser}'...`);
  
  const result = await db
      .update(events)
      .set({ tenantId: targetUser })
      .where(eq(events.tenantId, oldUser))
      .run();
      
  console.log("Resultado:", result);
  console.log("✅ Eventos corregidos. Ahora el usuario 'vendedor' es el dueño real.");
}

fixEvents();
