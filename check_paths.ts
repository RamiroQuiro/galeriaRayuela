import { db } from "./src/db/index";
import { events, images } from "./src/db/schemas";

async function check() {
  const evs = await db.select().from(events).all();
  console.log("--- EVENTOS ---");
  evs.forEach(e => {
    console.log(`ID: ${e.id} | Name: ${e.name} | Acceso: ${e.codigoAcceso} | Tenant: ${e.tenantId}`);
  });

  const imgs = await db.select().from(images).limit(5).all();
  console.log("\n--- ÚLTIMAS 5 IMÁGENES ---");
  imgs.forEach(i => {
    console.log(`ID: ${i.id} | EventID: ${i.eventId} | Path: ${i.path}`);
  });
}

check();
