import { NextResponse } from 'next/server';
import { db, ensureDatabaseSchema } from '@/db';
import * as s from '@/db/schema';
import { eq } from 'drizzle-orm';
import { hashPin, createSession, seedDefaultUserCategories, SESSION_COOKIE_NAME } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    await ensureDatabaseSchema();
    const body = await req.json();
    const { name, email, pin, avatarColor = '#10b981' } = body;

    if (!name || !email || !pin) {
      return NextResponse.json({ error: 'Nome, E-mail e Senha/PIN são obrigatórios' }, { status: 400 });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const existingUser = await db.query.users.findFirst({
      where: eq(s.users.email, normalizedEmail),
    });

    if (existingUser) {
      return NextResponse.json({ error: 'Este e-mail já está cadastrado. Faça login para acessar.' }, { status: 400 });
    }

    const userId = `usr_${crypto.randomUUID()}`;
    const pinHash = hashPin(String(pin).trim());
    const trialEndsAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    // 1. Criar novo usuário com 7 Dias de Degustação Grátis (TRIAL)
    await db.insert(s.users).values({
      id: userId,
      name: String(name).trim(),
      email: normalizedEmail,
      pinHash,
      avatarColor,
      role: 'USER',
      subscriptionStatus: 'TRIAL',
      trialEndsAt,
    });

    // 2. Inicializar categorias financeiras padrão
    await seedDefaultUserCategories(userId).catch(console.error);

    // 3. Criar sessão e cookie seguro
    const sessionId = await createSession(userId);
    const response = NextResponse.json({
      success: true,
      user: {
        id: userId,
        name: String(name).trim(),
        email: normalizedEmail,
        avatarColor,
        role: 'USER',
        subscriptionStatus: 'TRIAL',
        trialEndsAt,
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
  } catch (error: any) {
    console.error('Register Route Error:', error);
    return NextResponse.json({ error: error.message || 'Erro ao realizar cadastro' }, { status: 500 });
  }
}
