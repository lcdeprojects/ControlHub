import { NextResponse } from 'next/server';
import { db, ensureDatabaseSchema } from '@/db';
import * as s from '@/db/schema';
import { eq } from 'drizzle-orm';
import { hashPin, createSession, SESSION_COOKIE_NAME } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    await ensureDatabaseSchema();
    const { searchParams } = new URL(req.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json({ error: 'Token de redefinição é obrigatório' }, { status: 400 });
    }

    const resetRecord = (
      await db.select().from(s.passwordResets).where(eq(s.passwordResets.token, token))
    )[0];

    if (!resetRecord) {
      return NextResponse.json({ error: 'Link de redefinição inválido ou expirado.' }, { status: 404 });
    }

    if (resetRecord.used) {
      return NextResponse.json({ error: 'Este link de redefinição já foi utilizado.' }, { status: 400 });
    }

    const user = (
      await db.select().from(s.users).where(eq(s.users.id, resetRecord.userId))
    )[0];

    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado.' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      user: {
        name: user.name,
        email: user.email,
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
    const { token, newPin } = body;

    if (!token || !newPin) {
      return NextResponse.json({ error: 'Token e nova senha são obrigatórios.' }, { status: 400 });
    }

    const resetRecord = (
      await db.select().from(s.passwordResets).where(eq(s.passwordResets.token, token))
    )[0];

    if (!resetRecord || resetRecord.used) {
      return NextResponse.json({ error: 'Link de redefinição inválido ou já utilizado.' }, { status: 400 });
    }

    const user = (
      await db.select().from(s.users).where(eq(s.users.id, resetRecord.userId))
    )[0];

    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado.' }, { status: 404 });
    }

    const pinHash = hashPin(String(newPin).trim());

    // 1. Atualizar a senha/PIN do usuário
    await db
      .update(s.users)
      .set({ pinHash })
      .where(eq(s.users.id, user.id));

    // 2. Marcar token de redefinição como utilizado
    await db
      .update(s.passwordResets)
      .set({ used: true })
      .where(eq(s.passwordResets.id, resetRecord.id));

    // 3. Criar nova sessão e logar automaticamente
    const sessionId = await createSession(user.id);

    const response = NextResponse.json({
      success: true,
      message: 'Senha alterada com sucesso!',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
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
    console.error('Error resetting password:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
