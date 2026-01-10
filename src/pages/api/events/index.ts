import type { APIRoute } from "astro";
import { db } from "../../../db";
import { events } from "../../../db/schemas";
import { createResponse } from "../../../utils/responseAPI";
import {
  generarCodigoAcceso,
  sanitizarNombreArchivo,
} from "../../../utils/helpers";
import {
  puedeCrearEvento,
  obtenerPlanActual,
} from "../../../services/suscripcionService";
import fs from "node:fs/promises";
import path from "node:path";
import { Buffer } from "node:buffer";
import { eq } from "drizzle-orm";

export const POST: APIRoute = async ({ request, locals }) => {
  if (!locals.user) {
    return createResponse(401, "No autorizado");
  }

  try {
    const validacion = await puedeCrearEvento(locals.user.id);

    if (!validacion.puede) {
      return createResponse(
        403,
        validacion.razon || "No puedes crear más eventos",
        {
          eventosActuales: validacion.eventosActuales,
          maxEventos: validacion.maxEventos,
          requiereUpgrade: true,
        }
      );
    }

    const formData = await request.formData();
    const nombre = formData.get("name") as string;
    const imagenPortada = formData.get("coverImage") as File | null;

    if (!nombre) {
      return createResponse(400, "Se requiere un nombre para el evento");
    }

    let codigoAcceso = generarCodigoAcceso(8);
    let intentos = 0;
    const maxIntentos = 10;
    while (intentos < maxIntentos) {
      const eventoExistente = await db
        .select()
        .from(events)
        .where(eq(events.codigoAcceso, codigoAcceso))
        .get();

      if (!eventoExistente) break;

      codigoAcceso = generarCodigoAcceso(8);
      intentos++;
    }

    const planActual = await obtenerPlanActual(locals.user.id);
    const maxFotos = planActual?.maxFotosPorEvento || 50;

    const nuevoEvento = await db
      .insert(events)
      .values({
        name: nombre,
        tenantId: locals.tenantId || "default",
        codigoAcceso: codigoAcceso,
        maxFotos: maxFotos,
        estado: "activo",
        imagenPortada: null,
      })
      .returning()
      .get();

    if (imagenPortada && imagenPortada.size > 0) {
      const directorioSubida = path.join(
        process.cwd(),
        "storage",
        "uploads",
        nuevoEvento.tenantId,
        nuevoEvento.id.toString(),
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
      
      const virtualPath = `/uploads/${nuevoEvento.tenantId}/${nuevoEvento.id}/portada/${nombreArchivo}`;
      
      await db
        .update(events)
        .set({ imagenPortada: virtualPath })
        .where(eq(events.id, nuevoEvento.id));
        
      nuevoEvento.imagenPortada = virtualPath;
    }

    return createResponse(201, "Evento creado exitosamente", {
      evento: nuevoEvento,
    });
  } catch (error) {
    console.error("Error al crear evento:", error);
    return createResponse(500, "Error interno del servidor");
  }
};
