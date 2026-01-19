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
    // Delegar al microservicio
    try {
      const response = await fetch("http://localhost:3001/session/logout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id }),
      });
      
      if (!response.ok) {
        console.error("Error contactando whatsapp-server logout:", await response.text());
      }
    } catch (apiError) {
      console.error("No se pudo conectar con el microservicio de WhatsApp:", apiError);
    }
    return createResponse(200, "WhatsApp desvinculado correctamente");
  } catch (error) {
    console.error("Error al desvincular WhatsApp:", error);
    return createResponse(500, "Error al desvincular");
  }
};
