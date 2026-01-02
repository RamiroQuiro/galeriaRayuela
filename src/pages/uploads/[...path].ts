import type { APIRoute } from "astro";
import fs from "node:fs/promises";
import path from "node:path";

export const GET: APIRoute = async ({ params }) => {
  const { path: filePath } = params;

  if (!filePath) {
    return new Response("Not Found", { status: 404 });
  }

  // Ruta absoluta al archivo en storage
  const absolutePath = path.join(process.cwd(), "storage", "uploads", filePath);

  try {
    // Verificar si el archivo existe
    await fs.access(absolutePath);
    
    // Leer el archivo
    const fileBuffer = await fs.readFile(absolutePath);
    
    // Obtener extensión para el content-type
    const ext = path.extname(absolutePath).toLowerCase();
    let contentType = "application/octet-stream";
    
    if (ext === ".jpg" || ext === ".jpeg") contentType = "image/jpeg";
    else if (ext === ".png") contentType = "image/png";
    else if (ext === ".gif") contentType = "image/gif";
    else if (ext === ".webp") contentType = "image/webp";
    else if (ext === ".svg") contentType = "image/svg+xml";

    return new Response(fileBuffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    return new Response("Not Found", { status: 404 });
  }
};
