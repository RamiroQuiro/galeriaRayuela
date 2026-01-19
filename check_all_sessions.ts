import { db } from "./src/db";
import { whatsappSesiones } from "./src/db/schemas";

async function checkAll() {
  const sessions = await db.select().from(whatsappSesiones).all();
  console.log("--- ALL SESSIONS ---");
  console.log(JSON.stringify(sessions, null, 2));
  process.exit(0);
}

checkAll();
