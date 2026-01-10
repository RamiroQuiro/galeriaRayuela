import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";
import { users } from "./users.schema";
import { planes } from "./planes.schema";

// Tabla de suscripciones - Relación usuario-plan
export const suscripciones = sqliteTable("suscripciones", {
  id: integer("id").primaryKey({ autoIncrement: true }),

  // Relaciones
  usuarioId: text("usuario_id")
    .references(() => users.id)
    .notNull(),
  planId: text("plan_id")
    .references(() => planes.id)
    .notNull(),

  // Estado de la suscripción
  estado: text("estado").notNull(), // 'activa', 'cancelada', 'vencida', 'pendiente_pago'

  // Fechas
  fechaInicio: text("fecha_inicio").notNull(),
  fechaFin: text("fecha_fin"), // null = indefinida (plan gratis)

  // Información de pago
  metodoPago: text("metodo_pago"), // 'mercadopago', 'transferencia', 'gratis'
  idPagoExterno: text("id_pago_externo"), // ID de transacción de MercadoPago
  montoPagado: integer("monto_pagado"), // En centavos

  // Timestamps
  created_at: integer('created_at', { mode: 'timestamp' })
      .notNull()
      .default(sql`(strftime('%s', 'now'))`),
  updated_at: integer('updated_at', { mode: 'timestamp' })
      .notNull()
      .default(sql`(strftime('%s', 'now'))`),
});

export type Suscripcion = typeof suscripciones.$inferSelect;
export type NewSuscripcion = typeof suscripciones.$inferInsert;
