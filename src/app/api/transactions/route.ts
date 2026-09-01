import { NextResponse } from 'next/server';
import { db, ensureDatabaseSchema } from '@/db';
import * as s from '@/db/schema';
import { generateTransactionFingerprint } from '@/lib/engines/fingerprint';
import { normalizeTransactionDescription } from '@/lib/engines/matching-algorithm';
import { calculateInvoiceCycle } from '@/lib/engines/invoice-cycle';
import { generateInstallments } from '@/lib/engines/installment-engine';
import { eq, desc } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await ensureDatabaseSchema();
    const list = await db
      .select({
        id: s.transactions.id,
        description: s.transactions.description,
        amount: s.transactions.amount,
        transactionType: s.transactions.transactionType,
        paymentMethod: s.transactions.paymentMethod,
        transactionDate: s.transactions.transactionDate,
        competenceMonth: s.transactions.competenceMonth,
        competenceYear: s.transactions.competenceYear,
        billingMonth: s.transactions.billingMonth,
        billingYear: s.transactions.billingYear,
        categoryName: s.categories.name,
        categoryIcon: s.categories.icon,
        categoryColor: s.categories.color,
        accountName: s.accounts.name,
        cardName: s.creditCards.name,
      })
      .from(s.transactions)
      .leftJoin(s.categories, eq(s.transactions.categoryId, s.categories.id))
      .leftJoin(s.accounts, eq(s.transactions.accountId, s.accounts.id))
      .leftJoin(s.creditCards, eq(s.transactions.creditCardId, s.creditCards.id))
      .orderBy(desc(s.transactions.transactionDate));

    return NextResponse.json({ success: true, transactions: list });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await ensureDatabaseSchema();
    const body = await request.json();
    const {
      type,
      description,
      amount,
      transactionDate,
      paymentMethod = 'OTHER',
      creditCardId,
      accountId,
      categoryId,
      installmentCount = 1,
      userId = 'usr_default',
    } = body;

    // 1. Garantir que o usuário default exista no banco
    await db
      .insert(s.users)
      .values({
        id: userId,
        name: 'Usuário',
        email: 'usuario@controlhub.app',
      })
      .onConflictDoNothing();

    // 2. Validar se a categoria existe
    let validCategoryId = categoryId || null;
    if (validCategoryId) {
      const catCheck = (await db.select().from(s.categories).where(eq(s.categories.id, validCategoryId)))[0];
      if (!catCheck) validCategoryId = null;
    }

    // 3. Validar se a conta existe
    let validAccountId = accountId || null;
    if (validAccountId) {
      const accCheck = (await db.select().from(s.accounts).where(eq(s.accounts.id, validAccountId)))[0];
      if (!accCheck) validAccountId = null;
    }

    // 4. Validar se o cartão de crédito existe
    let validCreditCardId = creditCardId || null;
    let card = null;
    if (validCreditCardId) {
      card = (await db.select().from(s.creditCards).where(eq(s.creditCards.id, validCreditCardId)))[0];
      if (!card) validCreditCardId = null;
    }

    const norm = normalizeTransactionDescription(description);
    const tDate = new Date(transactionDate + 'T12:00:00');
    const compMonth = tDate.getMonth() + 1;
    const compYear = tDate.getFullYear();

    // Se for compra no cartão com parcelamento (> 1x)
    if (type === 'CREDIT_CARD_PURCHASE' && installmentCount > 1 && validCreditCardId) {
      const cycle = calculateInvoiceCycle(transactionDate, card || { closingDay: 3, dueDay: 10 });
      const purchaseId = `pur_${Date.now()}`;
      const installmentValue = Math.round((amount / installmentCount) * 100) / 100;

      // 1. Criar a compra parcelada original
      await db.insert(s.installmentPurchases).values({
        id: purchaseId,
        userId,
        creditCardId: validCreditCardId,
        categoryId: validCategoryId,
        description,
        normalizedDescription: norm.normalizedDescription,
        totalAmount: amount,
        installmentCount,
        installmentValue,
        purchaseDate: transactionDate,
        firstBillingMonth: cycle.billingMonth,
        firstBillingYear: cycle.billingYear,
        status: 'ACTIVE',
      });

      // 2. Gerar as N parcelas
      const items = generateInstallments({
        purchaseDate: transactionDate,
        totalAmount: amount,
        installmentCount,
        creditCard: card || { closingDay: 3, dueDay: 10 },
      });

      let firstTransId: string | null = null;
      for (const it of items) {
        const instId = `inst_${purchaseId}_${it.installmentNumber}`;
        await db.insert(s.installments).values({
          id: instId,
          installmentPurchaseId: purchaseId,
          installmentNumber: it.installmentNumber,
          totalInstallments: installmentCount,
          amount: it.amount,
          billingMonth: it.billingMonth,
          billingYear: it.billingYear,
          status: 'PENDING',
        });

        // 3. Criar a transação correspondente para ESTA parcela entrar na fatura do mês respectivo
        const transId = `tx_${purchaseId}_${it.installmentNumber}`;
        if (it.installmentNumber === 1) firstTransId = transId;

        const fp = generateTransactionFingerprint({
          userId,
          transactionDate,
          amount: it.amount,
          normalizedDescription: norm.normalizedDescription,
          sourceId: validCreditCardId,
          installmentNumber: it.installmentNumber,
        });

        await db.insert(s.transactions).values({
          id: transId,
          userId,
          creditCardId: validCreditCardId,
          categoryId: validCategoryId,
          installmentId: instId,
          transactionType: 'INSTALLMENT',
          amount: it.amount,
          transactionDate,
          competenceMonth: it.billingMonth,
          competenceYear: it.billingYear,
          billingMonth: it.billingMonth,
          billingYear: it.billingYear,
          description: `${description} (${it.installmentNumber}/${installmentCount})`,
          normalizedDescription: norm.normalizedDescription,
          paymentMethod: 'CREDIT',
          fingerprint: fp,
        });
      }

      return NextResponse.json({ success: true, transactionId: firstTransId, purchaseId });
    }

    // Se for compra à vista no cartão de crédito
    if (type === 'CREDIT_CARD_PURCHASE') {
      const cycle = calculateInvoiceCycle(transactionDate, card || { closingDay: 3, dueDay: 10 });
      const transId = `tx_${Date.now()}`;
      const fp = generateTransactionFingerprint({
        userId,
        transactionDate,
        amount,
        normalizedDescription: norm.normalizedDescription,
        sourceId: validCreditCardId || 'GENERIC',
      });

      await db.insert(s.transactions).values({
        id: transId,
        userId,
        creditCardId: validCreditCardId,
        categoryId: validCategoryId,
        transactionType: 'CREDIT_CARD_PURCHASE',
        amount,
        transactionDate,
        competenceMonth: compMonth,
        competenceYear: compYear,
        billingMonth: cycle.billingMonth,
        billingYear: cycle.billingYear,
        description,
        normalizedDescription: norm.normalizedDescription,
        paymentMethod: 'CREDIT',
        fingerprint: fp,
      });

      return NextResponse.json({ success: true, transactionId: transId });
    }

    // Para despesas bancárias ou receitas
    const transId = `tx_${Date.now()}`;
    const fp = generateTransactionFingerprint({
      userId,
      transactionDate,
      amount,
      normalizedDescription: norm.normalizedDescription,
      sourceId: validAccountId || 'GENERIC',
    });

    await db.insert(s.transactions).values({
      id: transId,
      userId,
      accountId: validAccountId,
      categoryId: validCategoryId,
      transactionType: type,
      amount,
      transactionDate,
      competenceMonth: compMonth,
      competenceYear: compYear,
      billingMonth: compMonth,
      billingYear: compYear,
      description,
      normalizedDescription: norm.normalizedDescription,
      paymentMethod,
      fingerprint: fp,
    });

    // Se tiver conta bancária vinculada, atualiza o saldo
    if (validAccountId) {
      const currentAcc = (await db.select().from(s.accounts).where(eq(s.accounts.id, validAccountId)))[0];
      if (currentAcc) {
        let newBal = currentAcc.currentBalance;
        if (type === 'INCOME') newBal += amount;
        else if (type === 'EXPENSE') newBal -= amount;

        await db.update(s.accounts).set({ currentBalance: newBal }).where(eq(s.accounts.id, validAccountId));
      }
    }

    return NextResponse.json({ success: true, transactionId: transId });
  } catch (error) {
    console.error('Transaction creation error:', error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
