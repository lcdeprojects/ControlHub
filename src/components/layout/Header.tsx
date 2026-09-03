'use client';

import React, { useState } from 'react';
import {
  Calendar,
  Plus,
  ChevronLeft,
  ChevronRight,
  LogOut,
  User as UserIcon,
  RefreshCw,
} from 'lucide-react';
import { formatMonthYear } from '@/lib/utils';
import { QuickActionModal } from '../dashboard/QuickActionModal';
import { usePeriod } from '@/contexts/PeriodContext';
import { useAuth } from '@/contexts/AuthContext';
import { useBackgroundSync } from '@/hooks/useBackgroundSync';
import Link from 'next/link';
import { ControlHubLogo } from '../ui/ControlHubLogo';

export function Header() {
  const { month, year, nextMonth, prevMonth } = usePeriod();
  const { user, logout } = useAuth();
  const [isQuickActionOpen, setIsQuickActionOpen] = useState(false);
  const { isSyncing, triggerSync } = useBackgroundSync({
    enabled: Boolean(user),
  });

  return (
    <>
      <header className="sticky top-0 z-30 flex flex-wrap items-center justify-between gap-3 px-4 sm:px-6 py-3.5 border-b border-zinc-800/80 bg-zinc-950/90 backdrop-blur-md">
        {/* Mobile Brand Logo */}
        <div className="flex lg:hidden items-center">
          <ControlHubLogo size="sm" showText={true} />
        </div>

        {/* Competence Period Selector + Sync Indicator */}
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-zinc-950 border border-zinc-800 rounded-xl p-1 shadow-inner">
            <button
              onClick={prevMonth}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
              title="Mês anterior"
            >
              <ChevronLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
            <div className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 text-xs sm:text-sm font-semibold text-zinc-200">
              <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-zinc-300" />
              <span>{formatMonthYear(month, year)}</span>
            </div>
            <button
              onClick={nextMonth}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
              title="Próximo mês"
            >
              <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
          </div>

          {/* Auto-Sync Live Status Pill */}
          <button
            type="button"
            onClick={() => triggerSync('manual_click')}
            className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-[11px] font-medium text-zinc-400 hover:text-zinc-200 transition-all cursor-pointer"
            title="Sincronização inteligente em segundo plano ativa. Clique para recarregar agora."
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span>{isSyncing ? 'Sincronizando...' : 'Auto-Sync ON'}</span>
            <RefreshCw className={`w-3 h-3 text-zinc-500 ${isSyncing ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Global Actions & User Profile */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={() => setIsQuickActionOpen(true)}
            className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-xl bg-zinc-100 hover:bg-white text-zinc-950 text-xs sm:text-sm font-bold shadow-lg shadow-zinc-950/40 border border-white/20 transition-all duration-200 active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden xs:inline">Novo Lançamento</span>
            <span className="xs:hidden">Novo</span>
          </button>

          {/* Active User Badge & Logout */}
          {user ? (
            <div className="flex items-center gap-2 pl-2 border-l border-zinc-800">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white shadow-sm"
                style={{ backgroundColor: user.avatarColor || '#6366f1' }}
                title={user.name}
              >
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-xs font-semibold text-zinc-200 leading-none">{user.name}</p>
              </div>
              <button
                onClick={logout}
                className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-red-500/50 hover:bg-red-500/10 text-zinc-400 hover:text-red-400 transition-all cursor-pointer"
                title="Encerrar Sessão / Trocar de Perfil"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-xs text-zinc-300 transition-all"
            >
              <UserIcon className="w-4 h-4" />
              <span>Entrar</span>
            </Link>
          )}
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
