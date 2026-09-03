import { NextResponse } from 'next/server';
import { db, ensureDatabaseSchema } from '@/db';
import * as s from '@/db/schema';
import { eq, desc, and } from 'drizzle-orm';
import { getAuthUserId } from '@/lib/auth';
import { normalizeTransactionDescription } from '@/lib/engines/matching-algorithm';
import { calculateInvoiceCycle } from '@/lib/engines/invoice-cycle';
import { generateTransactionFingerprint } from '@/lib/engines/fingerprint';

export const dynamic = 'force-dynamic';

async function autoDebitSubscription(sub: any, userId: string) {
  if (sub.status !== 'ACTIVE') return;

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

  const existing = (
    await db
      .select()
      .from(s.transactions)
      .where(and(eq(s.transactions.userId, userId), eq(s.transactions.fingerprint, fp)))
  )[0];

  if (existing) return;

  const transId = `tx_sub_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

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
}

export async function GET(request: Request) {
  try {
    await ensureDatabaseSchema();
    const userId = await getAuthUserId(request);

    const list = await db
      .select({
        id: s.subscriptions.id,
        name: s.subscriptions.name,
        logoUrl: s.subscriptions.logoUrl,
        icon: s.subscriptions.icon,
        color: s.subscriptions.color,
        amount: s.subscriptions.amount,
        currency: s.subscriptions.currency,
        billingCycle: s.subscriptions.billingCycle,
        billingDay: s.subscriptions.billingDay,
        status: s.subscriptions.status,
        nextBillingDate: s.subscriptions.nextBillingDate,
        notes: s.subscriptions.notes,
        accountId: s.subscriptions.accountId,
        creditCardId: s.subscriptions.creditCardId,
        categoryId: s.subscriptions.categoryId,
        accountName: s.accounts.name,
        cardName: s.creditCards.name,
        categoryName: s.categories.name,
      })
      .from(s.subscriptions)
      .leftJoin(s.accounts, eq(s.subscriptions.accountId, s.accounts.id))
      .leftJoin(s.creditCards, eq(s.subscriptions.creditCardId, s.creditCards.id))
      .leftJoin(s.categories, eq(s.subscriptions.categoryId, s.categories.id))
      .where(eq(s.subscriptions.userId, userId))
      .orderBy(desc(s.subscriptions.createdAt));

    // Garante que todas as assinaturas ativas para o mês corrente estejam debitadas e no extrato!
    for (const sub of list) {
      if (sub.status === 'ACTIVE') {
        await autoDebitSubscription(sub, userId);
      }
    }

    return NextResponse.json({ success: true, subscriptions: list });
  } catch (error) {
    console.error('Error fetching subscriptions:', error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await ensureDatabaseSchema();
    const userId = await getAuthUserId(request);
    const body = await request.json();

    const {
      name,
      logoUrl,
      icon = 'film',
      color = '#e50914',
      amount,
      currency = 'BRL',
      billingCycle = 'MONTHLY',
      billingDay = 1,
      accountId,
      creditCardId,
      categoryId,
      status = 'ACTIVE',
      nextBillingDate,
      notes,
      autoDebitCurrentMonth = true,
    } = body;

    if (!name || amount === undefined || amount === null) {
      return NextResponse.json({ success: false, error: 'Nome e valor são obrigatórios.' }, { status: 400 });
    }

    const subId = `sub_${Date.now()}`;

    const newSub = {
      id: subId,
      userId,
      name,
      logoUrl,
      icon,
      color,
      amount: Number(amount),
      currency,
      billingCycle,
      billingDay: Number(billingDay),
      accountId: accountId || null,
      creditCardId: creditCardId || null,
      categoryId: categoryId || null,
      status,
      nextBillingDate: nextBillingDate || null,
      notes: notes || null,
    };

    await db.insert(s.subscriptions).values(newSub);

    if (autoDebitCurrentMonth && status === 'ACTIVE') {
      await autoDebitSubscription(newSub, userId);
    }

    return NextResponse.json({ success: true, subscriptionId: subId });
  } catch (error) {
    console.error('Error creating subscription:', error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
