import type { APIRoute } from "astro";
import { BaileysService } from "../../../services/whatsapp/BaileysService";
import { createResponse } from "../../../utils/responseAPI";

/**
 * Desvincula y cierra la sesión de WhatsApp del usuario.
 */
export const POST: APIRoute = async ({ locals }) => {
  const { user } = locals;
  if (!user) {
    return createResponse(401, "No autorizado");
  }

  try {
    await BaileysService.logout(user.id);
    return createResponse(200, "WhatsApp desvinculado correctamente");
  } catch (error) {
    console.error("Error al desvincular WhatsApp:", error);
    return createResponse(500, "Error al desvincular");
  }
};
