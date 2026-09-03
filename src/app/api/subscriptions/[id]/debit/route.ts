import { NextResponse } from 'next/server';
import { db, ensureDatabaseSchema } from '@/db';
import * as s from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { getAuthUserId } from '@/lib/auth';
import { normalizeTransactionDescription } from '@/lib/engines/matching-algorithm';
import { calculateInvoiceCycle } from '@/lib/engines/invoice-cycle';
import { generateTransactionFingerprint } from '@/lib/engines/fingerprint';

export const dynamic = 'force-dynamic';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await ensureDatabaseSchema();
    const userId = await getAuthUserId(request);
    const { id: subscriptionId } = await params;

    const sub = (
      await db
        .select()
        .from(s.subscriptions)
        .where(and(eq(s.subscriptions.id, subscriptionId), eq(s.subscriptions.userId, userId)))
    )[0];

    if (!sub) {
      return NextResponse.json({ success: false, error: 'Assinatura não encontrada.' }, { status: 404 });
    }

    const today = new Date();
    const compMonth = today.getMonth() + 1;
    const compYear = today.getFullYear();
    const todayStr = today.toISOString().slice(0, 10);

    const usdRate = 5.6;
    let amountInBrl = sub.amount;
    if (sub.currency === 'USD') {
      amountInBrl = Math.round(sub.amount * usdRate * 100) / 100;
    }

    const norm = normalizeTransactionDescription(`Assinatura: ${sub.name}`);
    const fp = generateTransactionFingerprint({
      userId,
      transactionDate: todayStr,
      amount: amountInBrl,
      normalizedDescription: norm.normalizedDescription,
      sourceId: sub.creditCardId || sub.accountId || 'SUB',
    });

    // Verificar se já foi lançada este mês
    const existing = (
      await db
        .select()
        .from(s.transactions)
        .where(and(eq(s.transactions.userId, userId), eq(s.transactions.fingerprint, fp)))
    )[0];

    if (existing) {
      return NextResponse.json({
        success: true,
        alreadyPosted: true,
        message: 'Esta assinatura já foi debitada no extrato deste mês!',
      });
    }

    const transId = `tx_sub_${Date.now()}`;

    if (sub.creditCardId) {
      const card = (
        await db.select().from(s.creditCards).where(eq(s.creditCards.id, sub.creditCardId))
      )[0];

      const cycle = calculateInvoiceCycle(todayStr, card || { closingDay: 3, dueDay: 10 });

      await db.insert(s.transactions).values({
        id: transId,
        userId,
        creditCardId: sub.creditCardId,
        categoryId: sub.categoryId,
        transactionType: 'CREDIT_CARD_PURCHASE',
        amount: amountInBrl,
        transactionDate: todayStr,
        competenceMonth: compMonth,
        competenceYear: compYear,
        billingMonth: cycle.billingMonth,
        billingYear: cycle.billingYear,
        description: `Assinatura: ${sub.name}`,
        normalizedDescription: norm.normalizedDescription,
        paymentMethod: 'CREDIT',
        fingerprint: fp,
        isRecurring: true,
      });
    } else {
      let targetAccountId = sub.accountId;
      if (!targetAccountId) {
        const defaultAcc = (
          await db.select().from(s.accounts).where(eq(s.accounts.userId, userId))
        )[0];
        targetAccountId = defaultAcc ? defaultAcc.id : null;
      }

      await db.insert(s.transactions).values({
        id: transId,
        userId,
        accountId: targetAccountId,
        categoryId: sub.categoryId,
        transactionType: 'EXPENSE',
        amount: amountInBrl,
        transactionDate: todayStr,
        competenceMonth: compMonth,
        competenceYear: compYear,
        billingMonth: compMonth,
        billingYear: compYear,
        description: `Assinatura: ${sub.name}`,
        normalizedDescription: norm.normalizedDescription,
        paymentMethod: 'AUTO_DEBIT',
        fingerprint: fp,
        isRecurring: true,
      });

      if (targetAccountId) {
        const currentAcc = (
          await db.select().from(s.accounts).where(eq(s.accounts.id, targetAccountId))
        )[0];
        if (currentAcc) {
          await db
            .update(s.accounts)
            .set({ currentBalance: currentAcc.currentBalance - amountInBrl })
            .where(eq(s.accounts.id, targetAccountId));
        }
      }
    }

    return NextResponse.json({
      success: true,
      transactionId: transId,
      message: `Cobrança de ${sub.name} (R$ ${amountInBrl.toFixed(2)}) debitada e lançada no extrato do mês!`,
    });
  } catch (error) {
    console.error('Error debiting subscription:', error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
