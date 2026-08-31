'use client';

import React from 'react';
import { Card } from '@/components/ui/Card';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { formatCurrency, getShortMonth } from '@/lib/utils';
import { CreditCard, CheckCircle2, Eye, Trash2 } from 'lucide-react';

export interface InstallmentProgressItem {
  id: string;
  description: string;
  cardName: string;
  totalAmount: number;
  installmentCount: number;
  installmentValue: number;
  currentPaidInstallments: number;
  paidAmount: number;
  remainingAmount: number;
  lastBillingMonth: number;
  lastBillingYear: number;
  status: 'ACTIVE' | 'FINISHED' | 'CANCELLED';
}

interface InstallmentProgressBarProps {
  item: InstallmentProgressItem;
  onViewDetails?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export function InstallmentProgressBar({
  item,
  onViewDetails,
  onDelete,
}: InstallmentProgressBarProps) {
  const percent = (item.currentPaidInstallments / item.installmentCount) * 100;
  const isFinished = item.currentPaidInstallments >= item.installmentCount;

  return (
    <Card className="flex flex-col justify-between space-y-4 relative group">
      {/* Top Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h4 className="text-base font-bold text-white">{item.description}</h4>
            {isFinished && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">
                <CheckCircle2 className="w-3 h-3" /> Concluído
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-400">
            <CreditCard className="w-3.5 h-3.5 text-blue-400" />
            <span>{item.cardName}</span>
            <span>•</span>
            <span>Total: <strong>{formatCurrency(item.totalAmount)}</strong></span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-purple-400 font-bold bg-purple-500/10 px-2 py-1 rounded-lg border border-purple-500/20">
            {item.currentPaidInstallments}/{item.installmentCount}
          </span>
          <div className="flex items-center opacity-70 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => onViewDetails?.(item.id)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-purple-400 hover:bg-slate-800 transition-colors cursor-pointer"
              title="Ver Todas as Parcelas"
            >
              <Eye className="w-4 h-4" />
            </button>
            <button
              onClick={() => onDelete?.(item.id)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors cursor-pointer"
              title="Excluir Parcelamento"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Progress Track */}
      <div className="space-y-1.5">
        <ProgressBar
          value={percent}
          indicatorClassName={isFinished ? 'bg-emerald-500' : 'bg-gradient-to-r from-blue-500 to-purple-500'}
        />
        <div className="flex justify-between items-center text-xs">
          <span className="text-emerald-400 font-medium">
            Pago: <strong>{formatCurrency(item.paidAmount)}</strong>
          </span>
          <span className="text-rose-400 font-medium">
            Restante: <strong>{formatCurrency(item.remainingAmount)}</strong>
          </span>
        </div>
      </div>

      {/* Footer Info */}
      <div className="pt-3 border-t border-slate-800 flex justify-between items-center text-xs text-slate-400">
        <span>
          Última parcela: <strong className="text-slate-200">{getShortMonth(item.lastBillingMonth)}/{item.lastBillingYear}</strong>
        </span>
        <button
          onClick={() => onViewDetails?.(item.id)}
          className="text-xs text-purple-400 hover:text-purple-300 font-semibold cursor-pointer"
        >
          Ver Cronograma →
        </button>
      </div>
    </Card>
  );
}
