import { NextResponse } from 'next/server';
import { db, ensureDatabaseSchema } from '@/db';
import * as s from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { getAuthUserId } from '@/lib/auth';

export const dynamic = 'force-dynamic';

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
    } = body;

    if (!name || amount === undefined || amount === null) {
      return NextResponse.json({ success: false, error: 'Nome e valor são obrigatórios.' }, { status: 400 });
    }

    const subId = `sub_${Date.now()}`;

    await db.insert(s.subscriptions).values({
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
    });

    return NextResponse.json({ success: true, subscriptionId: subId });
  } catch (error) {
    console.error('Error creating subscription:', error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
