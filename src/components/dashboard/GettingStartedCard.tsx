'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Wallet,
  CreditCard,
  Receipt,
  PieChart,
  CheckCircle2,
  Circle,
  ArrowRight,
  Sparkles,
  ChevronDown,
  ChevronUp,
  X,
} from 'lucide-react';

interface SetupStatus {
  hasAccounts: boolean;
  hasCreditCards: boolean;
  hasTransactions: boolean;
  hasBudgets: boolean;
  completedCount: number;
  totalSteps: number;
  progressPercentage: number;
  isFullyCompleted: boolean;
}

const STORAGE_KEY_DISMISSED = 'controlhub_getting_started_dismissed';
const STORAGE_KEY_COLLAPSED = 'controlhub_getting_started_collapsed';

export function GettingStartedCard() {
  const [status, setStatus] = useState<SetupStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [dismissed, setDismissed] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    // Carregar estado de dismiss/collapse do localStorage
    if (typeof window !== 'undefined') {
      const isDismissed = localStorage.getItem(STORAGE_KEY_DISMISSED) === 'true';
      const isCollapsed = localStorage.getItem(STORAGE_KEY_COLLAPSED) === 'true';
      setDismissed(isDismissed);
      setCollapsed(isCollapsed);
    }

    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/users/setup-status');
      const data = await res.json();
      if (data.success) {
        setStatus(data);
      }
    } catch (err) {
      console.error('Erro ao buscar status de setup:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY_DISMISSED, 'true');
    }
  };

  const toggleCollapse = () => {
    const nextState = !collapsed;
    setCollapsed(nextState);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY_COLLAPSED, String(nextState));
    }
  };

  // Se o carregamento não finalizou ou não há status, não renderizar
  if (loading || !status) {
    return null;
  }

  // Se o usuário dispensou ou se atingiu 100% de conclusão, não renderizar (a menos que passe ?showOnboarding=true na URL para teste)
  const isForceShow = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('showOnboarding') === 'true';

  if (!isForceShow && (dismissed || status.isFullyCompleted || status.progressPercentage === 100)) {
    return null;
  }

  const steps = [
    {
      id: 'accounts',
      title: 'Cadastrar Conta Bancária ou Carteira',
      description: 'Adicione suas contas para acompanhar seu saldo real disponível.',
      completed: status.hasAccounts,
      href: '/accounts',
      buttonText: 'Adicionar Conta',
      icon: Wallet,
      color: 'blue',
    },
    {
      id: 'creditCards',
      title: 'Cadastrar Cartão de Crédito',
      description: 'Registre seus cartões para controlar datas de fechamento e limites.',
      completed: status.hasCreditCards,
      href: '/credit-cards',
      buttonText: 'Adicionar Cartão',
      icon: CreditCard,
      color: 'indigo',
    },
    {
      id: 'transactions',
      title: 'Realizar Primeiro Lançamento Manual',
      description: 'Registre um pagamento (despesa) ou receita manual no seu extrato.',
      completed: status.hasTransactions,
      href: '/transactions',
      buttonText: 'Novo Lançamento',
      icon: Receipt,
      color: 'emerald',
    },
    {
      id: 'budgets',
      title: 'Definir Orçamento por Categoria',
      description: 'Estabeleça limites mensais para controlar seus gastos por área.',
      completed: status.hasBudgets,
      href: '/planning',
      buttonText: 'Criar Orçamento',
      icon: PieChart,
      color: 'cyan',
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3 }}
      className="relative overflow-hidden rounded-3xl bg-slate-900/90 border border-slate-800 backdrop-blur-md shadow-2xl"
    >
      {/* Glow de Fundo */}
      <div className="absolute -top-24 -right-24 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header do Card */}
      <div className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/60">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-blue-500/20 border border-emerald-500/30 flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20 whitespace-nowrap">
                Início Rápido
              </span>
              <span className="text-xs text-slate-400 font-medium whitespace-nowrap">
                {status.completedCount} de {status.totalSteps} tarefas
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-black text-white mt-0.5">
              Primeiros Passos no ControlHub
            </h3>
          </div>
        </div>

        {/* Barra de Progresso e Ações */}
        <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
          <div className="flex items-center gap-3">
            <div className="w-28 sm:w-36 h-2.5 rounded-full bg-slate-950 border border-slate-800 overflow-hidden p-0.5">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${status.progressPercentage}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-blue-500 shadow-sm"
              />
            </div>
            <span className="text-xs font-black text-emerald-400 w-9 text-right">
              {status.progressPercentage}%
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={toggleCollapse}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors cursor-pointer"
              title={collapsed ? 'Expandir tarefas' : 'Minimizar tarefas'}
            >
              {collapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
            </button>
            <button
              onClick={handleDismiss}
              className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
              title="Dispensar guia"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Conteúdo Expansível de Tarefas */}
      <AnimatePresence>
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="p-5 sm:p-6 grid grid-cols-1 md:grid-cols-2 gap-3.5"
          >
            {steps.map((step) => {
              const StepIcon = step.icon;
              return (
                <div
                  key={step.id}
                  className={`group relative flex flex-col justify-between p-4 rounded-2xl border transition-all duration-200 ${
                    step.completed
                      ? 'bg-slate-950/40 border-emerald-500/20 opacity-80'
                      : 'bg-slate-950/80 border-slate-800 hover:border-blue-500/40 shadow-lg'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                          step.completed
                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                            : 'bg-slate-900 border-slate-800 text-slate-300 group-hover:text-blue-400 group-hover:border-blue-500/30'
                        }`}
                      >
                        <StepIcon className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4
                            className={`text-xs font-bold ${
                              step.completed ? 'text-slate-400 line-through' : 'text-white'
                            }`}
                          >
                            {step.title}
                          </h4>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                          {step.description}
                        </p>
                      </div>
                    </div>

                    <div className="shrink-0 pt-0.5">
                      {step.completed ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      ) : (
                        <Circle className="w-5 h-5 text-slate-600 group-hover:text-slate-400" />
                      )}
                    </div>
                  </div>

                  {!step.completed && (
                    <div className="mt-3 pt-3 border-t border-slate-800/60 flex justify-end">
                      <Link
                        href={step.href}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600/90 hover:bg-blue-600 text-white text-[11px] font-bold transition-all duration-200 shadow-md shadow-blue-500/20 cursor-pointer"
                      >
                        <span>{step.buttonText}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  )}
                </div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
