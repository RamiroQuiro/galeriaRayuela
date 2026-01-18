import { db } from "./src/db";
import { users } from "./src/db/schemas";

async function checkUsers() {
  const allUsers = await db.select({ id: users.id, username: users.username }).from(users).all();
  console.log("--- All Users ---");
  console.log(JSON.stringify(allUsers, null, 2));
  process.exit(0);
}

checkUsers();
