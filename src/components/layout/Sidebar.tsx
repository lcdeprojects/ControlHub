'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  ArrowLeftRight,
  CreditCard,
  Receipt,
  Layers,
  Landmark,
  Home,
  Target,
  PiggyBank,
  TrendingUp,
  FileSpreadsheet,
  BarChart3,
  Settings,
  ShieldCheck,
} from 'lucide-react';
import { cn } from '@/lib/utils';

import { ControlHubLogo } from '@/components/ui/ControlHubLogo';

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  badge?: string;
}

const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/', icon: LayoutDashboard },
  { label: 'Transações', href: '/transactions', icon: ArrowLeftRight },
  { label: 'Meus Cartões', href: '/credit-cards', icon: CreditCard },
  { label: 'Faturas', href: '/credit-cards#faturas', icon: Receipt },
  { label: 'Parcelamentos', href: '/installments', icon: Layers, badge: 'Projeção' },
  { label: 'Minhas Contas', href: '/accounts', icon: Landmark },
  { label: 'Custos da Casa', href: '/household', icon: Home },
  { label: 'Planejamento', href: '/planning', icon: Target },
  { label: 'Patrimônio', href: '/net-worth', icon: PiggyBank },
  { label: 'Investimentos', href: '/net-worth#investimentos', icon: TrendingUp },
  { label: 'Importar Extrato', href: '/import', icon: FileSpreadsheet, badge: 'IA' },
  { label: 'Relatórios', href: '/reports', icon: BarChart3 },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex flex-col w-64 min-h-screen border-r border-slate-800/80 bg-slate-950/90 p-4 sticky top-0 z-40">
      {/* Brand Header */}
      <div className="px-2 py-4 mb-4">
        <ControlHubLogo size="md" />
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 space-y-1 overflow-y-auto pr-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group',
                isActive
                  ? 'bg-blue-600/15 text-blue-400 border border-blue-500/30 shadow-sm shadow-blue-500/10'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
              )}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={cn(
                    'w-5 h-5 transition-colors',
                    isActive ? 'text-blue-400' : 'text-slate-400 group-hover:text-slate-200'
                  )}
                />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* User Footer Summary */}
      <div className="mt-auto pt-4 border-t border-slate-800/80">
        <div className="flex items-center gap-3 p-2 rounded-xl bg-slate-900/60 border border-slate-800">
          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center font-bold text-sm text-white">
            LC
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-200 truncate">Lucas</p>
            <p className="text-xs text-emerald-400 truncate">● Conectado</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
