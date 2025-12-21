import type { APIRoute } from 'astro';
import { db } from '../../../../db';
import { events, images } from '../../../../db/schemas';
import { eq } from 'drizzle-orm';

export const DELETE: APIRoute = async ({ params }) => {
  const { id } = params;
  const eventId = parseInt(id!);

  if (isNaN(eventId)) {
    return new Response(JSON.stringify({ error: 'ID inválido' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    // Primero eliminar todas las imágenes del evento
    await db.delete(images).where(eq(images.eventId, eventId));
    
    // Luego eliminar el evento
    await db.delete(events).where(eq(events.id, eventId));

    return new Response(JSON.stringify({ success: true, message: 'Evento eliminado correctamente' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error al eliminar evento:', error);
    return new Response(JSON.stringify({ error: 'Error al eliminar evento' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
