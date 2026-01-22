import type { APIRoute } from "astro";
import { eq, and } from "drizzle-orm";
import { createResponse } from "../../../../../utils/responseAPI";
import { db } from "../../../../../db";
import { events } from "../../../../../db/schemas/events.schema"; // Importación correcta
import { messages } from "../../../../../db/schemas/messages.schema"; // Importación correcta

export const DELETE: APIRoute = async ({ params, locals }) => {
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
    
    // 1. Validar propiedad del evento
    const event = await db.select().from(events).where(eq(events.id, eventId)).get();
    
    if (!event || event.tenantId !== tenantId) {
      return createResponse(404, "Evento no encontrado o no autorizado");
    }

    // 2. Eliminar mensajes
    await db.delete(messages).where(eq(messages.eventId, eventId));

    return createResponse(200, `Mensajes del evento "${event.name}" eliminados correctamente.`);

  } catch (error: any) {
    console.error("Error al resetear mensajes:", error);
    return createResponse(500, "Error interno del servidor");
  }
};
