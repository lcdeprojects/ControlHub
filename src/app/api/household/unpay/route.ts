import { NextResponse } from 'next/server';
import { db, ensureDatabaseSchema } from '@/db';
import * as s from '@/db/schema';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    await ensureDatabaseSchema();
    const body = await request.json();
    const { transactionId } = body;

    if (!transactionId) {
      return NextResponse.json({ success: false, error: 'transactionId é obrigatório' }, { status: 400 });
    }

    const tx = (
      await db
        .select()
        .from(s.transactions)
        .where(eq(s.transactions.id, transactionId))
    )[0];

    if (!tx) {
      return NextResponse.json({ success: false, error: 'Transação não encontrada' }, { status: 404 });
    }

    // 1. Reverter/devolver o saldo para a conta bancária
    if (tx.accountId) {
      const acc = (await db.select().from(s.accounts).where(eq(s.accounts.id, tx.accountId)))[0];
      if (acc) {
        const revertedBalance = (acc.currentBalance || 0) + tx.amount;
        await db
          .update(s.accounts)
          .set({ currentBalance: revertedBalance })
          .where(eq(s.accounts.id, tx.accountId));
      }
    }

    // 2. Deletar a transação
    await db.delete(s.transactions).where(eq(s.transactions.id, transactionId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error unpaying household expense:', error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
