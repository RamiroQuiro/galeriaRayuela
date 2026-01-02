import { db } from "./index";
import { users, planes, suscripciones } from "./schemas";
import { hash } from "@node-rs/argon2";
import { eq } from "drizzle-orm";

const main = async () => {
  try {
    console.log("🌱 Iniciando seed...");

    // 1. Crear planes predefinidos
    console.log("📦 Creando planes...");

    await db
      .insert(planes)
      .values([
        {
          id: "gratis",
          nombre: "Plan Gratis",
          descripcion: "Perfecto para probar el servicio",
          precioMensual: 0,
          maxEventos: 1,
          maxFotosPorEvento: 30,
          caracteristicas: JSON.stringify([
            "Con marca de agua",
            "1 evento activo",
            "30 fotos por evento",
            "Expira en 7 días",
          ]),
          activo: true,
          orden: 1,
        },
        {
          id: "basico",
          nombre: "Plan Básico",
          descripcion: "Para organizadores ocasionales",
          precioMensual: 1200000, // $12,000 ARS
          maxEventos: 3,
          maxFotosPorEvento: 150,
          caracteristicas: JSON.stringify([
            "Sin marca de agua",
            "3 eventos por mes",
            "150 fotos por evento",
            "QR personalizado",
            "Soporte por email",
          ]),
          activo: true,
          orden: 2,
        },
        {
          id: "premium",
          nombre: "Plan Premium",
          descripcion: "Para profesionales de eventos",
          precioMensual: 2500000, // $25,000 ARS
          maxEventos: 10,
          maxFotosPorEvento: 400,
          caracteristicas: JSON.stringify([
            "Todo del Básico +",
            "10 eventos por mes",
            "400 fotos por evento",
            "Galería en tiempo real",
            "Analytics del evento",
            "Soporte prioritario",
          ]),
          activo: true,
          orden: 3,
        },
        {
          id: "empresarial",
          nombre: "Plan Empresarial",
          descripcion: "Para agencias y empresas grandes",
          precioMensual: 6000000, // $60,000 ARS
          maxEventos: 999, // "Ilimitado"
          maxFotosPorEvento: 1000,
          caracteristicas: JSON.stringify([
            "Todo del Premium +",
            "Eventos ilimitados",
            "1000 fotos por evento",
            "Marca blanca (tu logo)",
            "API access",
            "Soporte 24/7",
            "Gestor de cuenta dedicado",
          ]),
          activo: true,
          orden: 4,
        },
      ])
      .onConflictDoNothing();

    console.log("✅ Planes creados");

    // 2. Crear usuario administrador de prueba
    console.log("👤 Creando usuario admin...");

    const passwordHash = await hash("1234", {
      memoryCost: 19456,
      timeCost: 2,
      outputLen: 32,
      parallelism: 1,
    });

    await db
      .insert(users)
      .values({
        id: "admin-id",
        username: "ramiryexe@hotmail.com",
        password: passwordHash,
        tenantId: "rayuela-360", // Tenant especial para superadmin
        email: "ramiryexe@hotmail.com",
        nombreCompleto: "Administrador Rayuela",
        planId: null,
        suscripcionActivaId: null,
        isAdmin: true,
      })
      .onConflictDoUpdate({
        target: users.id,
        set: {
          username: "ramiryexe@hotmail.com",
          email: "ramiryexe@hotmail.com",
          isAdmin: true
        }
      });

    console.log("✅ Usuario superadmin ('Rayuela 360') creado");

    // 2b. Crear usuario vendedor de prueba
    console.log("👤 Creando usuario vendedor...");
    await db
      .insert(users)
      .values({
        id: "vendedor-id",
        username: "vendedor",
        password: passwordHash,
        tenantId: "vendor-test",
        email: "vendedor@test.com",
        nombreCompleto: "Vendedor de Prueba",
        planId: "premium",
        isVendor: true,
        bio: "Soy un fotógrafo profesional con 10 años de experiencia en eventos.",
        location: "Buenos Aires, Argentina",
      })
      .onConflictDoNothing();

    console.log("✅ Usuario vendedor creado");


    // 3. Asignar plan gratis al admin
    console.log("🎁 Asignando plan gratis...");

    const planGratis = await db
      .select()
      .from(planes)
      .where(eq(planes.id, "gratis"))
      .get();

    if (planGratis) {
      const suscripcionGratis = await db
        .insert(suscripciones)
        .values({
          usuarioId: "admin-id",
          planId: "gratis",
          estado: "activa",
          fechaInicio: new Date().toISOString(),
          fechaFin: null, // Plan gratis no expira
          metodoPago: "gratis",
        })
        .returning()
        .get();

      // Actualizar usuario con suscripción activa
      await db
        .update(users)
        .set({
          suscripcionActivaId: suscripcionGratis.id,
          planId: "gratis",
        })
        .where(eq(users.id, "admin-id"));

      console.log("✅ Plan gratis asignado");
    }

    console.log("\n🎉 Seed completado exitosamente!\n");
    console.log("📊 Resumen:");
    console.log("  - 4 planes creados (Gratis, Básico, Premium, Empresarial)");
    console.log("  - Usuario admin creado (ramiryexe@hotmail.com / 1234)");
    console.log("  - Plan gratis asignado al admin\n");
  } catch (e) {
    console.error("❌ Error en seed:", e);
    throw e;
  }
};

main();
