import { NextResponse } from 'next/server';
import { db } from '@/db';
import * as s from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const purchase = (
      await db
        .select({
          id: s.installmentPurchases.id,
          description: s.installmentPurchases.description,
          normalizedDescription: s.installmentPurchases.normalizedDescription,
          totalAmount: s.installmentPurchases.totalAmount,
          installmentCount: s.installmentPurchases.installmentCount,
          installmentValue: s.installmentPurchases.installmentValue,
          purchaseDate: s.installmentPurchases.purchaseDate,
          firstBillingMonth: s.installmentPurchases.firstBillingMonth,
          firstBillingYear: s.installmentPurchases.firstBillingYear,
          status: s.installmentPurchases.status,
          cardName: s.creditCards.name,
          categoryName: s.categories.name,
        })
        .from(s.installmentPurchases)
        .leftJoin(s.creditCards, eq(s.installmentPurchases.creditCardId, s.creditCards.id))
        .leftJoin(s.categories, eq(s.installmentPurchases.categoryId, s.categories.id))
        .where(eq(s.installmentPurchases.id, id))
    )[0];

    if (!purchase) {
      return NextResponse.json({ success: false, error: 'Parcelamento não encontrado.' }, { status: 404 });
    }

    const items = await db
      .select()
      .from(s.installments)
      .where(eq(s.installments.installmentPurchaseId, id));

    return NextResponse.json({
      success: true,
      purchase,
      installments: items.sort((a, b) => a.installmentNumber - b.installmentNumber),
    });
  } catch (error) {
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
      await db.select().from(s.installmentPurchases).where(eq(s.installmentPurchases.id, id))
    )[0];

    if (!existing) {
      return NextResponse.json({ success: false, error: 'Parcelamento não encontrado.' }, { status: 404 });
    }

    // 1. Deletar as parcelas associadas
    await db.delete(s.installments).where(eq(s.installments.installmentPurchaseId, id));

    // 2. Deletar a compra parcelada original
    await db.delete(s.installmentPurchases).where(eq(s.installmentPurchases.id, id));

    // 3. Gravar log de auditoria
    await db.insert(s.auditLogs).values({
      id: `aud_${Date.now()}`,
      userId: existing.userId,
      entityType: 'INSTALLMENT_PURCHASE',
      entityId: id,
      action: 'DELETE',
      oldValues: JSON.stringify(existing),
    });

    return NextResponse.json({ success: true, deletedId: id });
  } catch (error) {
    console.error('Delete installment error:', error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
