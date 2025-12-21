// Utilidades generales para la aplicación

/**
 * Genera un código de acceso único alfanumérico
 * @param longitud - Longitud del código (por defecto 8)
 * @returns Código único en mayúsculas
 */
export function generarCodigoAcceso(longitud: number = 8): string {
  const caracteres = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let codigo = "";

  for (let i = 0; i < longitud; i++) {
    const indiceAleatorio = Math.floor(Math.random() * caracteres.length);
    codigo += caracteres[indiceAleatorio];
  }

  return codigo;
}

/**
 * Formatea bytes a una representación legible (KB, MB, GB)
 * @param bytes - Tamaño en bytes
 * @returns String formateado (ej: "2.5 MB")
 */
export function formatearTamanio(bytes: number): string {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const tamanios = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + tamanios[i];
}

/**
 * Sanitiza un nombre de archivo eliminando caracteres peligrosos
 * @param nombreArchivo - Nombre original del archivo
 * @returns Nombre sanitizado
 */
export function sanitizarNombreArchivo(nombreArchivo: string): string {
  return nombreArchivo.replace(/[^a-zA-Z0-9._-]/g, "_");
}
