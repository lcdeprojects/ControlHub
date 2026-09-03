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
  Film,
  Home,
  Target,
  PiggyBank,
  TrendingUp,
  FileSpreadsheet,
  BarChart3,
  ShieldCheck,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

import { ControlHubLogo } from '@/components/ui/ControlHubLogo';

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  badge?: string;
}

const baseNavItems: NavItem[] = [
  { label: 'Dashboard', href: '/', icon: LayoutDashboard },
  { label: 'Transações', href: '/transactions', icon: ArrowLeftRight },
  { label: 'Assinaturas', href: '/subscriptions', icon: Film, badge: 'Novo' },
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
  const { user } = useAuth();

  const navItems = user?.role === 'ADMIN'
    ? [...baseNavItems, { label: 'Painel Admin', href: '/admin', icon: ShieldCheck, badge: 'Admin' }]
    : baseNavItems;

  return (
    <aside className="hidden lg:flex flex-col w-64 min-h-screen border-r border-zinc-800/80 bg-zinc-950/95 p-4 sticky top-0 z-40">
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
                  ? 'bg-zinc-800/90 text-white border border-zinc-700/80 shadow-sm shadow-zinc-950/50 font-bold'
                  : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900/80'
              )}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={cn(
                    'w-5 h-5 transition-colors',
                    isActive ? 'text-white' : 'text-zinc-400 group-hover:text-zinc-200'
                  )}
                />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className={cn(
                  'px-2 py-0.5 text-[10px] font-semibold rounded-full border',
                  item.badge === 'Admin'
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                    : 'bg-zinc-800 text-zinc-300 border-zinc-700'
                )}>
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* User Footer Summary */}
      {user && (
        <div className="mt-auto pt-4 border-t border-zinc-800/80">
          <div className="flex items-center gap-3 p-2 rounded-xl bg-zinc-900/60 border border-zinc-800">
            <div
              className="w-9 h-9 rounded-full border border-zinc-700 flex items-center justify-center font-bold text-sm text-white shadow-md"
              style={{ backgroundColor: user.avatarColor || '#6366f1' }}
            >
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-zinc-200 truncate">{user.name}</p>
              <p className="text-xs text-emerald-400 truncate">
                {user.role === 'ADMIN' ? '● Administrador' : '● Conectado'}
              </p>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
