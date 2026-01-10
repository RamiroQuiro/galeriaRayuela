export const prerender = false;

import { db } from "../../../../db/index";
import { images } from "../../../../db/schemas";
import { eq, desc, gt } from "drizzle-orm";
import type { APIRoute } from "astro";

export const GET: APIRoute = async ({ params, request }) => {
  const eventId = Number(params.id);

  if (!eventId) {
    return new Response(JSON.stringify({ error: "Invalid Event ID" }), { status: 400 });
  }

  try {
    // Optional: Support "since" timestamp for more efficient polling
    // const url = new URL(request.url);
    // const since = url.searchParams.get('since');

    const eventImages = await db
      .select({
        id: images.id,
        path: images.path,
        nombreInvitado: images.nombreInvitado,
        createdAt: images.created_at
      })
      .from(images)
      .where(eq(images.eventId, eventId))
      .orderBy(desc(images.created_at))
      .limit(50) // Limit to recent 50 or so
      .all();
      
    // Transform dates if necessary, mainly dependent on DB driver return type
    const formatted = eventImages.map(img => ({
      ...img,
      createdAt: new Date(img.createdAt)
    }));

    return new Response(JSON.stringify(formatted), {
      status: 200,
      headers: {
        "Content-Type": "application/json"
      }
    });

  } catch (error) {
    console.error("Error fetching images:", error);
    return new Response(JSON.stringify({ error: "Server Error" }), { status: 500 });
  }
};
