import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";
import { events } from "./events.schema";

// Tabla de imágenes - fotos subidas por invitados a cada evento
export const images = sqliteTable("images", {
  id: integer("id").primaryKey({ autoIncrement: true }),

  // Relación con el evento
  eventId: integer("event_id")
    .references(() => events.id)
    .notNull(),

  // Rutas de archivos
  path: text("path").notNull(), // Ruta de la imagen original
  thumbnail: text("thumbnail"), // Ruta de la miniatura (300x300)

  // Información del invitado (opcional)
  nombreInvitado: text("nombre_invitado"),

  // Metadatos del archivo
  tamanioBytes: integer("tamanio_bytes"), // Tamaño del archivo en bytes

  // Timestamps
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export type Image = typeof images.$inferSelect;
export type NewImage = typeof images.$inferInsert;
