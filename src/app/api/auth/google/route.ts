import { NextResponse } from 'next/server';
import { db, ensureDatabaseSchema } from '@/db';
import * as s from '@/db/schema';
import { eq } from 'drizzle-orm';
import { createSession, seedDefaultUserCategories, SESSION_COOKIE_NAME } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    await ensureDatabaseSchema();
    const body = await req.json();
    const { credential } = body;

    if (!credential) {
      return NextResponse.json({ error: 'Token de credencial do Google é obrigatório' }, { status: 400 });
    }

    // 1. Verificar Token com a API Oficial da Google
    const googleRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${credential}`);
    if (!googleRes.ok) {
      return NextResponse.json({ error: 'Autenticação Google inválida ou token expirado.' }, { status: 401 });
    }

    const payload = await googleRes.json();
    const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

    // 2. Validar se o token foi emitido para a nossa aplicação (aud)
    if (googleClientId && payload.aud !== googleClientId) {
      return NextResponse.json({ error: 'Token do Google não corresponde ao Client ID da aplicação.' }, { status: 403 });
    }

    const email = payload.email ? String(payload.email).trim().toLowerCase() : null;
    const name = payload.name || payload.given_name || 'Usuário Google';

    if (!email) {
      return NextResponse.json({ error: 'E-mail não fornecido pela conta Google' }, { status: 400 });
    }

    // 3. Buscar ou Criar Usuário no Banco
    let user = await db.query.users.findFirst({
      where: eq(s.users.email, email),
    });

    if (!user) {
      const userId = `usr_${crypto.randomUUID()}`;
      const trialEndsAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

      await db.insert(s.users).values({
        id: userId,
        name: name,
        email: email,
        avatarColor: '#10b981',
        role: 'USER',
        subscriptionStatus: 'TRIAL',
        trialEndsAt: trialEndsAt,
      });

      await seedDefaultUserCategories(userId).catch(console.error);

      user = {
        id: userId,
        name: name,
        email: email,
        phoneNumber: null,
        avatarColor: '#10b981',
        role: 'USER',
        subscriptionStatus: 'TRIAL',
        trialEndsAt: trialEndsAt,
        pinHash: null,
        createdAt: new Date().toISOString(),
      };
    }

    if (!user) {
      return NextResponse.json({ error: 'Erro ao identificar ou criar usuário' }, { status: 500 });
    }

    // 4. Criar sessão e setar cookie seguro
    const sessionId = await createSession(user.id);
    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phoneNumber: user.phoneNumber || null,
        avatarColor: user.avatarColor,
        role: user.role,
        subscriptionStatus: user.subscriptionStatus,
        trialEndsAt: user.trialEndsAt,
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
    console.error('Google Auth Route Error:', error);
    return NextResponse.json({ error: error.message || 'Erro ao autenticar com o Google' }, { status: 500 });
  }
}
