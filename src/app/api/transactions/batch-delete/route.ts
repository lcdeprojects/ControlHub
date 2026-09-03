import { NextResponse } from 'next/server';
import { db, ensureDatabaseSchema } from '@/db';
import * as s from '@/db/schema';
import { inArray, eq, and } from 'drizzle-orm';
import { getAuthUserId } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    await ensureDatabaseSchema();
    const userId = await getAuthUserId(request);
    const body = await request.json();
    const { ids } = body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ success: false, error: 'Nenhum ID de transação fornecido.' }, { status: 400 });
    }

    // Buscar todas as transações que pertencem a este usuário
    const txList = await db
      .select()
      .from(s.transactions)
      .where(and(inArray(s.transactions.id, ids), eq(s.transactions.userId, userId)));

    if (txList.length === 0) {
      return NextResponse.json({ success: false, error: 'Nenhuma transação encontrada.' }, { status: 404 });
    }

    // Reverter saldos de contas afetadas
    for (const t of txList) {
      if (t.accountId) {
        const acc = (
          await db.select().from(s.accounts).where(eq(s.accounts.id, t.accountId))
        )[0];

        if (acc) {
          let newBal = acc.currentBalance;
          if (t.transactionType === 'INCOME') {
            newBal -= t.amount;
          } else if (t.transactionType === 'EXPENSE') {
            newBal += t.amount;
          }
          await db.update(s.accounts).set({ currentBalance: newBal }).where(eq(s.accounts.id, t.accountId));
        }
      }
    }

    // Excluir os registros em lote
    const validIds = txList.map((t) => t.id);
    await db
      .delete(s.transactions)
      .where(and(inArray(s.transactions.id, validIds), eq(s.transactions.userId, userId)));

    return NextResponse.json({
      success: true,
      count: validIds.length,
      message: `${validIds.length} transação(ões) excluída(s) com sucesso!`,
    });
  } catch (error) {
    console.error('Error batch deleting transactions:', error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
