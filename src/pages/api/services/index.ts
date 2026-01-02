import type { APIRoute } from "astro";
import { db } from "../../../db";
import { services } from "../../../db/schemas";

export const POST: APIRoute = async ({ request, locals }) => {
  const user = locals.user;

  if (!user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
    });
  }

  try {
    const data = await request.json();
    
    // Validate required fields
    if (!data.name || !data.price || !data.unit) {
        return new Response(JSON.stringify({ error: "Missing required fields" }), {
            status: 400,
        });
    }

    // Insert service
    await db.insert(services).values({
      tenantId: user.tenantId,
      name: data.name,
      description: data.description,
      price: parseFloat(data.price),
      unit: data.unit,
      category: data.category,
      isActive: true, // Default active
      images: JSON.stringify([]), // Initialize empty images array
    });

    return new Response(JSON.stringify({ success: true }), {
      status: 201,
    });
  } catch (error) {
    console.error("Error creating service:", error);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
    });
  }
};
