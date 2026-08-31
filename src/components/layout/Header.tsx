'use client';

import React, { useState } from 'react';
import {
  Calendar,
  Plus,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { formatMonthYear } from '@/lib/utils';
import { QuickActionModal } from '../dashboard/QuickActionModal';
import { usePeriod } from '@/contexts/PeriodContext';

export function Header() {
  const { month, year, nextMonth, prevMonth } = usePeriod();
  const [isQuickActionOpen, setIsQuickActionOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-30 flex items-center justify-between px-6 py-4 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md">
        {/* Competence Period Selector */}
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl p-1 shadow-inner">
            <button
              onClick={prevMonth}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              title="Mês anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-2 px-3 py-1 text-sm font-semibold text-slate-200">
              <Calendar className="w-4 h-4 text-blue-400" />
              <span>{formatMonthYear(month, year)}</span>
            </div>
            <button
              onClick={nextMonth}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              title="Próximo mês"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Global Actions */}
        <div className="flex items-center gap-3">
          {/* Quick Transaction Action Button */}
          <button
            onClick={() => setIsQuickActionOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-sm font-semibold shadow-lg shadow-blue-500/25 transition-all duration-200 active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Lançamento</span>
          </button>
        </div>
      </header>

      {/* Modal de Lançamento Rápido */}
      <QuickActionModal
        isOpen={isQuickActionOpen}
        onClose={() => setIsQuickActionOpen(false)}
      />
    </>
  );
}
