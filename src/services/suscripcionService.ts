import { db } from "../db";
import { users, suscripciones, planes, events, images } from "../db/schemas";
import { eq, and, count } from "drizzle-orm";

/**
 * Obtiene el plan actual de un usuario
 */
export async function obtenerPlanActual(usuarioId: string) {
  const usuario = await db
    .select()
    .from(users)
    .where(eq(users.id, usuarioId))
    .get();

  if (!usuario?.suscripcionActivaId) {
    // Sin suscripción = plan gratis por defecto
    return await db.select().from(planes).where(eq(planes.id, "gratis")).get();
  }

  const suscripcion = await db
    .select()
    .from(suscripciones)
    .where(eq(suscripciones.id, usuario.suscripcionActivaId))
    .get();

  if (!suscripcion || suscripcion.estado !== "activa") {
    // Suscripción inactiva = plan gratis
    return await db.select().from(planes).where(eq(planes.id, "gratis")).get();
  }

  return await db
    .select()
    .from(planes)
    .where(eq(planes.id, suscripcion.planId))
    .get();
}

/**
 * Verifica si un usuario puede crear un nuevo evento
 */
export async function puedeCrearEvento(usuarioId: string): Promise<{
  puede: boolean;
  razon?: string;
  eventosActuales?: number;
  maxEventos?: number;
}> {
  const plan = await obtenerPlanActual(usuarioId);

  if (!plan) {
    return { puede: false, razon: "No se pudo obtener el plan del usuario" };
  }

  // Contar eventos activos del usuario
  const eventosActivos = await db
    .select({ count: count() })
    .from(events)
    .where(and(eq(events.tenantId, usuarioId), eq(events.estado, "activo")))
    .get();

  const totalEventos = eventosActivos?.count || 0;

  if (totalEventos >= plan.maxEventos) {
    return {
      puede: false,
      razon: `Has alcanzado el límite de ${plan.maxEventos} eventos activos de tu ${plan.nombre}`,
      eventosActuales: totalEventos,
      maxEventos: plan.maxEventos,
    };
  }

  return {
    puede: true,
    eventosActuales: totalEventos,
    maxEventos: plan.maxEventos,
  };
}

/**
 * Verifica si se pueden subir más fotos a un evento
 */
export async function puedeSubirFotos(
  eventoId: number,
  cantidad: number
): Promise<{
  puede: boolean;
  razon?: string;
  fotosActuales?: number;
  maxFotos?: number;
}> {
  const evento = await db
    .select()
    .from(events)
    .where(eq(events.id, eventoId))
    .get();

  if (!evento) {
    return { puede: false, razon: "Evento no encontrado" };
  }

  // Contar fotos actuales del evento
  const fotosActuales = await db
    .select({ count: count() })
    .from(images)
    .where(eq(images.eventId, eventoId))
    .get();

  const total = (fotosActuales?.count || 0) + cantidad;

  if (total > evento.maxFotos) {
    return {
      puede: false,
      razon: `Este evento ha alcanzado el límite de ${evento.maxFotos} fotos`,
      fotosActuales: fotosActuales?.count || 0,
      maxFotos: evento.maxFotos,
    };
  }

  return {
    puede: true,
    fotosActuales: fotosActuales?.count || 0,
    maxFotos: evento.maxFotos,
  };
}

/**
 * Activa una suscripción para un usuario
 */
export async function activarSuscripcion(
  usuarioId: string,
  planId: string,
  metodoPago: string,
  idPagoExterno?: string,
  montoPagado?: number
) {
  // Desactivar suscripciones anteriores
  await db
    .update(suscripciones)
    .set({ estado: "cancelada" })
    .where(
      and(
        eq(suscripciones.usuarioId, usuarioId),
        eq(suscripciones.estado, "activa")
      )
    );

  // Crear nueva suscripción
  const fechaInicio = new Date();
  const fechaFin =
    planId === "gratis"
      ? null
      : new Date(fechaInicio.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 días

  const nuevaSuscripcion = await db
    .insert(suscripciones)
    .values({
      usuarioId,
      planId,
      estado: "activa",
      fechaInicio: fechaInicio.toISOString(),
      fechaFin: fechaFin?.toISOString() || null,
      metodoPago,
      idPagoExterno,
      montoPagado,
    })
    .returning()
    .get();

  // Actualizar usuario
  await db
    .update(users)
    .set({
      suscripcionActivaId: nuevaSuscripcion.id,
      planId: planId,
    })
    .where(eq(users.id, usuarioId));

  return nuevaSuscripcion;
}
