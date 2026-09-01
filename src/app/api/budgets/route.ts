import { NextResponse } from 'next/server';
import { db } from '@/db';
import * as s from '@/db/schema';
import { eq, and } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const month = parseInt(searchParams.get('month') || '8', 10);
    const year = parseInt(searchParams.get('year') || '2026', 10);

    // 1. Fetch budgets for the specified month & year
    const budgetsList = await db
      .select({
        id: s.budgets.id,
        categoryId: s.budgets.categoryId,
        limitAmount: s.budgets.limitAmount,
        month: s.budgets.month,
        year: s.budgets.year,
        categoryName: s.categories.name,
        categoryColor: s.categories.color,
      })
      .from(s.budgets)
      .leftJoin(s.categories, eq(s.budgets.categoryId, s.categories.id))
      .where(and(eq(s.budgets.month, month), eq(s.budgets.year, year)));

    // 2. Fetch transactions to calculate spent per category
    const rawTransactions = await db
      .select({
        categoryId: s.transactions.categoryId,
        amount: s.transactions.amount,
        transactionType: s.transactions.transactionType,
        competenceMonth: s.transactions.competenceMonth,
        competenceYear: s.transactions.competenceYear,
        billingMonth: s.transactions.billingMonth,
        billingYear: s.transactions.billingYear,
      })
      .from(s.transactions);

    // Sum expenses by categoryId
    const spentMap: Record<string, number> = {};
    for (const t of rawTransactions) {
      if (!t.categoryId) continue;

      const absAmount = Math.abs(t.amount);

      // Check if transaction belongs to the target month/year by competence OR by billing month
      const belongsToMonth =
        (t.competenceMonth === month && t.competenceYear === year) ||
        (t.billingMonth === month && t.billingYear === year);

      if (belongsToMonth) {
        if (
          t.transactionType === 'EXPENSE' ||
          t.transactionType === 'CREDIT_CARD_PURCHASE' ||
          t.transactionType === 'INSTALLMENT'
        ) {
          spentMap[t.categoryId] = (spentMap[t.categoryId] || 0) + absAmount;
        } else if (t.transactionType === 'REFUND') {
          spentMap[t.categoryId] = (spentMap[t.categoryId] || 0) - absAmount;
        }
      }
    }

    const budgetsWithSpent = budgetsList.map((b) => ({
      ...b,
      spent: spentMap[b.categoryId] || 0,
    }));

    return NextResponse.json({ success: true, budgets: budgetsWithSpent });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { categoryId, limitAmount, month, year } = body;

    if (!categoryId || limitAmount === undefined || limitAmount === null) {
      return NextResponse.json({ success: false, error: 'categoryId and limitAmount are required' }, { status: 400 });
    }

    const m = month !== undefined ? parseInt(String(month), 10) : 8;
    const y = year !== undefined ? parseInt(String(year), 10) : 2026;

    await db
      .insert(s.users)
      .values({
        id: 'usr_default',
        name: 'Usuário',
        email: 'usuario@controlhub.app',
      })
      .onConflictDoNothing();

    // Check if budget for this category, month, and year already exists
    const existing = await db
      .select()
      .from(s.budgets)
      .where(
        and(
          eq(s.budgets.userId, 'usr_default'),
          eq(s.budgets.categoryId, categoryId),
          eq(s.budgets.month, m),
          eq(s.budgets.year, y)
        )
      );

    if (existing.length > 0) {
      await db
        .update(s.budgets)
        .set({ limitAmount: parseFloat(String(limitAmount)) })
        .where(eq(s.budgets.id, existing[0].id));

      return NextResponse.json({
        success: true,
        budget: { ...existing[0], limitAmount: parseFloat(String(limitAmount)) },
      });
    }

    const id = `bud_${Date.now()}`;
    const newBudget = {
      id,
      userId: 'usr_default',
      categoryId,
      limitAmount: parseFloat(String(limitAmount)),
      month: m,
      year: y,
    };

    await db.insert(s.budgets).values(newBudget);

    return NextResponse.json({ success: true, budget: newBudget });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}

