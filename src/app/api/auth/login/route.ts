import { NextResponse } from 'next/server';
import { db } from '@/db';
import * as s from '@/db/schema';
import { eq } from 'drizzle-orm';
import { verifyPin, createSession, SESSION_COOKIE_NAME } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, pin } = body;

    if (!email || !pin) {
      return NextResponse.json({ error: 'E-mail e PIN/Senha são obrigatórios' }, { status: 400 });
    }

    let normalizedEmail = String(email).trim().toLowerCase();
    if (normalizedEmail === 'lucasconto') {
      normalizedEmail = 'lucasconto@controlhub.app';
    }

    let user = await db.query.users.findFirst({
      where: eq(s.users.email, normalizedEmail),
    });

    if (!user && (normalizedEmail.includes('lucasconto'))) {
      user = await db.query.users.findFirst({
        where: eq(s.users.id, 'usr_admin_lucas'),
      });
    }

    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 401 });
    }

    const isValid = verifyPin(String(pin).trim(), user.pinHash);
    if (!isValid) {
      return NextResponse.json({ error: 'PIN/Senha incorreto' }, { status: 401 });
    }

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
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60, // 30 dias
    });

    return response;
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json({ error: error.message || 'Erro ao realizar login' }, { status: 500 });
  }
}
