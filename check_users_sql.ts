import { db } from "./src/db/index";
import { sql } from "drizzle-orm";

async function checkUsers() {
  const users = await db.all(sql`SELECT * FROM user`); // Tabla suele ser 'user' o 'users'
  console.log("--- USUARIOS ---");
  console.log(users);
}

checkUsers();
