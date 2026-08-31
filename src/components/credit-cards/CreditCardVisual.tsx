'use client';

import React from 'react';
import { CreditCard as CardIcon, Wifi, ChevronRight, Calendar } from 'lucide-react';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { formatCurrency } from '@/lib/utils';

export interface CreditCardData {
  id: string;
  name: string;
  bank: string;
  brand: string;
  last4Digits: string;
  creditLimit: number;
  usedLimit: number;
  availableLimit: number;
  closingDay: number;
  dueDay: number;
  currentInvoiceAmount: number;
  nextInvoiceAmount: number;
  color?: string;
}

interface CreditCardVisualProps {
  card: CreditCardData;
  onOpenInvoice?: (cardId: string) => void;
  onPayInvoice?: (cardId: string) => void;
}

export function CreditCardVisual({ card, onOpenInvoice, onPayInvoice }: CreditCardVisualProps) {
  const limitUsagePercent = (card.usedLimit / (card.creditLimit || 1)) * 100;

  return (
    <div className="flex flex-col justify-between rounded-3xl p-6 relative overflow-hidden bg-gradient-to-br from-slate-900 via-zinc-900 to-black border border-slate-800 shadow-2xl hover:border-slate-700 transition-all duration-300 group">
      {/* Decorative Glow & Watermark */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-10 -right-10 opacity-5 text-white pointer-events-none">
        <CardIcon className="w-56 h-56" />
      </div>

      {/* Top Card Info */}
      <div className="flex items-start justify-between z-10">
        <div>
          <span className="text-xs font-semibold text-slate-400 tracking-wider uppercase">
            {card.bank}
          </span>
          <h3 className="text-lg font-bold text-white mt-0.5">{card.name}</h3>
        </div>
        <div className="flex items-center gap-2">
          <Wifi className="w-5 h-5 text-slate-400 rotate-90" />
          <span className="px-2.5 py-1 rounded-lg text-xs font-black bg-slate-800 text-slate-200 uppercase tracking-wider">
            {card.brand}
          </span>
        </div>
      </div>

      {/* Chip & Masked Number */}
      <div className="my-6 z-10 flex items-center justify-between">
        <div className="w-11 h-8 rounded-md bg-gradient-to-tr from-amber-400 to-amber-200 shadow-inner flex items-center justify-center">
          <div className="w-7 h-5 border border-amber-800/40 rounded-sm" />
        </div>
        <p className="text-sm font-mono tracking-widest text-slate-300">
          •••• •••• •••• <span className="text-white font-bold">{card.last4Digits}</span>
        </p>
      </div>

      {/* Limits & Progress */}
      <div className="space-y-3 z-10 pt-2 border-t border-slate-800/80">
        <div className="flex justify-between text-xs">
          <span className="text-slate-400">Limite Utilizado:</span>
          <span className="font-bold text-rose-400">{formatCurrency(card.usedLimit)}</span>
        </div>
        <ProgressBar
          value={limitUsagePercent}
          indicatorClassName={limitUsagePercent > 80 ? 'bg-rose-500' : 'bg-blue-500'}
        />
        <div className="flex justify-between text-xs text-slate-400">
          <span>Disponível: <strong className="text-emerald-400">{formatCurrency(card.availableLimit)}</strong></span>
          <span>Limite Total: <strong className="text-slate-200">{formatCurrency(card.creditLimit)}</strong></span>
        </div>
      </div>

      {/* Billing Cycle Highlights */}
      <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-slate-800/80 text-xs z-10 bg-slate-950/40 p-2.5 rounded-2xl">
        <div className="flex items-center gap-2">
          <Calendar className="w-3.5 h-3.5 text-blue-400" />
          <div>
            <p className="text-slate-400 text-[10px]">Dia de Fechamento</p>
            <p className="font-bold text-slate-200">Todo dia {String(card.closingDay).padStart(2, '0')}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="w-3.5 h-3.5 text-emerald-400" />
          <div>
            <p className="text-slate-400 text-[10px]">Dia de Vencimento</p>
            <p className="font-bold text-slate-200">Todo dia {String(card.dueDay).padStart(2, '0')}</p>
          </div>
        </div>
      </div>

      {/* Invoice Actions */}
      <div className="flex items-center gap-2 mt-4 pt-2 z-10">
        <button
          onClick={() => onOpenInvoice?.(card.id)}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white transition-colors cursor-pointer"
        >
          <span>Ver Fatura Atual ({formatCurrency(card.currentInvoiceAmount)})</span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
        </button>
        <button
          onClick={() => onPayInvoice?.(card.id)}
          className="py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white shadow-lg shadow-emerald-600/20 transition-all cursor-pointer"
        >
          Pagar
        </button>
      </div>
    </div>
  );
}
