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
    // Validar límites del plan
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

    // Generar código de acceso único
    let codigoAcceso = generarCodigoAcceso(8);
    let intentos = 0;
    const maxIntentos = 10;

    // Verificar que el código sea único
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

    // Obtener límite de fotos según el plan del usuario
    const planActual = await obtenerPlanActual(locals.user.id);
    const maxFotos = planActual?.maxFotosPorEvento || 50;

    // Guardar imagen de portada si existe
    let rutaImagenPortada: string | null = null;

    if (imagenPortada && imagenPortada.size > 0) {
      const directorioSubida = path.join(
        process.cwd(),
        "public",
        "uploads",
        "portadas"
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
      rutaImagenPortada = `/uploads/portadas/${nombreArchivo}`;
    }

    // Crear evento con los nuevos campos
    const nuevoEvento = await db
      .insert(events)
      .values({
        name: nombre,
        tenantId: locals.tenantId || "default",
        codigoAcceso: codigoAcceso,
        maxFotos: maxFotos, // Límite según plan del usuario
        estado: "activo",
        imagenPortada: rutaImagenPortada,
      })
      .returning()
      .get();

    return createResponse(201, "Evento creado exitosamente", {
      evento: nuevoEvento,
    });
  } catch (error) {
    console.error("Error al crear evento:", error);
    return createResponse(500, "Error interno del servidor");
  }
};
