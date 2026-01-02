import type { APIRoute } from 'astro';
import { db } from '../../../db';
import { users } from '../../../db/schemas';
import { eq } from 'drizzle-orm';
import { createResponse } from '../../../utils/responseAPI';
import { lucia } from '../../../auth';
import { hash } from '@node-rs/argon2';
import { generateId } from 'lucia';

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const body = await request.json();
    const { username, email, password } = body;

    // Usar email como username si se proporciona
    const targetUsername = email || username;

    if (!targetUsername || !password) {
        return createResponse(400, 'El email y la contraseña son requeridos');
    }

    const existingUser = await db.select().from(users).where(eq(users.username, targetUsername)).get();

    if (existingUser) {
      return createResponse(400, 'El usuario ya existe');
    }

    const passwordHash = await hash(password, {
      // recommended minimum parameters
      memoryCost: 19456,
      timeCost: 2,
      outputLen: 32,
      parallelism: 1
    });

    const userId = generateId(15);
    const tenantId = generateId(10); 

    await db.insert(users).values({
        id: userId,
        username: targetUsername,
        email: email || targetUsername,
        password: passwordHash,
        tenantId,
        planId: 'gratis' // Asignar plan gratis por defecto
    });

    const session = await lucia.createSession(userId, {});
    const sessionCookie = lucia.createSessionCookie(session.id);
    cookies.set(sessionCookie.name, sessionCookie.value, sessionCookie.attributes);

    return createResponse(201, 'Usuario registrado correctamente', { user: { username: targetUsername, tenantId } });
  } catch (error) {
    console.error('Registration error:', error);
    return createResponse(500, 'Internal Server Error');
  }
};
