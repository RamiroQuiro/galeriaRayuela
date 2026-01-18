import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";
import { events } from "./events.schema";
import { images } from "./images.schema";

// Tabla de control de subidas por WhatsApp - rate limiting
export const whatsappSubidas = sqliteTable("whatsapp_subidas", {
  id: integer("id").primaryKey({ autoIncrement: true }),

  // Relación con el evento
  eventoId: integer("evento_id")
    .references(() => events.id)
    .notNull(),

  // Número de teléfono del invitado (sin formato, solo dígitos)
  numeroTelefono: text("numero_telefono").notNull(),

  // Relación con la imagen subida
  imagenId: integer("imagen_id").references(() => images.id),

  // Timestamp de la subida
  fechaSubida: integer("fecha_subida", { mode: "timestamp" })
    .notNull()
    .default(sql`(strftime('%s', 'now'))`),
});

export type WhatsappSubida = typeof whatsappSubidas.$inferSelect;
export type NewWhatsappSubida = typeof whatsappSubidas.$inferInsert;
