import type { APIRoute } from "astro";
import { db } from "../../../db";
import { whatsappSesiones } from "../../../db/schemas";
import { createResponse } from "../../../utils/responseAPI";
import { eq } from "drizzle-orm";

/**
 * Retorna el estado actual de la conexión de WhatsApp del usuario.
 */
export const GET: APIRoute = async ({ locals }) => {
  const { user } = locals;
  if (!user) {
    return createResponse(401, "No autorizado");
  }

  // console.log(`[API Estado] Consultando para: ${user.id}`);

  try {
    const sesion = await db
      .select()
      .from(whatsappSesiones)
      .where(eq(whatsappSesiones.usuarioId, user.id))
      .get();

    if (!sesion) {
      return createResponse(200, "Sin sesión configurada", { 
        estado: "no_configurado",
        currentUserId: user.id 
      });
    }

    return createResponse(200, "Estado obtenido", {
      estado: sesion.estado,
      numero: sesion.numeroWhatsapp,
      qr: sesion.qrVinculacion,
      ultimaActividad: sesion.ultimaActividad,
      sessionUserId: sesion.usuarioId,
      currentUserId: user.id
    });
  } catch (error) {
    console.error("Error al obtener estado de WhatsApp:", error);
    return createResponse(500, "Error al obtener estado");
  }
};
