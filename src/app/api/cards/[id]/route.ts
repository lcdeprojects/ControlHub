import { NextResponse } from 'next/server';
import { db, ensureDatabaseSchema } from '@/db';
import * as s from '@/db/schema';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await ensureDatabaseSchema();
    const { id } = await params;
    const body = await request.json();
    const { name, bank, brand, last4Digits, creditLimit, closingDay, dueDay, color } = body;

    const existing = (
      await db.select().from(s.creditCards).where(eq(s.creditCards.id, id))
    )[0];

    if (!existing) {
      return NextResponse.json({ success: false, error: 'Cartão não encontrado.' }, { status: 404 });
    }

    await db
      .update(s.creditCards)
      .set({
        name: name !== undefined ? name : existing.name,
        bank: bank !== undefined ? bank : existing.bank,
        brand: brand !== undefined ? brand : existing.brand,
        last4Digits: last4Digits !== undefined ? last4Digits : existing.last4Digits,
        creditLimit: creditLimit !== undefined ? parseFloat(creditLimit) : existing.creditLimit,
        closingDay: closingDay !== undefined ? parseInt(closingDay, 10) : existing.closingDay,
        dueDay: dueDay !== undefined ? parseInt(dueDay, 10) : existing.dueDay,
        color: color !== undefined ? color : existing.color,
      })
      .where(eq(s.creditCards.id, id));

    await db.insert(s.auditLogs).values({
      id: `aud_${Date.now()}`,
      userId: existing.userId,
      entityType: 'CREDIT_CARD',
      entityId: id,
      action: 'UPDATE',
      oldValues: JSON.stringify(existing),
      newValues: JSON.stringify(body),
    });

    return NextResponse.json({ success: true, id });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await ensureDatabaseSchema();
    const { id } = await params;

    const existing = (
      await db.select().from(s.creditCards).where(eq(s.creditCards.id, id))
    )[0];

    if (!existing) {
      return NextResponse.json({ success: false, error: 'Cartão não encontrado.' }, { status: 404 });
    }

    // 1. Desvincular ou limpar transações do cartão para evitar Foreign Key error
    await db
      .delete(s.transactions)
      .where(eq(s.transactions.creditCardId, id));

    // 2. Desvincular despesas recorrentes
    await db
      .update(s.recurringTransactions)
      .set({ creditCardId: null })
      .where(eq(s.recurringTransactions.creditCardId, id));

    // 3. Deletar o cartão
    await db.delete(s.creditCards).where(eq(s.creditCards.id, id));

    await db.insert(s.auditLogs).values({
      id: `aud_${Date.now()}`,
      userId: existing.userId,
      entityType: 'CREDIT_CARD',
      entityId: id,
      action: 'DELETE',
      oldValues: JSON.stringify(existing),
    });

    return NextResponse.json({ success: true, deletedId: id });
  } catch (error) {
    console.error('Delete card error:', error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
