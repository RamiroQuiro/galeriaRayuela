import { db } from "./src/db";
import { whatsappSesiones } from "./src/db/schemas";

async function checkSessions() {
  const sessions = await db.select().from(whatsappSesiones).all();
  console.log("--- WhatsApp Sessions ---");
  console.log(JSON.stringify(sessions, null, 2));
  process.exit(0);
}

checkSessions();
