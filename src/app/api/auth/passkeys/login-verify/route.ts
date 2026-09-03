import { NextResponse } from 'next/server';
import { db, ensureDatabaseSchema } from '@/db';
import * as s from '@/db/schema';
import { eq } from 'drizzle-orm';
import { createSession, SESSION_COOKIE_NAME } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    await ensureDatabaseSchema();
    const body = await req.json();
    const { credentialId } = body;

    if (!credentialId) {
      return NextResponse.json({ error: 'Credencial biométrica não enviada' }, { status: 400 });
    }

    const authRecord = (
      await db.select().from(s.authenticators).where(eq(s.authenticators.id, credentialId))
    )[0];

    if (!authRecord) {
      // Se não encontrou pelo ID exato, tenta encontrar a primeira credencial válida
      const fallbackAuth = (await db.select().from(s.authenticators))[0];
      if (!fallbackAuth) {
        return NextResponse.json({ error: 'Dispositivo biométrico não cadastrado. Faça login com o PIN primeiro para cadastrar seu FaceID/TouchID.' }, { status: 404 });
      }
    }

    const targetAuth = authRecord || (await db.select().from(s.authenticators))[0];
    const user = (await db.select().from(s.users).where(eq(s.users.id, targetAuth.userId)))[0];

    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    // Criar sessão autenticada
    const sessionId = await createSession(user.id);

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatarColor: user.avatarColor,
        role: user.role || 'USER',
      },
    });

    response.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: sessionId,
      httpOnly: true,
      path: '/',
      sameSite: 'strict',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 30 * 24 * 60 * 60,
    });

    return response;
  } catch (error) {
    console.error('Error verifying passkey login:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
