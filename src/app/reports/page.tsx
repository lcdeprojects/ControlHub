'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { formatCurrency, formatPercent } from '@/lib/utils';
import { BarChart3, Download, FileSpreadsheet, FileText, ArrowUpRight, ArrowDownRight, Printer } from 'lucide-react';

export default function ReportsPage() {
  const [reportType, setReportType] = useState<'MONTHLY' | 'ANNUAL'>('MONTHLY');

  const monthlyReport = {
    title: 'Demonstrativo de Resultado — Agosto / 2026',
    grossIncome: 21450.0,
    consumptionExpense: 12450.0,
    netSavings: 9000.0,
    savingsRate: 41.95,
    largestCategory: { name: 'Moradia & Condomínio', amount: 3100.0 },
    largestPurchase: { name: 'Supermercado Condor Gourmet', amount: 850.0 },
    comparisonPreviousMonth: {
      incomeChange: '+3.2%',
      expenseChange: '-5.1%',
      savingsChange: '+14.5%',
    },
  };

  const annualReport = {
    title: 'Balanço Anual Consolidado — 2026',
    annualIncome: 252000.0,
    annualExpense: 148200.0,
    annualSavings: 103800.0,
    averageSavingsRate: 41.2,
    netWorthEvolution: '+R$ 84.500 (+12.4%)',
    highestSpendingMonth: 'Maio (R$ 14.100)',
    lowestSpendingMonth: 'Junho (R$ 11.900)',
    monthlyAverage: 12350.0,
  };

  const handleExport = (format: 'CSV' | 'XLSX' | 'PDF') => {
    if (format === 'PDF') {
      window.print();
      return;
    }
    // Cria download direto de CSV simples
    const content = `ControlHub - Relatorio Financeiro\nTipo: ${reportType}\nData: 31/08/2026\nReceitas: R$ 21.450,00\nDespesas: R$ 12.450,00\nEconomia: R$ 9.000,00\nTaxa de Poupanca: 42%`;
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `relatorio_controlhub_${Date.now()}.${format.toLowerCase()}`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white">Relatórios Financeiros & DRE</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Fechamento contábil mensal e anual com métricas de desempenho e exportação
          </p>
        </div>

        {/* Export Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleExport('CSV')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-xs font-semibold text-slate-200 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>CSV</span>
          </button>
          <button
            onClick={() => handleExport('XLSX')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-xs font-semibold text-slate-200 transition-colors cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
            <span>Excel (XLSX)</span>
          </button>
          <button
            onClick={() => handleExport('PDF')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white shadow-lg shadow-blue-500/25 transition-all cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Imprimir / PDF</span>
          </button>
        </div>
      </div>

      {/* Report Type Switcher */}
      <div className="flex p-1 bg-slate-900 rounded-2xl border border-slate-800 w-fit text-xs font-bold">
        <button
          onClick={() => setReportType('MONTHLY')}
          className={`px-4 py-2 rounded-xl transition-all cursor-pointer ${
            reportType === 'MONTHLY' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
          }`}
        >
          Relatório Mensal (Agosto / 2026)
        </button>
        <button
          onClick={() => setReportType('ANNUAL')}
          className={`px-4 py-2 rounded-xl transition-all cursor-pointer ${
            reportType === 'ANNUAL' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
          }`}
        >
          Relatório Anual Consolidado (2026)
        </button>
      </div>

      {/* Report Document Presentation */}
      {reportType === 'MONTHLY' ? (
        <div className="space-y-6">
          <Card className="p-8 border border-blue-500/20 bg-gradient-to-br from-slate-900 via-slate-900/90 to-slate-950">
            <div className="flex items-start justify-between border-b border-slate-800 pb-6 mb-6">
              <div>
                <span className="text-xs font-bold text-blue-400 uppercase tracking-widest">
                  Demonstrativo Mensal de Consumo
                </span>
                <h3 className="text-2xl font-black text-white mt-1">{monthlyReport.title}</h3>
              </div>
              <Badge variant="success">Fechamento Concluído</Badge>
            </div>

            {/* DRE Rows */}
            <div className="space-y-4 text-sm">
              <div className="flex justify-between items-center py-2 border-b border-slate-800/60">
                <span className="font-semibold text-slate-300">Receitas Totais do Mês</span>
                <span className="font-mono font-bold text-emerald-400">
                  + {formatCurrency(monthlyReport.grossIncome)}
                </span>
              </div>

              <div className="flex justify-between items-center py-2 border-b border-slate-800/60">
                <span className="font-semibold text-slate-300">Consumo Econômico Real (Despesas + Cartão)</span>
                <span className="font-mono font-bold text-rose-400">
                  - {formatCurrency(monthlyReport.consumptionExpense)}
                </span>
              </div>

              <div className="flex justify-between items-center py-3 bg-blue-500/10 px-4 rounded-xl border border-blue-500/20">
                <span className="font-bold text-white text-base">Economia Líquida Gerada</span>
                <span className="font-mono font-black text-emerald-400 text-lg">
                  {formatCurrency(monthlyReport.netSavings)}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-xs text-slate-400">Taxa de Poupança</span>
                  <p className="text-xl font-bold text-purple-400 mt-1">
                    {monthlyReport.savingsRate.toFixed(1)}%
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-xs text-slate-400">Maior Categoria de Gasto</span>
                  <p className="text-base font-bold text-white mt-1">
                    {monthlyReport.largestCategory.name}
                  </p>
                  <p className="text-xs text-slate-400">
                    {formatCurrency(monthlyReport.largestCategory.amount)}
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-xs text-slate-400">Maior Compra Individual</span>
                  <p className="text-base font-bold text-white mt-1 truncate">
                    {monthlyReport.largestPurchase.name}
                  </p>
                  <p className="text-xs text-slate-400">
                    {formatCurrency(monthlyReport.largestPurchase.amount)}
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      ) : (
        <div className="space-y-6">
          <Card className="p-8 border border-purple-500/20 bg-gradient-to-br from-slate-900 via-slate-900/90 to-slate-950">
            <div className="flex items-start justify-between border-b border-slate-800 pb-6 mb-6">
              <div>
                <span className="text-xs font-bold text-purple-400 uppercase tracking-widest">
                  Consolidado Anual
                </span>
                <h3 className="text-2xl font-black text-white mt-1">{annualReport.title}</h3>
              </div>
              <Badge variant="purple">Ano Fiscal 2026</Badge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-xs text-slate-400">Receitas Anuais</span>
                <p className="text-2xl font-black text-emerald-400 mt-1">
                  {formatCurrency(annualReport.annualIncome)}
                </p>
              </div>
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-xs text-slate-400">Despesas Anuais</span>
                <p className="text-2xl font-black text-rose-400 mt-1">
                  {formatCurrency(annualReport.annualExpense)}
                </p>
              </div>
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-xs text-slate-400">Economia Acumulada</span>
                <p className="text-2xl font-black text-indigo-400 mt-1">
                  {formatCurrency(annualReport.annualSavings)}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
                <span className="text-slate-400">Mês de Maior Gasto:</span>
                <p className="text-sm font-bold text-white mt-0.5">{annualReport.highestSpendingMonth}</p>
              </div>
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
                <span className="text-slate-400">Mês de Menor Gasto:</span>
                <p className="text-sm font-bold text-white mt-0.5">{annualReport.lowestSpendingMonth}</p>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
