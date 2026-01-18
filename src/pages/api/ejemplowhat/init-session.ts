import { createResponse } from '@/utils/responseAPI';
import type { APIRoute } from 'astro';

/**
 * POST /api/whatsapp/init-session
 * Proxy para el servidor independiente de WhatsApp
 */
export const POST: APIRoute = async ({ request, locals }) => {
    try {
        const { user, session } = locals;
        if (!session || !user) {
            return createResponse(401, 'No autorizado');
        }

        const centroMedicoId = String((user as any).centroMedicoId);

        // Llamar al servidor independiente (whatsapp-server.mjs)
        try {
            const response = await fetch('http://localhost:5003/init', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ centroMedicoId })
            });

            if (!response.ok) {
                const err = await response.json();
                return createResponse(500, err.msg || 'Error en el servidor de WhatsApp');
            }
        } catch (e) {
            console.error('[API] El servidor de WhatsApp no está corriendo en el puerto 5003');
            return createResponse(503, 'El servicio de WhatsApp está desconectado. Ejecute el servidor independiente.');
        }

        return createResponse(200, 'Sesion de WhatsApp solicitada', {
            centroMedicoId,
            status: 'initializing',
        });
    } catch (error) {
        console.error('Error en init-session:', error);
        return createResponse(500, 'Error interno del servidor');
    }
};
