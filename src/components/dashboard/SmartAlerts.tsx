'use client';

import React from 'react';
import { AlertCircle, TrendingUp, Sparkles, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Card } from '@/components/ui/Card';

export interface SmartAlertItem {
  id: string;
  type: 'WARNING' | 'INFO' | 'SUCCESS' | 'OPPORTUNITY';
  title: string;
  message: string;
  date?: string;
}

interface SmartAlertsProps {
  alerts?: SmartAlertItem[];
}

export function SmartAlerts({ alerts }: SmartAlertsProps) {
  const defaultAlerts: SmartAlertItem[] = [
    {
      id: 'alt-1',
      type: 'WARNING',
      title: 'Fatura Comprometendo a Renda',
      message: 'Sua próxima fatura do cartão Ultravioleta já representa 35% da sua renda mensal.',
    },
    {
      id: 'alt-2',
      type: 'OPPORTUNITY',
      title: 'Encerramento de Parcelas',
      message: 'Em Novembro, R$ 1.200 em parcelamentos serão concluídos, liberando fluxo financeiro.',
    },
    {
      id: 'alt-3',
      type: 'SUCCESS',
      title: 'Meta de Poupança Superada',
      message: 'Sua taxa de economia aumentou 12% em relação à média dos últimos 3 meses.',
    },
    {
      id: 'alt-4',
      type: 'INFO',
      title: 'Energia Acima da Média',
      message: 'Sua conta de energia deste mês está 18% acima da média histórica dos últimos 6 meses.',
    },
  ];

  const displayAlerts = alerts && alerts.length > 0 ? alerts : defaultAlerts;

  const iconMap = {
    WARNING: <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />,
    INFO: <AlertCircle className="w-5 h-5 text-blue-400 shrink-0" />,
    SUCCESS: <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />,
    OPPORTUNITY: <Sparkles className="w-5 h-5 text-purple-400 shrink-0" />,
  };

  const borderMap = {
    WARNING: 'border-amber-500/20 bg-amber-500/5',
    INFO: 'border-blue-500/20 bg-blue-500/5',
    SUCCESS: 'border-emerald-500/20 bg-emerald-500/5',
    OPPORTUNITY: 'border-purple-500/20 bg-purple-500/5',
  };

  return (
    <Card className="flex flex-col justify-between">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-400" />
          <h3 className="text-base font-bold text-white">Alertas & Insights Inteligentes</h3>
        </div>
        <span className="text-xs text-purple-300 font-medium px-2 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/20">
          IA Analytics
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {displayAlerts.map((alert) => (
          <div
            key={alert.id}
            className={`p-3.5 rounded-xl border flex items-start gap-3 transition-all hover:translate-y-[-1px] ${borderMap[alert.type]}`}
          >
            {iconMap[alert.type]}
            <div className="min-w-0">
              <h4 className="text-xs font-bold text-slate-200">{alert.title}</h4>
              <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{alert.message}</p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
