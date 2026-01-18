import fs from "node:fs/promises";
import path from "node:path";
import { Buffer } from "node:buffer";
import { db } from "../../db";
import { images, events } from "../../db/schemas";
import { eq, and } from "drizzle-orm";
import { sanitizarNombreArchivo } from "../../utils/helpers";

export class ImageProcessor {
  /**
   * Procesa una imagen recibida por WhatsApp y la guarda en el sistema.
   */
  static async procesarImagenWhatsapp(
    buffer: Buffer,
    usuarioId: string,
    numeroTelefono: string,
    mimetype: string
  ): Promise<{ success: boolean; imageId?: number; error?: string }> {
    try {
      // 1. Encontrar el evento activo para este organizador
      // Si hay varios, tomamos el más reciente que esté activo
      const evento = await db
        .select()
        .from(events)
        .where(
          and(
            eq(events.tenantId, usuarioId),
            eq(events.estado, "activo")
          )
        )
        .orderBy(sql`created_at DESC`) // Usamos sql para el order by si no está importado desc
        .limit(1)
        .get();

      if (!evento) {
        return { success: false, error: "No hay eventos activos para este organizador" };
      }

      // 2. Preparar directorios (Siguiendo la lógica de subir-fotos.ts)
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

      // 3. Generar nombre de archivo
      const extension = mimetype.split("/")[1] || "jpg";
      const nombreArchivo = `${Date.now()}-${Math.random()
        .toString(36)
        .substring(7)}-whatsapp.${extension}`;
      const rutaArchivo = path.join(directorioSubida, nombreArchivo);

      // 4. Guardar archivo físico
      await fs.writeFile(rutaArchivo, buffer);

      // 5. Insertar en DB
      const imagenGuardada = await db
        .insert(images)
        .values({
          eventId: evento.id,
          path: `/uploads/${evento.tenantId}/${evento.id}/galeria/${nombreArchivo}`,
          nombreInvitado: `WhatsApp (${numeroTelefono.slice(-4)})`, // Identificamos origen
          tamanioBytes: buffer.byteLength,
        })
        .returning()
        .get();

      return { success: true, imageId: imagenGuardada.id };
    } catch (error) {
      console.error("Error en ImageProcessor WhatsApp:", error);
      return { success: false, error: "Error interno al procesar imagen" };
    }
  }
}

// Helper para SQL en ImageProcessor si es necesario
import { sql } from "drizzle-orm";
