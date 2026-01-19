import type { APIRoute } from "astro";
import { db } from "../../../db";
import { whatsappSesiones } from "../../../db/schemas";
import { BaileysService } from "../../../services/whatsapp/BaileysService";
import { createResponse } from "../../../utils/responseAPI";
import { eq } from "drizzle-orm";

/**
 * Inicia el proceso de vinculación de WhatsApp para el usuario actual.
 */
export const POST: APIRoute = async ({ locals }) => {
  const { user } = locals;
  if (!user) {
    return createResponse(401, "No autorizado");
  }

  console.log(`[API Vincular] Solicitud para usuario: ${user.id} (${user.username})`);

  try {
    // 1. Verificar si ya existe una sesión
    const sesionExistente = await db
      .select()
      .from(whatsappSesiones)
      .where(eq(whatsappSesiones.usuarioId, user.id))
      .get();

    if (!sesionExistente) {
      // Crear registro inicial
      await db.insert(whatsappSesiones).values({
        usuarioId: user.id,
        estado: "pendiente",
      }).run();
      console.log(`[API Vincular] Creada nueva sesión para: ${user.id}`);
    } else {
      // Si ya existía, asegurarse de que el estado sea pendiente para que el worker lo tome
      await db.update(whatsappSesiones)
        .set({ estado: "pendiente", qrVinculacion: null })
        .where(eq(whatsappSesiones.usuarioId, user.id))
        .run();
      console.log(`[API Vincular] Reiniciada sesión existente para: ${user.id}`);
    }

    // Ya no llamamos a BaileysService.conectar(user.id) aquí, ni esperamos al worker polling.
    // Invocamos explícitamente al microservicio API.
    try {
      const response = await fetch("http://localhost:3001/session/init", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id }),
      });
      
      if (!response.ok) {
        console.error("Error contactando whatsapp-server:", await response.text());
        // No fallamos fatalmente para no bloquear al usuario, pero es warning.
      }
    } catch (apiError) {
      console.error("No se pudo conectar con el microservicio de WhatsApp (¿está corriendo?):", apiError);
    }

    return createResponse(200, "Solicitud de vinculación registrada");
  } catch (error) {
    console.error("Error al vincular WhatsApp:", error);
    return createResponse(500, "Error al iniciar vinculación");
  }
};
