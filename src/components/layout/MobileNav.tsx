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
  Film,
  Home,
  Target,
  TrendingUp,
  FileSpreadsheet,
  BarChart3,
  ChevronRight,
  ShieldCheck,
  Settings,
  Sparkles,
  Clock,
  AlertTriangle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Modal } from '@/components/ui/Modal';
import { useAuth } from '@/contexts/AuthContext';

interface MobileModule {
  label: string;
  href: string;
  icon: React.ElementType;
  desc: string;
}

interface MobileGroup {
  sectionTitle: string;
  modules: MobileModule[];
}

export function MobileNav() {
  const pathname = usePathname();
  const { user } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const mainItems = [
    { label: 'Início', href: '/', icon: LayoutDashboard },
    { label: 'Extrato', href: '/transactions', icon: ArrowLeftRight },
    { label: 'Assinaturas', href: '/subscriptions', icon: Film },
    { label: 'Cartões', href: '/credit-cards', icon: CreditCard },
  ];

  const baseModuleGroups: MobileGroup[] = [
    {
      sectionTitle: 'VISÃO GERAL & EXTRATO',
      modules: [
        { label: 'Painel Geral', href: '/', icon: LayoutDashboard, desc: 'Visão executiva e KPIs' },
        { label: 'Extrato & Transações', href: '/transactions', icon: ArrowLeftRight, desc: 'Lançamentos e conciliação' },
        { label: 'Assinaturas & Débitos', href: '/subscriptions', icon: Film, desc: 'Netflix, Claude, Spotify e serviços' },
      ],
    },
    {
      sectionTitle: 'CARTÕES & PARCELAS',
      modules: [
        { label: 'Cartões & Faturas', href: '/credit-cards', icon: CreditCard, desc: 'Limites, faturas e fechamentos' },
        { label: 'Compras Parceladas', href: '/installments', icon: Layers, desc: 'Cronogramas e renda liberada' },
      ],
    },
    {
      sectionTitle: 'PATRIMÔNIO & CONTAS',
      modules: [
        { label: 'Minhas Contas', href: '/accounts', icon: Landmark, desc: 'Saldos bancários e transferências' },
        { label: 'Patrimônio & Ativos', href: '/net-worth', icon: TrendingUp, desc: 'Investimentos e bens' },
        { label: 'Custos da Casa', href: '/household', icon: Home, desc: 'Condomínio, luz, água e mercado' },
      ],
    },
    {
      sectionTitle: 'ANÁLISE & GESTÃO',
      modules: [
        { label: 'Planejamento & Tetos', href: '/planning', icon: Target, desc: 'Orçamentos por categoria' },
        { label: 'Importar Extratos', href: '/import', icon: FileSpreadsheet, desc: 'Planilhas XLS, XLSX e CSV (IA)' },
        { label: 'Relatórios DRE', href: '/reports', icon: BarChart3, desc: 'Consumo vs Fluxo de Caixa' },
        { label: 'Categorias & Ajustes', href: '/settings', icon: Settings, desc: 'Personalizar categorias e atalhos' },
      ],
    },
  ];

  const moduleGroups: MobileGroup[] = user?.role === 'ADMIN'
    ? [
        {
          sectionTitle: 'ADMINISTRAÇÃO',
          modules: [
            { label: 'Painel Admin (Backoffice)', href: '/admin', icon: ShieldCheck, desc: 'Gestão de usuários e permissões' },
          ],
        },
        ...baseModuleGroups,
      ]
    : baseModuleGroups;

  return (
    <>
      {/* Bottom Floating Bar */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-zinc-950/95 backdrop-blur-xl border-t border-zinc-800/80 px-2 py-1.5 flex items-center justify-around shadow-2xl safe-area-bottom select-none">
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
                  ? 'text-blue-400 font-bold bg-blue-500/10'
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
            isMenuOpen ? 'text-blue-400 font-bold bg-blue-500/10' : 'text-zinc-400 hover:text-zinc-200'
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
        description="Navegação organizada por grupos do NexumHub"
        maxWidth="max-w-md"
      >
        <div className="space-y-4 py-2 max-h-[70vh] overflow-y-auto pr-1 select-none">
          {/* Trial Status Card Banner in Mobile Drawer */}
          {user && user.role !== 'ADMIN' && (
            <div className="mb-2">
              {user.subscriptionStatus === 'ACTIVE' ? (
                <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-sm">
                      ⚡
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white">Plano NexumHub PRO</h4>
                      <p className="text-[10px] text-emerald-400 font-medium">Assinatura ativa e ilimitada</p>
                    </div>
                  </div>
                </div>
              ) : (() => {
                const now = new Date().getTime();
                const trialEnd = user.trialEndsAt ? new Date(user.trialEndsAt).getTime() : 0;
                const daysLeft = trialEnd > 0 ? Math.ceil((trialEnd - now) / (1000 * 60 * 60 * 24)) : 0;
                const isExpired = daysLeft <= 0 || user.subscriptionStatus === 'EXPIRED';

                if (isExpired) {
                  return (
                    <Link
                      href="/checkout"
                      onClick={() => setIsMenuOpen(false)}
                      className="p-3.5 rounded-2xl bg-rose-500/15 border border-rose-500/40 flex items-center justify-between transition-all hover:bg-rose-500/25"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center font-bold">
                          <AlertTriangle className="w-4 h-4 text-rose-400" />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-white">Período de Teste Expirado</h4>
                          <p className="text-[10px] text-rose-300 font-medium">Clique para escolher seu plano</p>
                        </div>
                      </div>
                      <span className="px-2.5 py-1 rounded-lg bg-rose-500 text-white font-bold text-[10px]">
                        Assinar
                      </span>
                    </Link>
                  );
                }

                return (
                  <Link
                    href="/checkout"
                    onClick={() => setIsMenuOpen(false)}
                    className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between transition-all hover:bg-emerald-500/20"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                        <Sparkles className="w-4 h-4 text-emerald-400" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-white">{daysLeft} dia{daysLeft > 1 ? 's' : ''} de Teste Grátis</h4>
                        <p className="text-[10px] text-zinc-400">Aproveite todas as ferramentas Pro</p>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold text-[10px]">
                      Ver Planos
                    </span>
                  </Link>
                );
              })()}
            </div>
          )}
          {moduleGroups.map((group, idx) => (
            <div key={idx} className="space-y-2">
              <span className="text-[10px] font-black tracking-widest uppercase text-zinc-500 block px-1">
                {group.sectionTitle}
              </span>

              <div className="space-y-1.5">
                {group.modules.map((m) => {
                  const Icon = m.icon;
                  const isActive = pathname === m.href;

                  return (
                    <Link
                      key={m.href}
                      href={m.href}
                      onClick={() => setIsMenuOpen(false)}
                      className={cn(
                        'flex items-center justify-between p-2.5 rounded-2xl border transition-all active:scale-98',
                        isActive
                          ? 'bg-blue-600/15 border-blue-500/30 text-white font-bold'
                          : 'bg-zinc-950/60 border-zinc-800/80 text-zinc-300 hover:border-zinc-700'
                      )}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={cn(
                            'w-8 h-8 rounded-xl flex items-center justify-center shrink-0',
                            isActive
                              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                              : 'bg-zinc-900 text-blue-400 border border-zinc-800'
                          )}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-white truncate">{m.label}</h4>
                          <p className="text-[10px] text-zinc-400 truncate">{m.desc}</p>
                        </div>
                      </div>

                      <ChevronRight className="w-4 h-4 text-zinc-500 shrink-0" />
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </Modal>
    </>
  );
}
