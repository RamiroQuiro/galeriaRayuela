import { db } from "./src/db/index";
import { events } from "./src/db/schemas/index";

async function check() {
  const todos = await db.select().from(events).all();
  
  console.log("--- LISTADO DE TODOS LOS EVENTOS EN DB ---");
  todos.forEach(e => {
     console.log(`ID: ${e.id} | Nombre: "${e.name}" | Estado: "${e.estado}" | TenantID: "${e.tenantId}"`);
  });
  
  console.log("\n--- BUSCANDO COINCIDENCIA ---");
  const hardcodedId = "vendedor-id";
  const activo = todos.find(e => e.tenantId === hardcodedId && e.estado === 'activo');
  
  if (activo) {
    console.log(`✅ SÍ existe evento activo para '${hardcodedId}'`);
  } else {
    console.log(`❌ NO MATCH. El servidor busca TenantID='${hardcodedId}' pero tus eventos tienen otros TenantIDs.`);
  }
}

check();
