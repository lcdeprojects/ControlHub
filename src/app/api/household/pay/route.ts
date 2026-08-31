import { NextResponse } from 'next/server';
import { db, ensureDatabaseSchema } from '@/db';
import * as s from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { generateTransactionFingerprint } from '@/lib/engines/fingerprint';
import { normalizeTransactionDescription } from '@/lib/engines/matching-algorithm';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    await ensureDatabaseSchema();
    const body = await request.json();
    const { recurringId, payAllPending, month, year, accountId, paymentDate } = body;

    if (!month || !year) {
      return NextResponse.json({ success: false, error: 'Mês e ano são obrigatórios' }, { status: 400 });
    }

    // Caso 1: Liquidar TODAS as pendências do mês
    if (payAllPending) {
      const recurringList = await db
        .select()
        .from(s.recurringTransactions)
        .where(
          and(
            eq(s.recurringTransactions.userId, 'usr_default'),
            eq(s.recurringTransactions.isActive, true)
          )
        );

      const existingMonthTx = await db
        .select()
        .from(s.transactions)
        .where(
          and(
            eq(s.transactions.userId, 'usr_default'),
            eq(s.transactions.competenceMonth, month),
            eq(s.transactions.competenceYear, year)
          )
        );

      const defaultAccounts = await db.select().from(s.accounts);
      const fallbackAccId = defaultAccounts[0]?.id;

      let paidCount = 0;

      for (const rec of recurringList) {
        const isPaid = existingMonthTx.some(
          (tx) => tx.externalId === rec.id || tx.description === rec.description
        );

        if (!isPaid) {
          const accIdToUse = rec.accountId || fallbackAccId;
          if (!accIdToUse) continue;

          const norm = normalizeTransactionDescription(rec.description);
          const dayStr = String(Math.min(Math.max(rec.dayOfMonth || 5, 1), 28)).padStart(2, '0');
          const monthStr = String(month).padStart(2, '0');
          const txDate = paymentDate || `${year}-${monthStr}-${dayStr}`;

          const txId = `tx_house_${Date.now()}_${rec.id}`;
          const fp = generateTransactionFingerprint({
            userId: 'usr_default',
            sourceId: accIdToUse,
            transactionDate: txDate,
            normalizedDescription: norm.normalizedDescription,
            amount: rec.amount,
          });

          await db.insert(s.transactions).values({
            id: txId,
            userId: 'usr_default',
            accountId: accIdToUse,
            categoryId: rec.categoryId || 'cat_moradia',
            transactionType: 'EXPENSE',
            paymentMethod: 'AUTO_DEBIT',
            description: rec.description,
            normalizedDescription: norm.normalizedDescription,
            amount: rec.amount,
            transactionDate: txDate,
            competenceMonth: month,
            competenceYear: year,
            billingMonth: month,
            billingYear: year,
            fingerprint: fp,
            externalId: rec.id,
            source: 'HOUSEHOLD_RECURRING',
            isRecurring: true,
            notes: 'Custo residencial recorrente baixado',
          });

          // Debitar saldo
          const acc = defaultAccounts.find((a) => a.id === accIdToUse);
          if (acc) {
            await db
              .update(s.accounts)
              .set({ currentBalance: (acc.currentBalance || 0) - rec.amount })
              .where(eq(s.accounts.id, accIdToUse));
          }

          paidCount++;
        }
      }

      return NextResponse.json({ success: true, paidCount });
    }

    // Caso 2: Pagar um item específico
    if (!recurringId) {
      return NextResponse.json({ success: false, error: 'recurringId é obrigatório' }, { status: 400 });
    }

    const rec = (
      await db
        .select()
        .from(s.recurringTransactions)
        .where(eq(s.recurringTransactions.id, recurringId))
    )[0];

    if (!rec) {
      return NextResponse.json({ success: false, error: 'Despesa recorrente não encontrada' }, { status: 404 });
    }

    const accIdToUse = accountId || rec.accountId;
    if (!accIdToUse) {
      return NextResponse.json({ success: false, error: 'Selecione uma conta bancária para debitar' }, { status: 400 });
    }

    const norm = normalizeTransactionDescription(rec.description);
    const dayStr = String(Math.min(Math.max(rec.dayOfMonth || 5, 1), 28)).padStart(2, '0');
    const monthStr = String(month).padStart(2, '0');
    const txDate = paymentDate || `${year}-${monthStr}-${dayStr}`;

    const txId = `tx_house_${Date.now()}`;
    const fp = generateTransactionFingerprint({
      userId: 'usr_default',
      sourceId: accIdToUse,
      transactionDate: txDate,
      normalizedDescription: norm.normalizedDescription,
      amount: rec.amount,
    });

    await db.insert(s.transactions).values({
      id: txId,
      userId: 'usr_default',
      accountId: accIdToUse,
      categoryId: rec.categoryId || 'cat_moradia',
      transactionType: 'EXPENSE',
      paymentMethod: 'AUTO_DEBIT',
      description: rec.description,
      normalizedDescription: norm.normalizedDescription,
      amount: rec.amount,
      transactionDate: txDate,
      competenceMonth: month,
      competenceYear: year,
      billingMonth: month,
      billingYear: year,
      fingerprint: fp,
      externalId: rec.id,
      source: 'HOUSEHOLD_RECURRING',
      isRecurring: true,
      notes: 'Custo residencial recorrente',
    });

    // Debitar saldo da conta bancária
    const acc = (await db.select().from(s.accounts).where(eq(s.accounts.id, accIdToUse)))[0];
    if (acc) {
      const newBal = (acc.currentBalance || 0) - rec.amount;
      await db
        .update(s.accounts)
        .set({ currentBalance: newBal })
        .where(eq(s.accounts.id, accIdToUse));
    }

    return NextResponse.json({ success: true, transactionId: txId });
  } catch (error) {
    console.error('Error paying household expense:', error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
