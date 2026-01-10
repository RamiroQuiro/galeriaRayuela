import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

// Tabla de Servicios - Lo que los vendedores ofrecen en el marketplace
export const services = sqliteTable("services", {
  id: integer("id").primaryKey({ autoIncrement: true }),

  // Vendedor (Organizador que ofrece el servicio)
  tenantId: text("tenant_id").notNull(),

  // Detalles del servicio
  name: text("name").notNull(),
  description: text("description"),

  // Precios
  price: real("price").notNull(),
  currency: text("currency").default("ARS"),
  unit: text("unit").notNull(), // 'hora', 'evento', 'foto', 'persona'

  // Media
  images: text("images", { mode: "json" }), // Array de URLs de imágenes

  // Estado
  isActive: integer("is_active", { mode: "boolean" }).default(true),
  category: text("category"), // 'fotografia', 'catering', 'dj', 'salon'

  created_at: integer('created_at', { mode: 'timestamp' })
      .notNull()
      .default(sql`(strftime('%s', 'now'))`),
  updated_at: integer('updated_at', { mode: 'timestamp' })
      .notNull()
      .default(sql`(strftime('%s', 'now'))`),
});

export type Service = typeof services.$inferSelect;
export type NewService = typeof services.$inferInsert;
