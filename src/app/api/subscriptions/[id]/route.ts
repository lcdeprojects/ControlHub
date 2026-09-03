import { NextResponse } from 'next/server';
import { db, ensureDatabaseSchema } from '@/db';
import * as s from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { getAuthUserId } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await ensureDatabaseSchema();
    const userId = await getAuthUserId(request);
    const resolvedParams = await params;
    const { id } = resolvedParams;
    const body = await request.json();

    const {
      name,
      logoUrl,
      icon,
      color,
      amount,
      currency,
      billingCycle,
      billingDay,
      accountId,
      creditCardId,
      categoryId,
      status,
      nextBillingDate,
      notes,
    } = body;

    const existing = (
      await db
        .select()
        .from(s.subscriptions)
        .where(and(eq(s.subscriptions.id, id), eq(s.subscriptions.userId, userId)))
    )[0];

    if (!existing) {
      return NextResponse.json({ success: false, error: 'Assinatura não encontrada.' }, { status: 404 });
    }

    await db
      .update(s.subscriptions)
      .set({
        name: name !== undefined ? name : existing.name,
        logoUrl: logoUrl !== undefined ? logoUrl : existing.logoUrl,
        icon: icon !== undefined ? icon : existing.icon,
        color: color !== undefined ? color : existing.color,
        amount: amount !== undefined ? Number(amount) : existing.amount,
        currency: currency !== undefined ? currency : existing.currency,
        billingCycle: billingCycle !== undefined ? billingCycle : existing.billingCycle,
        billingDay: billingDay !== undefined ? Number(billingDay) : existing.billingDay,
        accountId: accountId !== undefined ? accountId : existing.accountId,
        creditCardId: creditCardId !== undefined ? creditCardId : existing.creditCardId,
        categoryId: categoryId !== undefined ? categoryId : existing.categoryId,
        status: status !== undefined ? status : existing.status,
        nextBillingDate: nextBillingDate !== undefined ? nextBillingDate : existing.nextBillingDate,
        notes: notes !== undefined ? notes : existing.notes,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(s.subscriptions.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating subscription:', error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await ensureDatabaseSchema();
    const userId = await getAuthUserId(request);
    const resolvedParams = await params;
    const { id } = resolvedParams;

    const existing = (
      await db
        .select()
        .from(s.subscriptions)
        .where(and(eq(s.subscriptions.id, id), eq(s.subscriptions.userId, userId)))
    )[0];

    if (!existing) {
      return NextResponse.json({ success: false, error: 'Assinatura não encontrada.' }, { status: 404 });
    }

    await db.delete(s.subscriptions).where(eq(s.subscriptions.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting subscription:', error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
