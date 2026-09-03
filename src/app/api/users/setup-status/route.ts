import { NextResponse } from 'next/server';
import { db } from '@/db';
import * as s from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getAuthUserId } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const userId = await getAuthUserId(request);
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Não autorizado' }, { status: 401 });
    }

    // 1. Contas registradas
    const userAccounts = await db.select({ id: s.accounts.id }).from(s.accounts).where(eq(s.accounts.userId, userId));
    const hasAccounts = userAccounts.length > 0;

    // 2. Cartões de crédito registrados
    const userCards = await db.select({ id: s.creditCards.id }).from(s.creditCards).where(eq(s.creditCards.userId, userId));
    const hasCreditCards = userCards.length > 0;

    // 3. Transações criadas ou importadas
    const userTransactions = await db.select({ id: s.transactions.id }).from(s.transactions).where(eq(s.transactions.userId, userId)).limit(1);
    const hasTransactions = userTransactions.length > 0;

    // 4. Orçamentos / Planejamentos criados
    const userBudgets = await db.select({ id: s.budgets.id }).from(s.budgets).where(eq(s.budgets.userId, userId)).limit(1);
    const hasBudgets = userBudgets.length > 0;

    const steps = [
      { id: 'accounts', completed: hasAccounts },
      { id: 'creditCards', completed: hasCreditCards },
      { id: 'transactions', completed: hasTransactions },
      { id: 'budgets', completed: hasBudgets },
    ];

    const completedCount = steps.filter((step) => step.completed).length;
    const totalSteps = steps.length;
    const progressPercentage = Math.round((completedCount / totalSteps) * 100);

    return NextResponse.json({
      success: true,
      hasAccounts,
      hasCreditCards,
      hasTransactions,
      hasBudgets,
      completedCount,
      totalSteps,
      progressPercentage,
      isFullyCompleted: completedCount === totalSteps,
    });
  } catch (error) {
    console.error('Setup status API error:', error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
