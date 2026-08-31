'use client';

import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';
import { Card } from '@/components/ui/Card';
import { formatCurrency } from '@/lib/utils';

interface IncomeExpenseChartProps {
  data: Array<{
    month: string;
    income: number;
    expense: number;
    savings: number;
  }>;
}

export function IncomeExpenseChart({ data }: IncomeExpenseChartProps) {
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900 border border-slate-700 p-3 rounded-xl shadow-xl text-xs space-y-1">
          <p className="font-bold text-slate-200">{label}</p>
          <p className="text-emerald-400 font-medium">
            Receitas: {formatCurrency(payload[0]?.value || 0)}
          </p>
          <p className="text-rose-400 font-medium">
            Despesas: {formatCurrency(payload[1]?.value || 0)}
          </p>
          <p className="text-indigo-400 font-medium">
            Economia: {formatCurrency((payload[0]?.value || 0) - (payload[1]?.value || 0))}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="h-96 flex flex-col justify-between">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-bold text-white">Entradas vs. Saídas</h3>
          <p className="text-xs text-slate-400">Evolução comparativa mensal</p>
        </div>
      </div>

      <div className="flex-1 w-full min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
            <XAxis dataKey="month" stroke="#64748b" fontSize={12} tickLine={false} />
            <YAxis
              stroke="#64748b"
              fontSize={11}
              tickLine={false}
              tickFormatter={(val) => `R$${(val / 1000).toFixed(0)}k`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
              formatter={(val) => (val === 'income' ? 'Receitas' : 'Despesas')}
            />
            <Bar dataKey="income" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={36} />
            <Bar dataKey="expense" fill="#ef4444" radius={[4, 4, 0, 0]} maxBarSize={36} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
