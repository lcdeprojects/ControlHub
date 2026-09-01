'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  ArrowLeftRight,
  CreditCard,
  Layers,
  Menu,
  Landmark,
  Home,
  Target,
  TrendingUp,
  FileSpreadsheet,
  BarChart3,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Modal } from '@/components/ui/Modal';
import { useAuth } from '@/contexts/AuthContext';

export function MobileNav() {
  const pathname = usePathname();
  const { user } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const mainItems = [
    { label: 'Início', href: '/', icon: LayoutDashboard },
    { label: 'Extrato', href: '/transactions', icon: ArrowLeftRight },
    { label: 'Cartões', href: '/credit-cards', icon: CreditCard },
    { label: 'Parcelas', href: '/installments', icon: Layers },
  ];

  const baseModules = [
    { label: 'Painel Geral', href: '/', icon: LayoutDashboard, desc: 'Visão executiva e KPIs' },
    { label: 'Extrato & Transações', href: '/transactions', icon: ArrowLeftRight, desc: 'Lançamentos e conciliação' },
    { label: 'Minhas Contas', href: '/accounts', icon: Landmark, desc: 'Saldos bancários e transferências' },
    { label: 'Cartões de Crédito', href: '/credit-cards', icon: CreditCard, desc: 'Limites, faturas e fechamentos' },
    { label: 'Compras Parceladas', href: '/installments', icon: Layers, desc: 'Cronogramas e renda liberada' },
    { label: 'Custos da Casa', href: '/household', icon: Home, desc: 'Condomínio, luz, água e mercado' },
    { label: 'Planejamento & Tetos', href: '/planning', icon: Target, desc: 'Orçamentos por categoria' },
    { label: 'Patrimônio & Ativos', href: '/net-worth', icon: TrendingUp, desc: 'Investimentos e bens' },
    { label: 'Importar Extratos', href: '/import', icon: FileSpreadsheet, desc: 'Planilhas XLS, XLSX e CSV' },
    { label: 'Relatórios DRE', href: '/reports', icon: BarChart3, desc: 'Consumo vs Fluxo de Caixa' },
  ];

  const allModules = user?.role === 'ADMIN'
    ? [
        { label: 'Painel Admin (Backoffice)', href: '/admin', icon: ShieldCheck, desc: 'Gestão de usuários e permissões' },
        ...baseModules,
      ]
    : baseModules;

  return (
    <>
      {/* Bottom Floating Bar */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-zinc-950/95 backdrop-blur-xl border-t border-zinc-800/80 px-2 py-1.5 flex items-center justify-around shadow-2xl safe-area-bottom">
        {mainItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center gap-1 py-1.5 px-3 rounded-xl text-[10px] font-medium transition-all active:scale-95',
                isActive
                  ? 'text-rose-400 font-bold bg-rose-500/10'
                  : 'text-zinc-400 hover:text-zinc-200'
              )}
            >
              <Icon className="w-4.5 h-4.5" />
              <span>{item.label}</span>
            </Link>
          );
        })}

        {/* Mais / Menu Drawer Button */}
        <button
          onClick={() => setIsMenuOpen(true)}
          className={cn(
            'flex flex-col items-center justify-center gap-1 py-1.5 px-3 rounded-xl text-[10px] font-medium transition-all active:scale-95 cursor-pointer',
            isMenuOpen ? 'text-rose-400 font-bold bg-rose-500/10' : 'text-zinc-400 hover:text-zinc-200'
          )}
        >
          <Menu className="w-4.5 h-4.5" />
          <span>Mais</span>
        </button>
      </nav>

      {/* Full Mobile Navigation Drawer */}
      <Modal
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        title="Menu & Módulos"
        description="Navegue por todas as áreas do ControlHub"
        maxWidth="max-w-md"
      >
        <div className="space-y-2 py-2 max-h-[70vh] overflow-y-auto">
          {allModules.map((m) => {
            const Icon = m.icon;
            const isActive = pathname === m.href;

            return (
              <Link
                key={m.href}
                href={m.href}
                onClick={() => setIsMenuOpen(false)}
                className={cn(
                  'flex items-center justify-between p-3 rounded-2xl border transition-all active:scale-98',
                  isActive
                    ? 'bg-rose-600/15 border-rose-500/30 text-white'
                    : 'bg-zinc-950/60 border-zinc-800/80 text-zinc-300 hover:border-zinc-700'
                )}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      'w-9 h-9 rounded-xl flex items-center justify-center',
                      isActive
                        ? 'bg-rose-600 text-white shadow-md shadow-rose-500/20'
                        : 'bg-zinc-900 text-zinc-400 border border-zinc-800'
                    )}
                  >
                    <Icon className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">{m.label}</h4>
                    <p className="text-[10px] text-zinc-400 mt-0.5">{m.desc}</p>
                  </div>
                </div>

                <ChevronRight className="w-4 h-4 text-zinc-500" />
              </Link>
            );
          })}
        </div>
      </Modal>
    </>
  );
}
