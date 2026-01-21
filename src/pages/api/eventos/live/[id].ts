import type { APIRoute } from "astro";
import { db } from "../../../../db";
import { images, messages, winners } from "../../../../db/schemas";
import { eq, and, desc, gt, sql } from "drizzle-orm";
import { createResponse } from "../../../../utils/responseAPI";

export const GET: APIRoute = async ({ params, url, locals }) => {
  const { id } = params; // id del evento (número) o codigoAcceso
  const afterImage = url.searchParams.get("afterImage") || url.searchParams.get("after") || "0";
  const afterMessage = url.searchParams.get("afterMessage") || url.searchParams.get("after") || "0";
  const limit = parseInt(url.searchParams.get("limit") || "50");

  try {
    const eventId = parseInt(id!);
    
    // 1. Obtener imágenes nuevas
    const newImages = await db
      .select()
      .from(images)
      .where(
        and(
          eq(images.eventId, eventId),
          gt(images.id, parseInt(afterImage))
        )
      )
      .orderBy(desc(images.id))
      .limit(limit)
      .all();

    // 2. Obtener mensajes nuevos
    const newMessages = await db
      .select()
      .from(messages)
      .where(
        and(
          eq(messages.eventId, eventId),
          eq(messages.status, "aprobado"),
          gt(messages.id, parseInt(afterMessage))
        )
      )
      .orderBy(desc(messages.id))
      .limit(limit)
      .all();

    // 3. Obtener el ganador más reciente (si ocurrió en los últimos 2 minutos)
    const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);
    const recentWinner = await db
      .select()
      .from(winners)
      .where(
        and(
          eq(winners.eventId, eventId),
          gt(winners.createdAt, Math.floor(twoMinutesAgo.getTime() / 1000))
        )
      )
      .orderBy(desc(winners.id))
      .limit(1)
      .get();

    return createResponse(200, "Live data recuperada", {
      images: newImages,
      messages: newMessages,
      winner: recentWinner
    });

  } catch (error) {
    console.error("Error en live-data API:", error);
    return createResponse(500, "Error interno del servidor");
  }
};
