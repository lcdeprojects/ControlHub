import { TransactionType } from '../types';

export interface RawTransactionItem {
  id: string;
  transactionType: TransactionType;
  amount: number;
  transactionDate: string; // YYYY-MM-DD
  competenceMonth: number;
  competenceYear: number;
  billingMonth?: number | null;
  billingYear?: number | null;
  categoryId?: string | null;
  categoryName?: string | null;
  categoryType?: string | null;
  accountName?: string | null;
  cardName?: string | null;
}

export interface FinancialSummary {
  // Visão Consumo (Competência Econômica)
  consumption: {
    totalIncome: number;
    totalExpense: number;
    savings: number;
    savingsRate: number;
    committedIncomeRate: number;
  };
  // Visão Fluxo de Caixa (Realização Financeira)
  cashFlow: {
    totalInflow: number;
    totalOutflow: number;
    netCashFlow: number;
    savingsRate: number;
  };
  // Comparações com mês anterior
  previousMonthComparison: {
    incomeGrowth: number;
    expenseGrowth: number;
    savingsGrowth: number;
  };
  // Distribuição por categoria (Consumo)
  categoryBreakdown: Array<{
    categoryId: string;
    categoryName: string;
    amount: number;
    percentage: number;
    icon?: string;
    color?: string;
  }>;
}

/**
 * Requisitos 9, 10, 11, 48:
 * Calcula métricas com separação estrita de Consumo vs Fluxo de Caixa.
 */
export function calculateFinancialSummary(
  currentMonthTransactions: RawTransactionItem[],
  previousMonthTransactions: RawTransactionItem[] = [],
  month: number,
  year: number
): FinancialSummary {
  let consumptionIncome = 0;
  let consumptionExpense = 0;

  let cashInflow = 0;
  let cashOutflow = 0;

  const categoryTotals: Record<string, { name: string; amount: number }> = {};

  for (const t of currentMonthTransactions) {
    const amount = Math.abs(t.amount);

    // ==========================================
    // 1. VISÃO POR CONSUMO (Competência)
    // ==========================================
    if (t.competenceMonth === month && t.competenceYear === year) {
      if (t.transactionType === 'INCOME') {
        consumptionIncome += amount;
      } else if (
        t.transactionType === 'EXPENSE' ||
        t.transactionType === 'CREDIT_CARD_PURCHASE' ||
        t.transactionType === 'INSTALLMENT'
      ) {
        consumptionExpense += amount;

        // Agrupamento por Categoria
        const catKey = t.categoryId || 'uncategorized';
        const catName = t.categoryName || 'Outros';
        if (!categoryTotals[catKey]) {
          categoryTotals[catKey] = { name: catName, amount: 0 };
        }
        categoryTotals[catKey].amount += amount;
      }
      // Nota: 'CREDIT_CARD_PAYMENT' e 'TRANSFER' são solenemente IGNORADOS no consumo!
    }

    // ==========================================
    // 2. VISÃO POR FLUXO DE CAIXA (Realização)
    // ==========================================
    const tDate = new Date(t.transactionDate + 'T12:00:00');
    const tMonth = tDate.getMonth() + 1;
    const tYear = tDate.getFullYear();

    if (tMonth === month && tYear === year) {
      if (t.transactionType === 'INCOME') {
        cashInflow += amount;
      } else if (
        t.transactionType === 'EXPENSE' ||
        t.transactionType === 'CREDIT_CARD_PAYMENT'
      ) {
        // No fluxo de caixa, a saída bancária ocorre nas despesas à vista/débito/PIX E no pagamento da fatura
        cashOutflow += amount;
      }
      // Nota: Compras no cartão a vencer ('CREDIT_CARD_PURCHASE', 'INSTALLMENT') NÃO entram no fluxo de caixa do mês da compra!
      // 'TRANSFER' interna não gera entrada nem saída líquida.
    }
  }

  // Cálculos de Consumo
  const consumptionSavings = consumptionIncome - consumptionExpense;
  const consumptionSavingsRate = consumptionIncome > 0 ? (consumptionSavings / consumptionIncome) * 100 : 0;
  const committedIncomeRate = consumptionIncome > 0 ? (consumptionExpense / consumptionIncome) * 100 : 0;

  // Cálculos de Caixa
  const netCashFlow = cashInflow - cashOutflow;
  const cashSavingsRate = cashInflow > 0 ? (netCashFlow / cashInflow) * 100 : 0;

  // Mês anterior (para percentuais de crescimento)
  let prevIncome = 0;
  let prevExpense = 0;
  for (const pt of previousMonthTransactions) {
    const pAmount = Math.abs(pt.amount);
    if (pt.transactionType === 'INCOME') {
      prevIncome += pAmount;
    } else if (
      pt.transactionType === 'EXPENSE' ||
      pt.transactionType === 'CREDIT_CARD_PURCHASE' ||
      pt.transactionType === 'INSTALLMENT'
    ) {
      prevExpense += pAmount;
    }
  }
  const prevSavings = prevIncome - prevExpense;

  const incomeGrowth = prevIncome > 0 ? ((consumptionIncome - prevIncome) / prevIncome) * 100 : 0;
  const expenseGrowth = prevExpense > 0 ? ((consumptionExpense - prevExpense) / prevExpense) * 100 : 0;
  const savingsGrowth = prevSavings !== 0 ? ((consumptionSavings - prevSavings) / Math.abs(prevSavings)) * 100 : 0;

  // Formatação de Categorias
  const categoryBreakdown = Object.entries(categoryTotals)
    .map(([id, data]) => ({
      categoryId: id,
      categoryName: data.name,
      amount: data.amount,
      percentage: consumptionExpense > 0 ? (data.amount / consumptionExpense) * 100 : 0,
    }))
    .sort((a, b) => b.amount - a.amount);

  return {
    consumption: {
      totalIncome: consumptionIncome,
      totalExpense: consumptionExpense,
      savings: consumptionSavings,
      savingsRate: consumptionSavingsRate,
      committedIncomeRate,
    },
    cashFlow: {
      totalInflow: cashInflow,
      totalOutflow: cashOutflow,
      netCashFlow,
      savingsRate: cashSavingsRate,
    },
    previousMonthComparison: {
      incomeGrowth,
      expenseGrowth,
      savingsGrowth,
    },
    categoryBreakdown,
  };
}
