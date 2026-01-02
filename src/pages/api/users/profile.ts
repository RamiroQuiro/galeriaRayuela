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
    const { bio, location, whatsapp, isVendor } = data;

    await db
      .update(users)
      .set({
        bio,
        location,
        whatsapp,
        isVendor: isVendor !== undefined ? isVendor : true, // Por defecto marcamos como vendedor si está editando su perfil de vendedor
        // Podríamos añadir más campos aquí
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
