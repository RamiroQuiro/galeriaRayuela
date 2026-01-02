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
  let intervalo: NodeJS.Timeout;

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();

      const enviarActualizacion = async () => {
        try {
          const ultimasImagenes = await db
            .select()
            .from(images)
            .where(eq(images.eventId, eventoId))
            .orderBy(desc(images.createdAt))
            .limit(10)
            .all();

          const data = JSON.stringify({
            imagenes: ultimasImagenes,
            timestamp: new Date().toISOString(),
          });

          // Solo encolar si el controlador está abierto
          controller.enqueue(encoder.encode(`data: ${data}\n\n`));
        } catch (error: any) {
          // Si el stream se cerró, dejamos de intentar
          if (error.name === 'TypeError' && error.message.includes('closed')) {
            clearInterval(intervalo);
          } else {
            console.error("Error al obtener imágenes:", error);
          }
        }
      };

      await enviarActualizacion();
      intervalo = setInterval(enviarActualizacion, 5000);
    },
    cancel() {
      if (intervalo) clearInterval(intervalo);
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
