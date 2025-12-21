import type { APIRoute } from "astro";
import { db } from "../../../../db";
import { images } from "../../../../db/schemas";
import { eq, desc } from "drizzle-orm";

// Server-Sent Events para actualizaciones en tiempo real de la galería
export const GET: APIRoute = async ({ params }) => {
  const { id } = params;
  const eventoId = parseInt(id!);

  if (isNaN(eventoId)) {
    return new Response("ID de evento inválido", { status: 400 });
  }

  // Crear stream de Server-Sent Events
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();

      // Función para enviar datos al cliente
      const enviarActualizacion = async () => {
        try {
          // Obtener las últimas imágenes del evento
          const ultimasImagenes = await db
            .select()
            .from(images)
            .where(eq(images.eventId, eventoId))
            .orderBy(desc(images.createdAt))
            .limit(10) // Últimas 10 imágenes
            .all();

          // Enviar datos en formato SSE
          const data = JSON.stringify({
            imagenes: ultimasImagenes,
            timestamp: new Date().toISOString(),
          });

          controller.enqueue(encoder.encode(`data: ${data}\n\n`));
        } catch (error) {
          console.error("Error al obtener imágenes:", error);
        }
      };

      // Enviar actualización inicial
      await enviarActualizacion();

      // Configurar polling cada 5 segundos
      const intervalo = setInterval(enviarActualizacion, 5000);

      // Limpiar cuando el cliente se desconecta
      return () => {
        clearInterval(intervalo);
      };
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
};
