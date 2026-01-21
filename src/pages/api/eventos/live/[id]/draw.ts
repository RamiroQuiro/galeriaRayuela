import type { APIRoute } from "astro";
import { db } from "../../../../../db";
import { images, messages, winners, whatsappSubidas } from "../../../../../db/schemas";
import { eq, and, sql } from "drizzle-orm";
import { createResponse } from "../../../../../utils/responseAPI";

export const POST: APIRoute = async ({ params, locals }) => {
  const { id } = params;
  const user = (locals as any).user;
  const tenantId = (locals as any).tenantId;

  if (!user || !tenantId) {
    return createResponse(401, "No autorizado");
  }

  try {
    const eventId = parseInt(id!);
    
    // 1. Obtener todos los números únicos de participantes (fotos + mensajes)
    const participantsImages = await db
      .select({ number: whatsappSubidas.numeroTelefono })
      .from(whatsappSubidas)
      .where(eq(whatsappSubidas.eventoId, eventId))
      .all();

    const participantsMessages = await db
      .select({ number: messages.senderNumber })
      .from(messages)
      .where(eq(messages.eventId, eventId))
      .all();

    const allNumbers = new Set([
      ...participantsImages.map(p => p.number),
      ...participantsMessages.map(p => p.number)
    ].filter(Boolean));

    const uniqueParticipants = Array.from(allNumbers);

    if (uniqueParticipants.length === 0) {
      return createResponse(400, "No hay participantes para el sorteo");
    }

    // 2. Elegir un ganador al azar
    const winnerNumber = uniqueParticipants[Math.floor(Math.random() * uniqueParticipants.length)];

    // 3. Guardar el ganador
    const result = await db.insert(winners).values({
      eventId: eventId,
      tenantId: tenantId,
      winnerNumber: winnerNumber as string,
      prize: "Premio Sorpresa", // Podría venir por body
      createdAt: Math.floor(Date.now() / 1000)
    }).returning();

    return createResponse(200, "¡Sorteo realizado!", result[0]);

  } catch (error) {
    console.error("Error en draw API:", error);
    return createResponse(500, "Error interno del servidor");
  }
};
