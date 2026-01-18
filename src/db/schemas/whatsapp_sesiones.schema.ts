import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";
import { users } from "./users.schema";

// Tabla de sesiones de WhatsApp - una por organizador
export const whatsappSesiones = sqliteTable("whatsapp_sesiones", {
  id: integer("id").primaryKey({ autoIncrement: true }),

  // Relación con el usuario (organizador)
  usuarioId: text("usuario_id")
    .references(() => users.id)
    .notNull()
    .unique(), // Un usuario solo puede tener una sesión activa

  // Información del número vinculado
  numeroWhatsapp: text("numero_whatsapp"),

  // Credenciales de sesión de Baileys (JSON encriptado)
  credencialesSesion: text("credenciales_sesion"), // JSON stringificado y encriptado

  // QR temporal para vinculación (se borra después de conectar)
  qrVinculacion: text("qr_vinculacion"),

  // Estado de la conexión
  estado: text("estado", {
    enum: ["pendiente", "activo", "desconectado", "error"],
  })
    .notNull()
    .default("pendiente"),

  // Timestamps
  fechaVinculacion: integer("fecha_vinculacion", { mode: "timestamp" }),
  ultimaActividad: integer("ultima_actividad", { mode: "timestamp" }),
  created_at: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(strftime('%s', 'now'))`),
});

export type WhatsappSesion = typeof whatsappSesiones.$inferSelect;
export type NewWhatsappSesion = typeof whatsappSesiones.$inferInsert;
