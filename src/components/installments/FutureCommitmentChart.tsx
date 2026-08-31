'use client';

import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { Card } from '@/components/ui/Card';
import { formatCurrency } from '@/lib/utils';

interface FutureCommitmentChartProps {
  data: Array<{
    month: string;
    amount: number;
    activeCount: number;
  }>;
}

export function FutureCommitmentChart({ data }: FutureCommitmentChartProps) {
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      return (
        <div className="bg-slate-900 border border-slate-700 p-3 rounded-xl shadow-xl text-xs space-y-1">
          <p className="font-bold text-white">{label}</p>
          <p className="text-purple-400 font-medium">
            Total em Parcelas: {formatCurrency(item.amount)}
          </p>
          <p className="text-slate-400 font-medium">
            {item.activeCount} compras ativas neste mês
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="h-80 flex flex-col justify-between">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h3 className="text-base font-bold text-white">Comprometimento Futuro da Renda</h3>
          <p className="text-xs text-slate-400">
            Projeção mensal de quando a sua renda será liberada
          </p>
        </div>
      </div>

      <div className="flex-1 w-full min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
            <XAxis dataKey="month" stroke="#64748b" fontSize={12} tickLine={false} />
            <YAxis
              stroke="#64748b"
              fontSize={11}
              tickLine={false}
              tickFormatter={(val) => `R$${val}`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="amount" fill="#a855f7" radius={[4, 4, 0, 0]} maxBarSize={32} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
