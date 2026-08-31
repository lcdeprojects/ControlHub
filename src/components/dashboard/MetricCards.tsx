'use client';

import React from 'react';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  PiggyBank,
  CreditCard,
  Layers,
  Percent,
  Landmark,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { formatCurrency, formatPercent } from '@/lib/utils';

interface MetricCardsProps {
  viewMode: 'CONSUMPTION' | 'CASH_FLOW';
  data: {
    availableBalance: number;
    totalIncome: number;
    totalExpense: number;
    savings: number;
    savingsRate: number;
    committedIncomeRate: number;
    currentInvoicesTotal: number;
    nextInvoicesTotal: number;
    futureInstallmentsTotal: number;
    netWorth: number;
    incomeGrowth: number;
    expenseGrowth: number;
    savingsGrowth: number;
  };
}

export function MetricCards({ viewMode, data }: MetricCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Saldo Disponível Consolidado */}
      <Card className="flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Saldo Disponível
          </span>
          <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
            <Wallet className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-4">
          <h2 className="text-2xl font-black text-white">
            {formatCurrency(data.availableBalance)}
          </h2>
          <p className="text-xs text-slate-400 mt-1">Soma de todas as contas ativas</p>
        </div>
      </Card>

      {/* 2. Receitas do Mês */}
      <Card className="flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            {viewMode === 'CONSUMPTION' ? 'Receitas do Mês' : 'Entradas de Caixa'}
          </span>
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
            <TrendingUp className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-4">
          <div className="flex items-baseline justify-between">
            <h2 className="text-2xl font-black text-emerald-400">
              {formatCurrency(data.totalIncome)}
            </h2>
            {data.incomeGrowth !== 0 && (
              <Badge variant={data.incomeGrowth >= 0 ? 'success' : 'danger'}>
                {data.incomeGrowth >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                <span>{Math.abs(data.incomeGrowth).toFixed(1)}%</span>
              </Badge>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-1">vs. mês anterior</p>
        </div>
      </Card>

      {/* 3. Gastos / Saídas do Mês */}
      <Card className="flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            {viewMode === 'CONSUMPTION' ? 'Consumo Real (Mês)' : 'Saídas de Caixa (Mês)'}
          </span>
          <div className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-400 flex items-center justify-center">
            <TrendingDown className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-4">
          <div className="flex items-baseline justify-between">
            <h2 className="text-2xl font-black text-rose-400">
              {formatCurrency(data.totalExpense)}
            </h2>
            {data.expenseGrowth !== 0 && (
              <Badge variant={data.expenseGrowth <= 0 ? 'success' : 'danger'}>
                {data.expenseGrowth <= 0 ? <ArrowDownRight className="w-3 h-3" /> : <ArrowUpRight className="w-3 h-3" />}
                <span>{Math.abs(data.expenseGrowth).toFixed(1)}%</span>
              </Badge>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-1">
            {viewMode === 'CONSUMPTION' ? 'Fato gerador / Competência' : 'Liquidações & Pagamentos'}
          </p>
        </div>
      </Card>

      {/* 4. Economia do Mês / Taxa de Poupança */}
      <Card className="flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Economia & Poupança
          </span>
          <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
            <PiggyBank className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-4">
          <div className="flex items-baseline justify-between">
            <h2 className="text-2xl font-black text-indigo-400">
              {formatCurrency(data.savings)}
            </h2>
            <Badge variant="purple">
              <Percent className="w-3 h-3" />
              <span>{data.savingsRate.toFixed(1)}%</span>
            </Badge>
          </div>
          <p className="text-xs text-slate-400 mt-1">Taxa de economia da renda</p>
        </div>
      </Card>

      {/* 5. Faturas Atuais & Próximas */}
      <Card className="flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Faturas em Aberto
          </span>
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
            <CreditCard className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-4">
          <h2 className="text-2xl font-black text-amber-400">
            {formatCurrency(data.currentInvoicesTotal)}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Próxima: <span className="text-slate-300 font-medium">{formatCurrency(data.nextInvoicesTotal)}</span>
          </p>
        </div>
      </Card>

      {/* 6. Total Comprometido em Parcelamentos */}
      <Card className="flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Parcelas Futuras
          </span>
          <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center">
            <Layers className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-4">
          <h2 className="text-2xl font-black text-purple-400">
            {formatCurrency(data.futureInstallmentsTotal)}
          </h2>
          <p className="text-xs text-slate-400 mt-1">Saldo devedor total em aberto</p>
        </div>
      </Card>

      {/* 7. Renda Comprometida */}
      <Card className="flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Renda Comprometida
          </span>
          <div className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-400 flex items-center justify-center">
            <Percent className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-4">
          <div className="flex items-baseline justify-between">
            <h2 className="text-2xl font-black text-slate-100">
              {data.committedIncomeRate.toFixed(1)}%
            </h2>
            <Badge variant={data.committedIncomeRate <= 70 ? 'success' : 'danger'}>
              {data.committedIncomeRate <= 70 ? 'Equilibrado' : 'Atenção'}
            </Badge>
          </div>
          <p className="text-xs text-slate-400 mt-1">Gastos sobre a renda total</p>
        </div>
      </Card>

      {/* 8. Patrimônio Líquido */}
      <Card className="flex flex-col justify-between" variant="gradient">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-blue-200 uppercase tracking-wider">
            Patrimônio Líquido
          </span>
          <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-300 flex items-center justify-center">
            <Landmark className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-4">
          <h2 className="text-2xl font-black text-white">
            {formatCurrency(data.netWorth)}
          </h2>
          <p className="text-xs text-blue-300/80 mt-1">Ativos + Contas − Obrigações & Custos</p>
        </div>
      </Card>
    </div>
  );
}
