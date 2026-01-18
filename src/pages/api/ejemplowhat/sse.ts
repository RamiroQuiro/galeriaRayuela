import type { APIRoute } from 'astro';

let clients: Set<ReadableStreamDefaultController> = new Set();

export const GET: APIRoute = async ({ request }) => {
  const stream = new ReadableStream({
    start(controller) {
      clients.add(controller);

      // Send initial connection message
      controller.enqueue(`data: ${JSON.stringify({ type: 'connected' })}\n\n`);

      // Keep-alive ping every 30 seconds
      const interval = setInterval(() => {
        try {
          controller.enqueue(`: ping\n\n`);
        } catch {
          clearInterval(interval);
        }
      }, 30000);

      // Cleanup on close
      request.signal.addEventListener('abort', () => {
        clearInterval(interval);
        clients.delete(controller);
        try {
          controller.close();
        } catch {
          // Already closed
        }
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
};

// Export function to emit events
export function emitWhatsAppEvent(data: any) {
  const message = `data: ${JSON.stringify(data)}\n\n`;
  clients.forEach(controller => {
    try {
      controller.enqueue(message);
    } catch (error) {
      console.error('[SSE] Error sending event:', error);
      clients.delete(controller);
    }
  });
}
