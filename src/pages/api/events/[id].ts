import type { APIRoute } from "astro";
import { db } from "../../../db";
import { events } from "../../../db/schemas";
import { createResponse } from "../../../utils/responseAPI";
import { sanitizarNombreArchivo } from "../../../utils/helpers";
import { eq, and } from "drizzle-orm";
import fs from "node:fs/promises";
import path from "node:path";
import { Buffer } from "node:buffer";

export const PATCH: APIRoute = async ({ params, request, locals }) => {
  const { id } = params;
  const eventId = parseInt(id!);
  const user = locals.user;

  if (!user) {
    return createResponse(401, "No autorizado");
  }

  if (isNaN(eventId)) {
    return createResponse(400, "ID de evento inválido");
  }

  try {
    // Verificar que el evento pertenezca al usuario
    const evento = await db
      .select()
      .from(events)
      .where(and(eq(events.id, eventId), eq(events.tenantId, user.tenantId)))
      .get();

    if (!evento) {
      return createResponse(404, "Evento no encontrado o no tienes permiso");
    }

    const formData = await request.formData();
    const nombre = formData.get("name") as string;
    const imagenPortada = formData.get("coverImage") as File | null;

    const updates: any = {};
    if (nombre) updates.name = nombre;

    // Si hay una nueva imagen de portada
    if (imagenPortada && imagenPortada.size > 0) {
      const directorioSubida = path.join(
        process.cwd(),
        "storage",
        "uploads",
        evento.tenantId,
        evento.id.toString(),
        "portada"
      );

      try {
        await fs.access(directorioSubida);
      } catch {
        await fs.mkdir(directorioSubida, { recursive: true });
      }

      const buffer = await imagenPortada.arrayBuffer();
      const nombreSanitizado = sanitizarNombreArchivo(imagenPortada.name);
      const nombreArchivo = `${Date.now()}-${nombreSanitizado}`;
      const rutaArchivo = path.join(directorioSubida, nombreArchivo);

      await fs.writeFile(rutaArchivo, Buffer.from(buffer));
      
      updates.imagenPortada = `/uploads/${evento.tenantId}/${evento.id}/portada/${nombreArchivo}`;

      // Opcional: Eliminar imagen anterior si existe físicamente
      // Por simplicidad en esta fase lo omitimos para evitar errores de permisos, 
      // pero es una buena práctica.
    }

    if (Object.keys(updates).length > 0) {
      await db
        .update(events)
        .set(updates)
        .where(eq(events.id, eventId));
    }

    return createResponse(200, "Evento actualizado correctamente", {
      evento: { ...evento, ...updates }
    });
  } catch (error) {
    console.error("Error al actualizar evento:", error);
    return createResponse(500, "Error interno del servidor");
  }
};

export const DELETE: APIRoute = async ({ params, locals }) => {
  const { id } = params;
  const eventId = parseInt(id!);
  const user = locals.user;

  if (!user) {
    return createResponse(401, "No autorizado");
  }

  if (isNaN(eventId)) {
    return createResponse(400, "ID de evento inválido");
  }

  try {
    const evento = await db
      .select()
      .from(events)
      .where(and(eq(events.id, eventId), eq(events.tenantId, user.tenantId)))
      .get();

    if (!evento) {
      return createResponse(404, "Evento no encontrado o no tienes permiso");
    }

    // Soft Delete: Marcar como eliminado y guardar fecha
    await db
      .update(events)
      .set({
        estado: "eliminado",
        deleted_at: new Date(),
      })
      .where(eq(events.id, eventId));

    return createResponse(200, "Evento movido a la papelera");
  } catch (error: any) {
    console.error("Error al eliminar evento:", error);
    return createResponse(500, "Error interno del servidor");
  }
};
