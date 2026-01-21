import type { APIRoute } from "astro";
import { eq } from "drizzle-orm";
import { createResponse } from "../../../../utils/responseAPI";
import { db } from "../../../../db";
import { events } from "../../../../db/schemas";

export const POST: APIRoute = async ({ params, locals }) => {
  const { id } = params;
  
  const user = (locals as any).user;
  const tenantId = (locals as any).tenantId;

  if (!user || !tenantId) {
    return createResponse(401, "No autorizado");
  }

  try {
    const eventId = parseInt(id!);
    if (isNaN(eventId)) {
       return createResponse(400, "ID de evento inválido");
    }
    
    // 1. Obtener el evento para validar pertenencia
    const event = await db.select().from(events).where(eq(events.id, eventId)).get();
    
    if (!event || event.tenantId !== tenantId) {
      return createResponse(404, "Evento no encontrado o no autorizado");
    }

    // 2. Transacción: Desactivar todos los demás y activar este
    await db.transaction(async (tx: any) => {
      // Desactivar todos los eventos de este tenant para el campo esPrincipal
      await tx.update(events)
        .set({ esPrincipal: 0 })
        .where(eq(events.tenantId, tenantId));
      
      // Activar el seleccionado
      await tx.update(events)
        .set({ esPrincipal: 1 })
        .where(eq(events.id, eventId));
    });

    return createResponse(200, `Evento "${event.name}" establecido como principal para QR Permanente.`);

  } catch (error: any) {
    console.error("Error en toggle-principal:", error);
    return createResponse(500, "Error interno del servidor");
  }
};
