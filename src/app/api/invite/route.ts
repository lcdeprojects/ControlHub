import { NextResponse } from 'next/server';
import { db, ensureDatabaseSchema } from '@/db';
import * as s from '@/db/schema';
import { eq } from 'drizzle-orm';
import { hashPin, createSession, seedDefaultUserCategories, SESSION_COOKIE_NAME } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    await ensureDatabaseSchema();
    const { searchParams } = new URL(req.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json({ error: 'Token de convite é obrigatório' }, { status: 400 });
    }

    const invite = (
      await db.select().from(s.userInvites).where(eq(s.userInvites.token, token))
    )[0];

    if (!invite) {
      return NextResponse.json({ error: 'Convite inválido ou expirado.' }, { status: 404 });
    }

    if (invite.used) {
      return NextResponse.json({ error: 'Este convite já foi utilizado.' }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      invite: {
        id: invite.id,
        name: invite.name,
        email: invite.email,
        role: invite.role,
      },
    });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await ensureDatabaseSchema();
    const body = await req.json();
    const { token, pin, name, avatarColor } = body;

    if (!token || !pin) {
      return NextResponse.json({ error: 'Token de convite e nova senha/PIN são obrigatórios.' }, { status: 400 });
    }

    const invite = (
      await db.select().from(s.userInvites).where(eq(s.userInvites.token, token))
    )[0];

    if (!invite || invite.used) {
      return NextResponse.json({ error: 'Convite inválido ou já utilizado.' }, { status: 400 });
    }

    const userId = `usr_${Date.now()}`;
    const pinHash = hashPin(String(pin).trim());
    const finalName = (name || invite.name).trim();

    const trialEndsAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    // 1. Criar novo usuário
    await db.insert(s.users).values({
      id: userId,
      name: finalName,
      email: invite.email,
      pinHash,
      role: invite.role || 'USER',
      avatarColor: avatarColor || '#6366f1',
      subscriptionStatus: invite.role === 'ADMIN' ? 'ACTIVE' : 'TRIAL',
      trialEndsAt: invite.role === 'ADMIN' ? null : trialEndsAt,
    });

    // 2. Marcar convite como utilizado
    await db
      .update(s.userInvites)
      .set({ used: true })
      .where(eq(s.userInvites.id, invite.id));

    // 3. Inicializar categorias padrão do novo usuário
    await seedDefaultUserCategories(userId).catch(console.error);

    // 4. Criar sessão e logar o usuário automaticamente
    const sessionId = await createSession(userId);

    const response = NextResponse.json({
      success: true,
      user: {
        id: userId,
        name: finalName,
        email: invite.email,
        role: invite.role,
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
    console.error('Error accepting invite:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
