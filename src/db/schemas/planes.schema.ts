import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

// Tabla de planes disponibles - Configuración de productos
export const planes = sqliteTable("planes", {
  id: text("id").primaryKey(), // 'gratis', 'basico', 'premium', 'empresarial'

  // Información del plan
  nombre: text("nombre").notNull(),
  descripcion: text("descripcion"),

  // Precio en centavos (ARS)
  precioMensual: integer("precio_mensual").notNull(), // Ej: 1200000 = $12,000 ARS

  // Límites del plan
  maxEventos: integer("max_eventos").notNull(), // Eventos activos simultáneos
  maxFotosPorEvento: integer("max_fotos_por_evento").notNull(),

  // Características (JSON array de strings)
  caracteristicas: text("caracteristicas").notNull(),

  // Control
  activo: integer("activo", { mode: "boolean" }).default(true),
  orden: integer("orden").default(0), // Para ordenar en UI
});

export type Plan = typeof planes.$inferSelect;
export type NewPlan = typeof planes.$inferInsert;
