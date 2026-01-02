import type { APIRoute } from "astro";
import { db } from "../../../../db";
import { events, images } from "../../../../db/schemas";
import { createResponse } from "../../../../utils/responseAPI";
import { sanitizarNombreArchivo } from "../../../../utils/helpers";
import fs from "node:fs/promises";
import path from "node:path";
import { Buffer } from "node:buffer";
import { eq, count } from "drizzle-orm";

export const POST: APIRoute = async ({ params, request }) => {
  const { id: codigoAcceso } = params;

  if (!codigoAcceso) {
    return createResponse(400, "Código de acceso requerido");
  }

  try {
    // Buscar evento por código de acceso
    const evento = await db
      .select()
      .from(events)
      .where(eq(events.codigoAcceso, codigoAcceso))
      .get();

    if (!evento) {
      return createResponse(404, "Evento no encontrado");
    }

    // Verificar que el evento esté activo
    if (evento.estado !== "activo") {
      return createResponse(410, "Este evento ha finalizado");
    }

    const formData = await request.formData();
    const nombreInvitado = formData.get("nombreInvitado") as string;
    const archivos = formData.getAll("imagenes") as File[];

    // Validar que sean 1 o 2 imágenes
    if (archivos.length < 1 || archivos.length > 2) {
      return createResponse(400, "Debes subir entre 1 y 2 imágenes");
    }

    // Validar tamaño de archivos (5MB máximo)
    const MAX_TAMANIO = 5 * 1024 * 1024; // 5MB
    for (const archivo of archivos) {
      if (archivo.size > MAX_TAMANIO) {
        return createResponse(
          400,
          `La imagen "${archivo.name}" excede el tamaño máximo de 5MB`
        );
      }

      // Validar que sea una imagen
      if (!archivo.type.startsWith("image/")) {
        return createResponse(
          400,
          `El archivo "${archivo.name}" no es una imagen válida`
        );
      }
    }

    // Verificar límite de fotos del evento
    const totalFotos = await db
      .select({ count: count() })
      .from(images)
      .where(eq(images.eventId, evento.id))
      .get();

    const fotosActuales = totalFotos?.count || 0;
    const maxFotos = evento.maxFotos || 100;

    if (fotosActuales + archivos.length > maxFotos) {
      return createResponse(
        400,
        `Este evento ha alcanzado el límite de ${maxFotos} fotos`
      );
    }

    // Crear directorio de subida si no existe - Nueva Estructura
    const directorioSubida = path.join(
      process.cwd(),
      "storage",
      "uploads",
      evento.tenantId,
      evento.id.toString(),
      "galeria"
    );
    
    try {
      await fs.access(directorioSubida);
    } catch {
      await fs.mkdir(directorioSubida, { recursive: true });
    }

    const imagenesGuardadas = [];

    // Guardar cada imagen
    for (const archivo of archivos) {
      const buffer = await archivo.arrayBuffer();
      const nombreSanitizado = sanitizarNombreArchivo(archivo.name);
      const nombreArchivo = `${Date.now()}-${Math.random()
        .toString(36)
        .substring(7)}-${nombreSanitizado}`;
      const rutaArchivo = path.join(directorioSubida, nombreArchivo);

      await fs.writeFile(rutaArchivo, Buffer.from(buffer));

      // Guardar en base de datos - URL virtual que servirá el endpoint [...path].ts
      const imagenGuardada = await db
        .insert(images)
        .values({
          eventId: evento.id,
          path: `/uploads/${evento.tenantId}/${evento.id}/galeria/${nombreArchivo}`,
          nombreInvitado: nombreInvitado || null,
          tamanioBytes: buffer.byteLength,
        })
        .returning()
        .get();

      imagenesGuardadas.push(imagenGuardada);
    }

    return createResponse(201, "Fotos subidas exitosamente", {
      imagenes: imagenesGuardadas,
      totalFotosEvento: fotosActuales + archivos.length,
    });
  } catch (error) {
    console.error("Error al subir fotos:", error);
    return createResponse(500, "Error interno del servidor");
  }
};
