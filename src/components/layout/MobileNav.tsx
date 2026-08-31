'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, ArrowLeftRight, CreditCard, Layers, FileSpreadsheet } from 'lucide-react';
import { cn } from '@/lib/utils';

export function MobileNav() {
  const pathname = usePathname();

  const items = [
    { label: 'Dashboard', href: '/', icon: LayoutDashboard },
    { label: 'Extrato', href: '/transactions', icon: ArrowLeftRight },
    { label: 'Cartões', href: '/credit-cards', icon: CreditCard },
    { label: 'Parcelas', href: '/installments', icon: Layers },
    { label: 'Importar', href: '/import', icon: FileSpreadsheet },
  ];

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-slate-950/95 backdrop-blur-lg border-t border-slate-800 px-4 py-2 flex items-center justify-around shadow-2xl">
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex flex-col items-center gap-1 p-2 rounded-lg text-xs font-medium transition-colors',
              isActive ? 'text-blue-400 font-semibold' : 'text-slate-400 hover:text-slate-200'
            )}
          >
            <Icon className="w-5 h-5" />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </div>
  );
}
