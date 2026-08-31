import { NextResponse } from 'next/server';
import { db, ensureDatabaseSchema } from '@/db';
import * as s from '@/db/schema';
import { eq, desc, and } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    await ensureDatabaseSchema();
    const { searchParams } = new URL(request.url);
    const month = parseInt(searchParams.get('month') || '8', 10);
    const year = parseInt(searchParams.get('year') || '2026', 10);

    // 1. Buscar despesas fixas da casa (tabela recurring_transactions)
    const recurring = await db
      .select({
        id: s.recurringTransactions.id,
        name: s.recurringTransactions.description,
        amount: s.recurringTransactions.amount,
        dayOfMonth: s.recurringTransactions.dayOfMonth,
        categoryId: s.recurringTransactions.categoryId,
        categoryName: s.categories.name,
        categoryIcon: s.categories.icon,
        categoryColor: s.categories.color,
        createdAt: s.recurringTransactions.createdAt,
      })
      .from(s.recurringTransactions)
      .leftJoin(s.categories, eq(s.recurringTransactions.categoryId, s.categories.id))
      .where(
        and(
          eq(s.recurringTransactions.userId, 'usr_default'),
          eq(s.recurringTransactions.isActive, true)
        )
      );

    // 2. Buscar transações reais de categorias HOUSEHOLD no mês/ano selecionado
    const transactions = await db
      .select({
        id: s.transactions.id,
        amount: s.transactions.amount,
        competenceMonth: s.transactions.competenceMonth,
        competenceYear: s.transactions.competenceYear,
        categoryType: s.categories.type,
      })
      .from(s.transactions)
      .leftJoin(s.categories, eq(s.transactions.categoryId, s.categories.id));

    // Se houver itens recorrentes, usa o valor deles como base para o mês
    const totalRecurring = recurring.reduce((acc, curr) => acc + (curr.amount || 0), 0);

    // 3. Montar histórico dos últimos 6 meses para o gráfico
    const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const monthlyHistory = [];

    for (let i = 5; i >= 0; i--) {
      let m = month - i;
      let y = year;
      if (m <= 0) {
        m += 12;
        y -= 1;
      }

      // Transações com categoria HOUSEHOLD nesse mês específico
      const monthTxAmount = transactions
        .filter((t) => t.competenceMonth === m && t.competenceYear === y && t.categoryType === 'HOUSEHOLD')
        .reduce((sum, t) => sum + (t.amount || 0), 0);

      // Valor total do mês: soma transações ou despesas fixas recorrentes
      const totalForMonth = monthTxAmount > 0 ? monthTxAmount : totalRecurring;

      monthlyHistory.push({
        month: `${monthNames[m - 1]}/${String(y).slice(2)}`,
        amount: totalForMonth,
      });
    }

    return NextResponse.json({
      success: true,
      expenses: recurring,
      totalMonth: totalRecurring,
      monthlyHistory,
    });
  } catch (error) {
    console.error('Error fetching household expenses:', error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await ensureDatabaseSchema();
    const body = await request.json();
    const { name, amount, dayOfMonth = 5, categoryId } = body;

    if (!name || amount === undefined) {
      return NextResponse.json({ success: false, error: 'Nome e valor são obrigatórios' }, { status: 400 });
    }

    await db
      .insert(s.users)
      .values({
        id: 'usr_default',
        name: 'Leonardo C.',
        email: 'usuario@controlhub.app',
      })
      .onConflictDoNothing();

    const parsedAmount = typeof amount === 'string' ? parseFloat(amount.replace(',', '.')) : parseFloat(amount);
    const newId = `rec_house_${Date.now()}`;

    // Insere como despesa recorrente da casa
    await db.insert(s.recurringTransactions).values({
      id: newId,
      userId: 'usr_default',
      description: name,
      amount: parsedAmount,
      type: 'EXPENSE',
      categoryId: categoryId || 'cat_moradia',
      dayOfMonth: parseInt(dayOfMonth || '5', 10),
      isActive: true,
    });

    return NextResponse.json({
      success: true,
      expense: {
        id: newId,
        name,
        amount: parsedAmount,
        dayOfMonth: parseInt(dayOfMonth || '5', 10),
        categoryId: categoryId || 'cat_moradia',
      },
    });
  } catch (error) {
    console.error('Error creating household expense:', error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
