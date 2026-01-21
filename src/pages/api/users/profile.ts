import type { APIRoute } from "astro";
import { db } from "../../../db";
import { users } from "../../../db/schemas";
import { eq } from "drizzle-orm";

export const POST: APIRoute = async ({ request, locals }) => {
  const user = locals.user;

  if (!user) {
    return new Response(JSON.stringify({ error: "No autorizado" }), { status: 401 });
  }

  try {
    const data = await request.json();
    const { bio, location, whatsapp, isVendor, nombreFantasia } = data;

    // Validación de unicidad para nombreFantasia si se proporciona
    if (nombreFantasia) {
      const existing = await db
        .select()
        .from(users)
        .where(eq(users.nombreFantasia, nombreFantasia))
        .get();
      
      if (existing && existing.id !== user.id) {
        return new Response(JSON.stringify({ error: "El nombre de fantasía ya está en uso" }), { status: 400 });
      }
    }

    await db
      .update(users)
      .set({
        bio,
        location,
        whatsapp,
        nombreFantasia: nombreFantasia?.toLowerCase()?.trim()?.replace(/\s+/g, "-"), // Normalizamos para la URL
        isVendor: isVendor !== undefined ? isVendor : true,
      })
      .where(eq(users.id, user.id));

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error) {
    console.error("Error al actualizar perfil:", error);
    return new Response(JSON.stringify({ error: "Error interno del servidor" }), {
      status: 500,
    });
  }
};
