import { NextResponse } from 'next/server';
import { db } from '@/db';
import * as s from '@/db/schema';
import { calculateFinancialSummary } from '@/lib/engines/financial-calculator';
import { eq, and } from 'drizzle-orm';
import { getShortMonth } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const month = parseInt(searchParams.get('month') || '8', 10);
    const year = parseInt(searchParams.get('year') || '2026', 10);

    // Mês anterior
    let prevMonth = month - 1;
    let prevYear = year;
    if (prevMonth < 1) {
      prevMonth = 12;
      prevYear -= 1;
    }

    // Próximo mês
    let nextMonth = month + 1;
    let nextYear = year;
    if (nextMonth > 12) {
      nextMonth = 1;
      nextYear += 1;
    }

    // 1. Saldo Disponível Consolidado em Contas
    const userAccounts = await db.select().from(s.accounts);
    const availableBalance = userAccounts.reduce((acc, a) => acc + (a.currentBalance || 0), 0);

    // 2. Transações do Usuário com Categorias
    const rawTransactions = await db
      .select({
        id: s.transactions.id,
        transactionType: s.transactions.transactionType,
        amount: s.transactions.amount,
        transactionDate: s.transactions.transactionDate,
        competenceMonth: s.transactions.competenceMonth,
        competenceYear: s.transactions.competenceYear,
        billingMonth: s.transactions.billingMonth,
        billingYear: s.transactions.billingYear,
        categoryId: s.transactions.categoryId,
        categoryName: s.categories.name,
        description: s.transactions.description,
        externalId: s.transactions.externalId,
      })
      .from(s.transactions)
      .leftJoin(s.categories, eq(s.transactions.categoryId, s.categories.id));

    // 3. Faturas e Gastos de Cartão do Mês Selecionado e Próximo Mês
    const currentInvoicesTotal = rawTransactions
      .filter(
        (t) =>
          t.billingMonth === month &&
          t.billingYear === year &&
          (t.transactionType === 'CREDIT_CARD_PURCHASE' || t.transactionType === 'INSTALLMENT')
      )
      .reduce((acc, curr) => acc + curr.amount, 0);

    const nextInvoicesTotal = rawTransactions
      .filter(
        (t) =>
          t.billingMonth === nextMonth &&
          t.billingYear === nextYear &&
          (t.transactionType === 'CREDIT_CARD_PURCHASE' || t.transactionType === 'INSTALLMENT')
      )
      .reduce((acc, curr) => acc + curr.amount, 0);

    // 4. Parcelas Futuras Ainda Não Quitadas a partir do mês selecionado
    const allInstallments = await db.select().from(s.installments);
    const futureInstallmentsTotal = allInstallments
      .filter(
        (inst) =>
          inst.status !== 'PAID' &&
          (inst.billingYear > year || (inst.billingYear === year && inst.billingMonth >= month))
      )
      .reduce((acc, curr) => acc + curr.amount, 0);

    // 5. Custos da Casa do Mês (Pendentes de Liquidação)
    const recurringList = await db
      .select()
      .from(s.recurringTransactions)
      .where(
        and(
          eq(s.recurringTransactions.userId, 'usr_default'),
          eq(s.recurringTransactions.isActive, true)
        )
      );

    const applicableHouseholdList = recurringList.filter((rec) => {
      const sYear = rec.startYear || 2026;
      const sMonth = rec.startMonth || 9;
      return sYear < year || (sYear === year && sMonth <= month);
    });

    const pendingHouseholdTotal = applicableHouseholdList
      .filter((rec) => {
        const isPaid = rawTransactions.some(
          (t) =>
            t.competenceMonth === month &&
            t.competenceYear === year &&
            (t.externalId === rec.id || t.description === rec.description)
        );
        return !isPaid;
      })
      .reduce((acc, curr) => acc + (curr.amount || 0), 0);

    const totalHouseholdMonth = applicableHouseholdList.reduce((acc, curr) => acc + (curr.amount || 0), 0);

    // 6. Investimentos e Bens
    const allInvestments = await db.select().from(s.investments);
    const totalInvestments = allInvestments.reduce((acc, curr) => acc + (curr.currentValue || 0), 0);
    
    // Passivos e Obrigações Totais: Faturas do mês + Parcelas futuras + Custos da casa pendentes no mês
    const totalLiabilities = currentInvoicesTotal + futureInstallmentsTotal + pendingHouseholdTotal;
    const netWorth = availableBalance + totalInvestments - totalLiabilities;

    // 7. Cálculo do DRE: Consumo vs Fluxo de Caixa
    const prevMonthTx = rawTransactions.filter(
      (t) =>
        (t.competenceMonth === prevMonth && t.competenceYear === prevYear) ||
        new Date(t.transactionDate + 'T12:00:00').getMonth() + 1 === prevMonth
    );

    const summary = calculateFinancialSummary(
      rawTransactions as any,
      prevMonthTx as any,
      month,
      year
    );

    // 8. Gráfico Dinâmico de 6 Meses centrado no ano/mês selecionado
    const chartData = [];
    for (let offset = -4; offset <= 1; offset++) {
      let targetM = month + offset;
      let targetY = year;
      while (targetM < 1) {
        targetM += 12;
        targetY -= 1;
      }
      while (targetM > 12) {
        targetM -= 12;
        targetY += 1;
      }

      const mSummary = calculateFinancialSummary(rawTransactions as any, [], targetM, targetY);
      chartData.push({
        month: `${getShortMonth(targetM)}/${String(targetY).slice(2)}`,
        income: mSummary.consumption.totalIncome,
        expense: mSummary.consumption.totalExpense,
        savings: mSummary.consumption.savings,
      });
    }

    // 9. Gráfico de Evolução Patrimonial
    const netWorthData = chartData.map((cd, idx) => ({
      month: cd.month,
      netWorth: Math.max(netWorth + (idx - 4) * (summary.consumption.savings || 0), 0),
      assets: availableBalance + totalInvestments,
      liabilities: totalLiabilities,
    }));

    return NextResponse.json({
      success: true,
      availableBalance,
      currentInvoicesTotal,
      nextInvoicesTotal,
      futureInstallmentsTotal,
      pendingHouseholdTotal,
      totalHouseholdMonth,
      netWorth,
      summary,
      chartData,
      netWorthData,
    });
  } catch (error) {
    console.error('Stats API error:', error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
