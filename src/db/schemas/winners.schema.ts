import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { events } from "./events.schema";
import { sql } from "drizzle-orm";

export const winners = sqliteTable("winners", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  eventId: integer("event_id")
    .notNull()
    .references(() => events.id),
  tenantId: text("tenant_id").notNull(),
  winnerNumber: text("winner_number").notNull(),
  prize: text("prize"),
  createdAt: integer("created_at")
    .notNull()
    .default(sql`(strftime('%s', 'now'))`),
});
