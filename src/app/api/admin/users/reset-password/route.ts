import { NextResponse } from 'next/server';
import { db } from '@/db';
import * as s from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getAuthUserFromRequest, hashPin } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const authUser = await getAuthUserFromRequest(req);
    if (!authUser || authUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Acesso negado. Apenas administradores podem resetar senhas.' }, { status: 403 });
    }

    const body = await req.json();
    const { userId, newPin } = body;

    if (!userId || !newPin) {
      return NextResponse.json({ error: 'ID do usuário e novo PIN/Senha são obrigatórios' }, { status: 400 });
    }

    const targetUser = await db.query.users.findFirst({
      where: eq(s.users.id, userId),
    });

    if (!targetUser) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    const newHash = hashPin(String(newPin).trim());

    await db.update(s.users)
      .set({ pinHash: newHash })
      .where(eq(s.users.id, userId));

    return NextResponse.json({
      success: true,
      message: `Senha/PIN do usuário ${targetUser.name} alterado com sucesso.`,
    });
  } catch (error: any) {
    console.error('Admin reset password error:', error);
    return NextResponse.json({ error: error.message || 'Erro ao resetar senha' }, { status: 500 });
  }
}
