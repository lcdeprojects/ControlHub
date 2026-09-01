'use client';

import React, { useState } from 'react';
import {
  Calendar,
  Plus,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { formatMonthYear } from '@/lib/utils';
import { QuickActionModal } from '../dashboard/QuickActionModal';
import { usePeriod } from '@/contexts/PeriodContext';
import Link from 'next/link';

import { ControlHubLogo } from '../ui/ControlHubLogo';

export function Header() {
  const { month, year, nextMonth, prevMonth } = usePeriod();
  const [isQuickActionOpen, setIsQuickActionOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-30 flex flex-wrap items-center justify-between gap-3 px-4 sm:px-6 py-3.5 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md">
        {/* Mobile Brand Logo */}
        <div className="flex lg:hidden items-center">
          <ControlHubLogo size="sm" showText={true} />
        </div>

        {/* Competence Period Selector */}
        <div className="flex items-center">
          <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl p-1 shadow-inner">
            <button
              onClick={prevMonth}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              title="Mês anterior"
            >
              <ChevronLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
            <div className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 text-xs sm:text-sm font-semibold text-slate-200">
              <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-400" />
              <span>{formatMonthYear(month, year)}</span>
            </div>
            <button
              onClick={nextMonth}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              title="Próximo mês"
            >
              <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
          </div>
        </div>

        {/* Global Actions */}
        <div className="flex items-center">
          <button
            onClick={() => setIsQuickActionOpen(true)}
            className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs sm:text-sm font-semibold shadow-lg shadow-blue-500/25 transition-all duration-200 active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden xs:inline">Novo Lançamento</span>
            <span className="xs:hidden">Novo</span>
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
