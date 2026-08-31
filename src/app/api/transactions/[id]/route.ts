import { NextResponse } from 'next/server';
import { db } from '@/db';
import * as s from '@/db/schema';
import { eq } from 'drizzle-orm';
import { normalizeTransactionDescription } from '@/lib/engines/matching-algorithm';
import { calculateInvoiceCycle } from '@/lib/engines/invoice-cycle';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const {
      description,
      amount,
      transactionDate,
      categoryId,
      accountId,
      creditCardId,
      transactionType,
      paymentMethod,
    } = body;

    // Buscar transação anterior para auditoria e ajuste de saldo
    const existing = (
      await db.select().from(s.transactions).where(eq(s.transactions.id, id))
    )[0];

    if (!existing) {
      return NextResponse.json({ success: false, error: 'Transação não encontrada.' }, { status: 404 });
    }

    const effectiveDate = transactionDate || existing.transactionDate;
    const effectiveCardId = creditCardId !== undefined ? creditCardId : existing.creditCardId;
    const effectiveType = transactionType || existing.transactionType;

    const norm = normalizeTransactionDescription(description || existing.description);
    const tDate = new Date(effectiveDate + 'T12:00:00');
    const compMonth = tDate.getMonth() + 1;
    const compYear = tDate.getFullYear();

    let billingMonth = compMonth;
    let billingYear = compYear;

    if ((effectiveType === 'CREDIT_CARD_PURCHASE' || effectiveType === 'INSTALLMENT') && effectiveCardId) {
      const card = (await db.select().from(s.creditCards).where(eq(s.creditCards.id, effectiveCardId)))[0];
      const cycle = calculateInvoiceCycle(effectiveDate, card || { closingDay: 3, dueDay: 10 });
      billingMonth = cycle.billingMonth;
      billingYear = cycle.billingYear;
    }

    const newAmount = amount !== undefined ? parseFloat(amount) : existing.amount;

    // Se houve alteração de valor ou conta em receita/despesa, recalcula o saldo bancário
    if (existing.accountId) {
      const acc = (
        await db.select().from(s.accounts).where(eq(s.accounts.id, existing.accountId))
      )[0];

      if (acc) {
        // Reverte o valor anterior
        const prevDelta = existing.transactionType === 'INCOME' ? -existing.amount : existing.amount;
        // Aplica o novo valor
        const targetType = transactionType || existing.transactionType;
        const newDelta = targetType === 'INCOME' ? newAmount : -newAmount;

        await db
          .update(s.accounts)
          .set({ currentBalance: (acc.currentBalance || 0) + prevDelta + newDelta })
          .where(eq(s.accounts.id, existing.accountId));
      }
    }

    // Atualizar registro
    await db
      .update(s.transactions)
      .set({
        description: description || existing.description,
        normalizedDescription: norm.normalizedDescription,
        amount: newAmount,
        transactionDate: effectiveDate,
        competenceMonth: compMonth,
        competenceYear: compYear,
        billingMonth,
        billingYear,
        categoryId: categoryId !== undefined ? categoryId : existing.categoryId,
        accountId: accountId !== undefined ? accountId : existing.accountId,
        creditCardId: effectiveCardId,
        transactionType: effectiveType,
        paymentMethod: paymentMethod || existing.paymentMethod,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(s.transactions.id, id));

    // Gravar Log de Auditoria (Requisito 41)
    await db.insert(s.auditLogs).values({
      id: `aud_${Date.now()}`,
      userId: existing.userId,
      entityType: 'TRANSACTION',
      entityId: id,
      action: 'UPDATE',
      oldValues: JSON.stringify(existing),
      newValues: JSON.stringify(body),
    });

    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error('Update transaction error:', error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const existing = (
      await db.select().from(s.transactions).where(eq(s.transactions.id, id))
    )[0];

    if (!existing) {
      return NextResponse.json({ success: false, error: 'Transação não encontrada.' }, { status: 404 });
    }

    // Se estiver vinculada a uma conta, reverte o impacto no saldo
    if (existing.accountId) {
      const acc = (
        await db.select().from(s.accounts).where(eq(s.accounts.id, existing.accountId))
      )[0];

      if (acc) {
        const revertDelta = existing.transactionType === 'INCOME' ? -existing.amount : existing.amount;
        await db
          .update(s.accounts)
          .set({ currentBalance: (acc.currentBalance || 0) + revertDelta })
          .where(eq(s.accounts.id, existing.accountId));
      }
    }

    await db.delete(s.transactions).where(eq(s.transactions.id, id));

    // Log de auditoria
    await db.insert(s.auditLogs).values({
      id: `aud_${Date.now()}`,
      userId: existing.userId,
      entityType: 'TRANSACTION',
      entityId: id,
      action: 'DELETE',
      oldValues: JSON.stringify(existing),
    });

    return NextResponse.json({ success: true, deletedId: id });
  } catch (error) {
    console.error('Delete transaction error:', error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
