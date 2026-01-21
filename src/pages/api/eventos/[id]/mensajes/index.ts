import type { APIRoute } from "astro";
import { db } from "../../../../../db";
import { messages, events } from "../../../../../db/schemas";
import { eq } from "drizzle-orm";
import { createResponse } from "../../../../../utils/responseAPI";

export const POST: APIRoute = async ({ params, request }) => {
  const { id } = params; // codigoAcceso del evento

  try {
    const data = await request.json();
    const { text, senderName } = data;

    if (!text || text.trim() === "") {
      return createResponse(400, "El mensaje no puede estar vacío");
    }

    // Buscar el evento para obtener el ID real y el tenantId
    const event = await db
      .select()
      .from(events)
      .where(eq(events.codigoAcceso, id!))
      .get();

    if (!event) {
      return createResponse(404, "Evento no encontrado");
    }

    // Insertar el mensaje
    await db.insert(messages).values({
      eventId: event.id,
      tenantId: event.tenantId,
      senderNumber: senderName || "Invitado Web",
      text: text.trim(),
      status: "aprobado", // Podríamos pasar por moderación después
      metadata: JSON.stringify({ source: "web" }),
    });

    return createResponse(201, "Mensaje enviado correctamente");

  } catch (error) {
    console.error("Error al enviar mensaje web:", error);
    return createResponse(500, "Error interno del servidor");
  }
};
