import { NextResponse } from 'next/server';
import { db } from '@/db';
import { sql } from 'drizzle-orm';
import { getAuthUserFromRequest } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const authUser = await getAuthUserFromRequest(req);
    if (!authUser || authUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Acesso negado. Apenas administradores podem migrar dados.' }, { status: 403 });
    }

    const body = await req.json();
    const { fromUserId = 'usr_default', toUserId } = body;

    if (!toUserId) {
      return NextResponse.json({ error: 'O ID do usuário de destino é obrigatório' }, { status: 400 });
    }

    // Executa transferência de registros no banco de dados
    await db.run(sql`UPDATE accounts SET user_id = ${toUserId} WHERE user_id = ${fromUserId}`);
    await db.run(sql`UPDATE credit_cards SET user_id = ${toUserId} WHERE user_id = ${fromUserId}`);
    await db.run(sql`UPDATE categories SET user_id = ${toUserId} WHERE user_id = ${fromUserId} AND (is_system IS NULL OR is_system = 0)`);
    await db.run(sql`UPDATE merchants SET user_id = ${toUserId} WHERE user_id = ${fromUserId}`);
    await db.run(sql`UPDATE installment_purchases SET user_id = ${toUserId} WHERE user_id = ${fromUserId}`);
    await db.run(sql`UPDATE transactions SET user_id = ${toUserId} WHERE user_id = ${fromUserId}`);
    await db.run(sql`UPDATE transfers SET user_id = ${toUserId} WHERE user_id = ${fromUserId}`);
    await db.run(sql`UPDATE recurring_transactions SET user_id = ${toUserId} WHERE user_id = ${fromUserId}`);
    await db.run(sql`UPDATE budgets SET user_id = ${toUserId} WHERE user_id = ${fromUserId}`);
    await db.run(sql`UPDATE investments SET user_id = ${toUserId} WHERE user_id = ${fromUserId}`);

    return NextResponse.json({
      success: true,
      message: `Todos os dados do perfil ${fromUserId} foram transferidos com sucesso para o usuário ${toUserId}.`,
    });
  } catch (error: any) {
    console.error('Migrate data error:', error);
    return NextResponse.json({ error: error.message || 'Erro ao migrar dados' }, { status: 500 });
  }
}
