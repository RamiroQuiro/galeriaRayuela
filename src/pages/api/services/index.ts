import type { APIRoute } from "astro";
import { db } from "../../../db";
import { services } from "../../../db/schemas";
import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";

export const POST: APIRoute = async ({ request, locals }) => {
  const user = locals.user;

  if (!user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const formData = await request.formData();
    const name = formData.get("name") as string;
    const description = formData.get("description") as string;
    const price = formData.get("price") as string;
    const unit = formData.get("unit") as string;
    const category = formData.get("category") as string;
    const imageFile = formData.get("image") as File;

    // Validate required fields
    if (!name || !price || !unit) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    let imageUrl = null;
    if (imageFile && imageFile.size > 0) {
      const buffer = Buffer.from(await imageFile.arrayBuffer());
      const filename = `service-${Date.now()}-${imageFile.name.replace(/\s+/g, "-")}`;
      const uploadDir = path.join(process.cwd(), "public", "uploads", "services");
      
      // Ensure directory exists
      try {
        await mkdir(uploadDir, { recursive: true });
      } catch (e) {
        // Ignore if exists
      }
      
      const uploadPath = path.join(uploadDir, filename);
      await writeFile(uploadPath, buffer);
      imageUrl = `/uploads/services/${filename}`;
    }

    // Insert service
    const inserted = await db.insert(services).values({
      tenantId: user.tenantId,
      name,
      description,
      price: parseFloat(price),
      unit,
      category,
      isActive: true, // Default active
      images: imageUrl ? [imageUrl] : [], // Store as array of strings
    }).returning();

    return new Response(JSON.stringify({ success: true, data: { service: inserted[0] } }), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error creating service:", error);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
