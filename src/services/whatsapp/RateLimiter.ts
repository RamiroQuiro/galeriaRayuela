import { db } from "../../db";
import { whatsappSubidas } from "../../db/schemas";
import { eq, and, gt, sql } from "drizzle-orm";

export class RateLimiter {
  /**
   * Verifica si un número de teléfono puede subir una foto a un evento específico.
   * Límite: 2 fotos cada 10 minutos por número.
   */
  static async puedeSubir(eventoId: number, numeroTelefono: string): Promise<{ permitido: boolean; esperaMinutos?: number }> {
    const diezMinutosAtras = new Date(Date.now() - 10 * 60 * 1000);

    // Contar subidas de este número en este evento en los últimos 10 minutos
    const subidasRecientes = await db
      .select({ count: sql<number>`count(*)` })
      .from(whatsappSubidas)
      .where(
        and(
          eq(whatsappSubidas.eventoId, eventoId),
          eq(whatsappSubidas.numeroTelefono, numeroTelefono),
          gt(whatsappSubidas.fechaSubida, diezMinutosAtras)
        )
      );

    const cantidad = subidasRecientes[0]?.count || 0;

    if (cantidad >= 2) {
      return { 
        permitido: false, 
        esperaMinutos: 10 // Simplificado para el MVP
      };
    }

    return { permitido: true };
  }

  /**
   * Registra una nueva subida en el historial de rate limiting.
   */
  static async registrarSubida(eventoId: number, numeroTelefono: string, imagenId?: number) {
    await db.insert(whatsappSubidas).values({
      eventoId,
      numeroTelefono,
      imagenId,
      fechaSubida: new Date(),
    });
  }
}
