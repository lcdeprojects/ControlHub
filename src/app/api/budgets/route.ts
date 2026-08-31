import { NextResponse } from 'next/server';
import { db } from '@/db';
import * as s from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET() {
  try {
    const list = await db
      .select({
        id: s.budgets.id,
        categoryId: s.budgets.categoryId,
        categoryName: s.categories.name,
        categoryIcon: s.categories.icon,
        categoryColor: s.categories.color,
        month: s.budgets.month,
        year: s.budgets.year,
        limitAmount: s.budgets.limitAmount,
      })
      .from(s.budgets)
      .leftJoin(s.categories, eq(s.budgets.categoryId, s.categories.id));

    return NextResponse.json({ success: true, budgets: list });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { categoryId, month = 8, year = 2026, limitAmount } = body;

    const budgetId = `b_${Date.now()}`;
    const newBudget = {
      id: budgetId,
      userId: 'usr_default',
      categoryId,
      month: parseInt(month, 10),
      year: parseInt(year, 10),
      limitAmount: parseFloat(limitAmount),
    };

    await db.insert(s.budgets).values(newBudget);

    return NextResponse.json({ success: true, budget: newBudget });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
