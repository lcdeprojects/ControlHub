'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  ArrowLeftRight,
  CreditCard,
  Layers,
  Landmark,
  Film,
  Home,
  Target,
  PiggyBank,
  FileSpreadsheet,
  BarChart3,
  ShieldCheck,
  Settings,
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

interface NavGroup {
  sectionTitle: string;
  items: NavItem[];
}

const baseNavGroups: NavGroup[] = [
  {
    sectionTitle: 'VISÃO GERAL',
    items: [
      { label: 'Dashboard', href: '/', icon: LayoutDashboard },
      { label: 'Transações', href: '/transactions', icon: ArrowLeftRight },
      { label: 'Assinaturas', href: '/subscriptions', icon: Film, badge: 'Novo' },
    ],
  },
  {
    sectionTitle: 'CARTÕES & CRÉDITO',
    items: [
      { label: 'Cartões & Faturas', href: '/credit-cards', icon: CreditCard },
      { label: 'Parcelamentos', href: '/installments', icon: Layers, badge: 'Projeção' },
    ],
  },
  {
    sectionTitle: 'PATRIMÔNIO & CONTAS',
    items: [
      { label: 'Minhas Contas', href: '/accounts', icon: Landmark },
      { label: 'Patrimônio & Ativos', href: '/net-worth', icon: PiggyBank },
      { label: 'Custos da Casa', href: '/household', icon: Home },
    ],
  },
  {
    sectionTitle: 'ANÁLISE & GESTÃO',
    items: [
      { label: 'Planejamento', href: '/planning', icon: Target },
      { label: 'Importar Extrato', href: '/import', icon: FileSpreadsheet, badge: 'IA' },
      { label: 'Relatórios DRE', href: '/reports', icon: BarChart3 },
      { label: 'Categorias & Ajustes', href: '/settings', icon: Settings },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuth();

  const navGroups: NavGroup[] = user?.role === 'ADMIN'
    ? [
        {
          sectionTitle: 'ADMINISTRAÇÃO',
          items: [{ label: 'Painel Backoffice', href: '/admin', icon: ShieldCheck, badge: 'Admin' }],
        },
        ...baseNavGroups,
      ]
    : baseNavGroups;

  return (
    <aside className="hidden lg:flex flex-col w-64 min-h-screen border-r border-zinc-800/80 bg-zinc-950/95 p-4 sticky top-0 z-40 select-none">
      {/* Brand Header */}
      <div className="px-2 py-3 mb-2">
        <ControlHubLogo size="md" />
      </div>

      {/* Grouped Navigation Items */}
      <nav className="flex-1 space-y-5 overflow-y-auto pr-1 no-scrollbar">
        {navGroups.map((group, idx) => (
          <div key={idx} className="space-y-1">
            <span className="text-[10px] font-black tracking-widest uppercase text-zinc-500 px-3 block mb-1">
              {group.sectionTitle}
            </span>

            {group.items.map((item) => {
              const Icon = item.icon;
              const isActive =
                pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all duration-150 group',
                    isActive
                      ? 'bg-zinc-800/90 text-white border border-zinc-700/80 shadow-sm font-bold'
                      : 'text-zinc-400 hover:text-white hover:bg-zinc-900/80'
                  )}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon
                      className={cn(
                        'w-4 h-4 transition-colors',
                        isActive ? 'text-blue-400' : 'text-zinc-400 group-hover:text-zinc-200'
                      )}
                    />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span
                      className={cn(
                        'px-1.5 py-0.5 text-[9px] font-bold rounded-md border',
                        item.badge === 'Admin'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                          : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                      )}
                    >
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* User Footer Summary */}
      {user && (
        <div className="mt-auto pt-3 border-t border-zinc-800/80">
          <div className="flex items-center gap-3 p-2 rounded-xl bg-zinc-900/60 border border-zinc-800">
            <div
              className="w-8 h-8 rounded-lg border border-zinc-700 flex items-center justify-center font-bold text-xs text-white shadow-md shrink-0"
              style={{ backgroundColor: user.avatarColor || '#6366f1' }}
            >
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-zinc-200 truncate">{user.name}</p>
              <p className="text-[10px] text-emerald-400 font-mono truncate">
                {user.role === 'ADMIN' ? '● Administrador' : '● Conectado'}
              </p>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
