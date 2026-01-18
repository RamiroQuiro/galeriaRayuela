import { emitEvent } from '@/lib/sse/sse';
import { createResponse } from '@/utils/responseAPI';
import type { APIRoute } from 'astro';

/**
 * POST /api/whatsapp/webhook
 * Recibe notificaciones del servidor standalone y las retransmite por SSE
 */
export const POST: APIRoute = async ({ request }) => {
    try {
        const body = await request.json();
        const { tipo, centroMedicoId, payload } = body;

        if (tipo === 'nuevo_mensaje') {
            console.log('[Webhook] Retransmitiendo mensaje SSE para centro:', centroMedicoId);
            emitEvent('whatsapp:message', payload, { centroMedicoId });
        }

        return createResponse(200, 'Webhook procesado');
    } catch (error: any) {
        console.error('[Webhook] Error:', error.message);
        return createResponse(500, 'Error procesando webhook');
    }
};
