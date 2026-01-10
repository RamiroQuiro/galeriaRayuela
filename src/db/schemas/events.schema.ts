import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

// Tabla de eventos - cada organizador puede crear múltiples eventos
export const events = sqliteTable("events", {
  id: integer("id").primaryKey({ autoIncrement: true }),

  // Información básica del evento
  name: text("name").notNull(),
  tenantId: text("tenant_id").notNull(), // ID del organizador/usuario dueño

  // Código único para acceso público (usado en URL y QR)
  codigoAcceso: text("codigo_acceso").notNull().unique(),

  // Ruta de la imagen QR generada
  urlQr: text("url_qr"),

  // Imagen de portada
  imagenPortada: text("imagen_portada"),

  // Límites y configuración
  maxFotos: integer("max_fotos").default(100), // Límite de fotos (preparado para planes)

  // Estado del evento: 'activo', 'finalizado', 'pausado'
  estado: text("estado").default("activo"),

  // Fecha del evento (opcional)
  fechaEvento: text("fecha_evento"),

  // Timestamps
  created_at: integer('created_at', { mode: 'timestamp' })
      .notNull()
      .default(sql`(strftime('%s', 'now'))`),
  updated_at: integer('updated_at', { mode: 'timestamp' })
      .notNull()
      .default(sql`(strftime('%s', 'now'))`),
  deleted_at: integer('deleted_at', { mode: 'timestamp' }), // Para Soft Delete (Papelera)
});

export type Event = typeof events.$inferSelect;
export type NewEvent = typeof events.$inferInsert;
