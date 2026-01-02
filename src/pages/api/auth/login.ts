import type { APIRoute } from 'astro';
import { db } from '../../../db';
import { users } from '../../../db/schemas';
import { eq } from 'drizzle-orm';
import { createResponse } from '../../../utils/responseAPI';
import { lucia } from '../../../auth';
import { verify } from '@node-rs/argon2';

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const body = await request.json();
    const { username, password } = body;

    const user = await db.select().from(users).where(eq(users.username, username)).get();

    if (!user) {
      return createResponse(401, 'Invalid credentials');
    }

    const validPassword = await verify(user.password, password);
    if (!validPassword) {
        return createResponse(401, 'Invalid credentials');
    }

    const session = await lucia.createSession(user.id, {});
    const sessionCookie = lucia.createSessionCookie(session.id);
    cookies.set(sessionCookie.name, sessionCookie.value, sessionCookie.attributes);

    return createResponse(200, 'Login successful', { 
        user: { username: user.username, tenantId: user.tenantId, isAdmin: user.isAdmin },
        redirect: user.isAdmin ? '/admin' : '/dashboard'
    });
  } catch (error) {
    console.error(error);
    return createResponse(500, 'Internal Server Error');
  }
};
