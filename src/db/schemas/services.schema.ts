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

  // Timestamps
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").default(sql`CURRENT_TIMESTAMP`),
});

export type Service = typeof services.$inferSelect;
export type NewService = typeof services.$inferInsert;
