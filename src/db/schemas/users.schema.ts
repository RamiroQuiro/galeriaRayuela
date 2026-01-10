import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

// Tabla de usuarios - organizadores de eventos que compran el servicio
export const users = sqliteTable("users", {
  id: text("id").primaryKey(),

  // Credenciales de acceso
  username: text("username").notNull().unique(),
  password: text("password").notNull(),

  // Información personal
  email: text("email"),
  nombreCompleto: text("nombre_completo"),

  // Multi-tenancy
  tenantId: text("tenant_id").notNull(),

  // Plan asignado (preparado para sistema de planes - Fase 8)
  planId: text("plan_id"), // null = plan gratuito por defecto

  // Suscripción activa
  suscripcionActivaId: integer("suscripcion_activa_id"),

  // Perfil de Vendedor (Marketplace)
  isAdmin: integer("is_admin", { mode: "boolean" }).default(false),
  isVendor: integer("is_vendor", { mode: "boolean" }).default(false),
  bio: text("bio"),
  location: text("location"),
  whatsapp: text("whatsapp"),
  nombreFantasia: text("nombre_fantasia"), 
  avatar: text("avatar"), 
  instagram: text("instagram"), 
  alias_mp: text("alias_mp"), 
  cbu: text("cbu"), 
  rating: integer("rating").default(0),
  created_at: integer('created_at', { mode: 'timestamp' })
      .notNull()
      .default(sql`(strftime('%s', 'now'))`),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
