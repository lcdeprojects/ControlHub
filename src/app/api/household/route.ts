import { NextResponse } from 'next/server';
import { db, ensureDatabaseSchema } from '@/db';
import * as s from '@/db/schema';
import { eq, desc, and } from 'drizzle-orm';
import { generateTransactionFingerprint } from '@/lib/engines/fingerprint';
import { normalizeTransactionDescription } from '@/lib/engines/matching-algorithm';
import { getAuthUserId } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    await ensureDatabaseSchema();
    const userId = await getAuthUserId(request);
    const { searchParams } = new URL(request.url);
    const month = parseInt(searchParams.get('month') || String(new Date().getMonth() + 1), 10);
    const year = parseInt(searchParams.get('year') || String(new Date().getFullYear()), 10);

    // 1. Buscar despesas fixas da casa (tabela recurring_transactions)
    const allRecurring = await db
      .select({
        id: s.recurringTransactions.id,
        name: s.recurringTransactions.description,
        amount: s.recurringTransactions.amount,
        dayOfMonth: s.recurringTransactions.dayOfMonth,
        startMonth: s.recurringTransactions.startMonth,
        startYear: s.recurringTransactions.startYear,
        accountId: s.recurringTransactions.accountId,
        accountName: s.accounts.name,
        categoryId: s.recurringTransactions.categoryId,
        categoryName: s.categories.name,
        categoryIcon: s.categories.icon,
        categoryColor: s.categories.color,
        createdAt: s.recurringTransactions.createdAt,
      })
      .from(s.recurringTransactions)
      .leftJoin(s.categories, eq(s.recurringTransactions.categoryId, s.categories.id))
      .leftJoin(s.accounts, eq(s.recurringTransactions.accountId, s.accounts.id))
      .where(
        and(
          eq(s.recurringTransactions.userId, userId),
          eq(s.recurringTransactions.isActive, true)
        )
      );

    // Filtrar apenas despesas ativas a partir do mês de início cadastrado (não vazar retroativo)
    const recurringList = allRecurring.filter((rec) => {
      const sYear = rec.startYear || new Date().getFullYear();
      const sMonth = rec.startMonth || new Date().getMonth() + 1;
      return sYear < year || (sYear === year && sMonth <= month);
    });

    // 2. Buscar todas as transações do mês para cruzar o status de pagamento
    const monthTransactions = await db
      .select({
        id: s.transactions.id,
        externalId: s.transactions.externalId,
        description: s.transactions.description,
        amount: s.transactions.amount,
        transactionDate: s.transactions.transactionDate,
        accountId: s.transactions.accountId,
        accountName: s.accounts.name,
        competenceMonth: s.transactions.competenceMonth,
        competenceYear: s.transactions.competenceYear,
        categoryType: s.categories.type,
      })
      .from(s.transactions)
      .leftJoin(s.accounts, eq(s.transactions.accountId, s.accounts.id))
      .leftJoin(s.categories, eq(s.transactions.categoryId, s.categories.id))
      .where(
        and(
          eq(s.transactions.userId, userId),
          eq(s.transactions.competenceMonth, month),
          eq(s.transactions.competenceYear, year)
        )
      );

    // 3. Cruzar cada custo recorrente com as baixas do mês
    const enrichedExpenses = recurringList.map((rec) => {
      // Procura transação vinculada por externalId ou por descrição idêntica no mês
      const paidTx = monthTransactions.find(
        (tx) => tx.externalId === rec.id || tx.description === rec.name
      );

      const isPaid = !!paidTx;

      return {
        ...rec,
        status: isPaid ? ('PAID' as const) : ('PENDING' as const),
        paidTransactionId: paidTx ? paidTx.id : null,
        paidDate: paidTx ? paidTx.transactionDate : null,
        paidAccountId: paidTx ? paidTx.accountId : rec.accountId,
        paidAccountName: paidTx ? paidTx.accountName : rec.accountName,
      };
    });

    const totalPlanned = enrichedExpenses.reduce((acc, curr) => acc + (curr.amount || 0), 0);
    const totalPaid = enrichedExpenses
      .filter((e) => e.status === 'PAID')
      .reduce((acc, curr) => acc + (curr.amount || 0), 0);
    const totalPending = totalPlanned - totalPaid;
    const pendingCount = enrichedExpenses.filter((e) => e.status === 'PENDING').length;

    // 4. Montar histórico dos últimos 6 meses para o gráfico
    const allHistoryTx = await db
      .select({
        amount: s.transactions.amount,
        competenceMonth: s.transactions.competenceMonth,
        competenceYear: s.transactions.competenceYear,
        categoryType: s.categories.type,
      })
      .from(s.transactions)
      .leftJoin(s.categories, eq(s.transactions.categoryId, s.categories.id));

    const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const monthlyHistory = [];

    for (let i = 5; i >= 0; i--) {
      let m = month - i;
      let y = year;
      if (m <= 0) {
        m += 12;
        y -= 1;
      }

      const monthTxAmount = allHistoryTx
        .filter((t) => t.competenceMonth === m && t.competenceYear === y && t.categoryType === 'HOUSEHOLD')
        .reduce((sum, t) => sum + (t.amount || 0), 0);

      const monthPlanned = allRecurring
        .filter((rec) => {
          const sYear = rec.startYear || 2026;
          const sMonth = rec.startMonth || 9;
          return sYear < y || (sYear === y && sMonth <= m);
        })
        .reduce((sum, r) => sum + (r.amount || 0), 0);

      const totalForMonth = monthTxAmount > 0 ? monthTxAmount : monthPlanned;

      monthlyHistory.push({
        month: `${monthNames[m - 1]}/${String(y).slice(2)}`,
        amount: totalForMonth,
      });
    }

    return NextResponse.json({
      success: true,
      expenses: enrichedExpenses,
      totalPlanned,
      totalPaid,
      totalPending,
      pendingCount,
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
    const userId = await getAuthUserId(request);
    const body = await request.json();
    const {
      name,
      amount,
      dayOfMonth = 5,
      categoryId,
      accountId,
      debitNow = true,
      month = new Date().getMonth() + 1,
      year = new Date().getFullYear(),
    } = body;

    if (!name || amount === undefined) {
      return NextResponse.json({ success: false, error: 'Nome e valor são obrigatórios' }, { status: 400 });
    }

    const parsedAmount = typeof amount === 'string' ? parseFloat(amount.replace(',', '.')) : parseFloat(amount);
    const newId = `rec_house_${Date.now()}`;

    // 1. Insere como despesa recorrente da casa gravando o mês e ano de início
    await db.insert(s.recurringTransactions).values({
      id: newId,
      userId,
      description: name,
      amount: parsedAmount,
      type: 'EXPENSE',
      categoryId: categoryId || 'cat_moradia',
      accountId: accountId || null,
      dayOfMonth: parseInt(dayOfMonth || '5', 10),
      startMonth: parseInt(month || String(new Date().getMonth() + 1), 10),
      startYear: parseInt(year || String(new Date().getFullYear()), 10),
      isActive: true,
    });

    // 2. Se o usuário selecionou uma conta bancária e optou por debitar no mês atual
    if (accountId && debitNow) {
      const norm = normalizeTransactionDescription(name);
      const dayStr = String(Math.min(Math.max(parseInt(dayOfMonth || '5', 10), 1), 28)).padStart(2, '0');
      const monthStr = String(month).padStart(2, '0');
      const txDate = `${year}-${monthStr}-${dayStr}`;

      const txId = `tx_house_${Date.now()}`;
      const fp = generateTransactionFingerprint({
        userId,
        sourceId: accountId,
        transactionDate: txDate,
        normalizedDescription: norm.normalizedDescription,
        amount: parsedAmount,
      });

      // Registra a transação de saída
      await db.insert(s.transactions).values({
        id: txId,
        userId,
        accountId,
        categoryId: categoryId || 'cat_moradia',
        transactionType: 'EXPENSE',
        paymentMethod: 'AUTO_DEBIT',
        description: name,
        normalizedDescription: norm.normalizedDescription,
        amount: parsedAmount,
        transactionDate: txDate,
        competenceMonth: month,
        competenceYear: year,
        billingMonth: month,
        billingYear: year,
        fingerprint: fp,
        externalId: newId,
        source: 'HOUSEHOLD_RECURRING',
        isRecurring: true,
        notes: 'Custo residencial recorrente',
      });

      // Debita o saldo da conta bancária de saída
      const acc = (await db.select().from(s.accounts).where(eq(s.accounts.id, accountId)))[0];
      if (acc) {
        const newBalance = (acc.currentBalance || 0) - parsedAmount;
        await db
          .update(s.accounts)
          .set({ currentBalance: newBalance })
          .where(eq(s.accounts.id, accountId));
      }
    }

    return NextResponse.json({
      success: true,
      expense: {
        id: newId,
        name,
        amount: parsedAmount,
        dayOfMonth: parseInt(dayOfMonth || '5', 10),
        categoryId: categoryId || 'cat_moradia',
        accountId,
      },
    });
  } catch (error) {
    console.error('Error creating household expense:', error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
