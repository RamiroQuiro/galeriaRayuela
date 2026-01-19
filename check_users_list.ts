import { db } from "./src/db";
import { users } from "./src/db/schemas";

async function listUsers() {
  const allUsers = await db.select().from(users).all();
  console.log("--- Users ---");
  console.log(JSON.stringify(allUsers.map(u => ({ id: u.id, username: u.username })), null, 2));
  process.exit(0);
}

listUsers();
