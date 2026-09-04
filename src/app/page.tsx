'use client';

import React, { useEffect, useState } from 'react';
import { MetricCards } from '@/components/dashboard/MetricCards';
import { IncomeExpenseChart } from '@/components/dashboard/IncomeExpenseChart';
import { CategoryDonutChart } from '@/components/dashboard/CategoryDonutChart';
import { NetWorthChart } from '@/components/dashboard/NetWorthChart';
import { SmartAlerts } from '@/components/dashboard/SmartAlerts';
import { GettingStartedCard } from '@/components/dashboard/GettingStartedCard';
import { Card } from '@/components/ui/Card';
import { formatMonthYear } from '@/lib/utils';
import { Eye, DollarSign, ArrowUpRight, Layers, CreditCard, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { usePeriod } from '@/contexts/PeriodContext';

export default function DashboardPage() {
  const { month, year } = usePeriod();
  const [viewMode, setViewMode] = useState<'CONSUMPTION' | 'CASH_FLOW'>('CONSUMPTION');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);

  const fetchStats = async (m: number, y: number) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/stats?month=${m}&year=${y}`);
      const data = await res.json();
      if (data.success) {
        setStats(data);
      }
    } catch (err) {
      console.error('Error fetching stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats(month, year);
  }, [month, year]);

  const summary = stats?.summary;
  const currentView = viewMode === 'CONSUMPTION' ? summary?.consumption : summary?.cashFlow;

  const metricData = {
    availableBalance: stats?.availableBalance ?? 0,
    totalIncome: currentView?.totalIncome ?? (currentView?.totalInflow ?? 0),
    totalExpense: currentView?.totalExpense ?? (currentView?.totalOutflow ?? 0),
    savings:
      (currentView?.totalIncome ?? currentView?.totalInflow ?? 0) -
      (currentView?.totalExpense ?? currentView?.totalOutflow ?? 0),
    savingsRate: currentView?.savingsRate ?? 0,
    committedIncomeRate: currentView?.committedIncomeRate ?? 0,
    currentInvoicesTotal: stats?.currentInvoicesTotal ?? 0,
    nextInvoicesTotal: stats?.nextInvoicesTotal ?? 0,
    futureInstallmentsTotal: stats?.futureInstallmentsTotal ?? 0,
    netWorth: stats?.netWorth ?? 0,
    incomeGrowth: summary?.previousMonthComparison?.incomeGrowth ?? 0,
    expenseGrowth: summary?.previousMonthComparison?.expenseGrowth ?? 0,
    savingsGrowth: summary?.previousMonthComparison?.savingsGrowth ?? 0,
  };

  const chartData = stats?.chartData || [];
  const categoryData = summary?.categoryBreakdown || [];
  const netWorthData = stats?.netWorthData || [];

  return (
    <div className="space-y-6">
      {/* Top Banner & View Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-3xl bg-gradient-to-r from-blue-950/40 via-slate-900 to-indigo-950/40 border border-blue-500/20 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-500/20 text-blue-300 border border-blue-500/30 uppercase tracking-widest">
              {formatMonthYear(month, year)}
            </span>
          </div>
          <h2 className="text-2xl font-black text-white mt-1">
            Visão Geral
          </h2>
        </div>
      </div>

      {/* Getting Started Guide */}
      <GettingStartedCard />

      {/* Metric Cards */}
      <MetricCards viewMode={viewMode} data={metricData} />

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <IncomeExpenseChart data={chartData} />
        </div>
        <div>
          <CategoryDonutChart data={categoryData} />
        </div>
      </div>

      {/* Second Row: Net Worth and Quick Nav Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <NetWorthChart data={netWorthData} />
        </div>

        {/* Quick Shortcuts */}
        <Card className="flex flex-col justify-between space-y-4">
          <div>
            <h3 className="text-base font-bold text-white">Acesso Rápido</h3>
            <p className="text-xs text-slate-400">Atalhos dos principais módulos</p>
          </div>

          <div className="space-y-2.5">
            <Link
              href="/credit-cards"
              className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-blue-500/40 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
                  <CreditCard className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white group-hover:text-blue-400 transition-colors">
                    Faturas & Limites de Cartão
                  </h4>
                  <p className="text-[11px] text-slate-400">Ciclos de fechamento e vencimento</p>
                </div>
              </div>
              <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-blue-400 transition-colors" />
            </Link>

            <Link
              href="/installments"
              className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-purple-500/40 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white group-hover:text-purple-400 transition-colors">
                    Parcelamentos Ativos
                  </h4>
                  <p className="text-[11px] text-slate-400">Projeção e término de parcelas</p>
                </div>
              </div>
              <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-purple-400 transition-colors" />
            </Link>

            <Link
              href="/import"
              className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-emerald-500/40 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white group-hover:text-emerald-400 transition-colors">
                    Importar Fatura / Extrato
                  </h4>
                  <p className="text-[11px] text-slate-400">Matching automático anti-duplicidade</p>
                </div>
              </div>
              <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 transition-colors" />
            </Link>
          </div>

          <div className="pt-2 text-center">
            <span className="text-[11px] text-slate-500">
              NexumHub Pro • Sincronizado com o Mês Ativo
            </span>
          </div>
        </Card>
      </div>
    </div>
  );
}
