import { NextResponse } from 'next/server';
import { getAuthUserFromRequest } from '@/lib/auth';
import { db, ensureDatabaseSchema } from '@/db';
import * as s from '@/db/schema';
import { eq } from 'drizzle-orm';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    await ensureDatabaseSchema();
    const adminUser = await getAuthUserFromRequest(req);

    if (!adminUser || adminUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Acesso restrito ao administrador' }, { status: 403 });
    }

    const body = await req.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json({ error: 'ID do usuário é obrigatório' }, { status: 400 });
    }

    const targetUser = (
      await db.select().from(s.users).where(eq(s.users.id, userId))
    )[0];

    if (!targetUser) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    const token = `rst_token_${crypto.randomBytes(16).toString('hex')}`;
    const resetId = `rst_${Date.now()}`;

    await db.insert(s.passwordResets).values({
      id: resetId,
      userId: targetUser.id,
      token,
      used: false,
      createdBy: adminUser.id,
    });

    const host = req.headers.get('host') || 'localhost:3000';
    const protocol = host.includes('localhost') ? 'http' : 'https';
    const resetUrl = `${protocol}://${host}/reset-password?token=${token}`;

    return NextResponse.json({
      success: true,
      reset: {
        id: resetId,
        userName: targetUser.name,
        userEmail: targetUser.email,
        token,
        resetUrl,
      },
    });
  } catch (error) {
    console.error('Error generating password reset link:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
