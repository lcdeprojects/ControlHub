'use client';

import React from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from 'recharts';
import { Card } from '@/components/ui/Card';
import { formatCurrency } from '@/lib/utils';

interface CategoryDonutChartProps {
  data: Array<{
    categoryId: string;
    categoryName: string;
    amount: number;
    percentage: number;
  }>;
}

const COLORS = [
  '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899',
  '#06b6d4', '#f97316', '#14b8a6', '#6366f1', '#a855f7'
];

export function CategoryDonutChart({ data }: CategoryDonutChartProps) {
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      return (
        <div className="bg-slate-900 border border-slate-700 p-2.5 rounded-xl shadow-xl text-xs space-y-1">
          <p className="font-bold text-white">{item.categoryName}</p>
          <p className="text-blue-400 font-medium">{formatCurrency(item.amount)}</p>
          <p className="text-slate-400">{item.percentage.toFixed(1)}% do total</p>
        </div>
      );
    }
    return null;
  };

  const topCategories = data.slice(0, 5);

  return (
    <Card className="h-96 flex flex-col justify-between">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h3 className="text-base font-bold text-white">Gastos por Categoria</h3>
          <p className="text-xs text-slate-400">Distribuição percentual do consumo</p>
        </div>
      </div>

      <div className="flex-1 w-full min-h-0 flex items-center justify-center">
        {data.length === 0 ? (
          <p className="text-xs text-slate-500">Nenhuma despesa registrada neste mês.</p>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={85}
                paddingAngle={4}
                dataKey="amount"
                nameKey="categoryName"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Legend Top Categories */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 mt-2 pt-2 border-t border-slate-800 text-xs">
        {topCategories.map((item, idx) => (
          <div key={item.categoryId} className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 min-w-0">
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: COLORS[idx % COLORS.length] }}
              />
              <span className="text-slate-300 truncate">{item.categoryName}</span>
            </div>
            <span className="font-semibold text-slate-400">{item.percentage.toFixed(0)}%</span>
          </div>
        ))}
      </div>
    </Card>
  );
}
