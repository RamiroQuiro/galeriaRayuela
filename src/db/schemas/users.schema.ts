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

  // Timestamps
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
