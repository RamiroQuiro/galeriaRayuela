import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { events } from "./events.schema";
import { sql } from "drizzle-orm";

export const messages = sqliteTable("messages", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  eventId: integer("event_id")
    .notNull()
    .references(() => events.id),
  tenantId: text("tenant_id").notNull(),
  senderNumber: text("sender_number"),
  text: text("text").notNull(),
  status: text("status", { enum: ["pendiente", "aprobado", "oculto"] })
    .notNull()
    .default("aprobado"), // En principio aprobamos directo, después sumamos moderación
  metadata: text("metadata"), // Para colores, emojis, etc.
  createdAt: integer("created_at")
    .notNull()
    .default(sql`(strftime('%s', 'now'))`),
});
