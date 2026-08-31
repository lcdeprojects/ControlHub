import { NextResponse } from 'next/server';
import { db } from '@/db';
import * as s from '@/db/schema';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const list = await db
      .select({
        id: s.budgets.id,
        limitAmount: s.budgets.limitAmount,
        month: s.budgets.month,
        year: s.budgets.year,
        categoryName: s.categories.name,
        categoryColor: s.categories.color,
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
    const { categoryId, limitAmount, month = 8, year = 2026 } = body;

    await db
      .insert(s.users)
      .values({
        id: 'usr_default',
        name: 'Usuário',
        email: 'usuario@controlhub.app',
      })
      .onConflictDoNothing();

    const id = `bud_${Date.now()}`;
    const newBudget = {
      id,
      userId: 'usr_default',
      categoryId,
      limitAmount: parseFloat(limitAmount),
      month: parseInt(month, 10),
      year: parseInt(year, 10),
    };

    await db.insert(s.budgets).values(newBudget);

    return NextResponse.json({ success: true, budget: newBudget });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
