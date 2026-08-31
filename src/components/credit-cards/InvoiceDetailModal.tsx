'use client';

import React from 'react';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { formatCurrency, formatDate } from '@/lib/utils';
import { ShoppingBag, Layers, Film, CheckCircle2 } from 'lucide-react';

export interface InvoiceDetailItem {
  id: string;
  description: string;
  amount: number;
  date: string;
  type: 'SPOT' | 'INSTALLMENT' | 'SUBSCRIPTION';
  installmentInfo?: string; // Ex: "4/10"
  categoryName?: string;
}

interface InvoiceDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  cardName: string;
  referenceMonthYear: string;
  dueDate: string;
  status: string;
  totalAmount: number;
  items: InvoiceDetailItem[];
  onPay?: () => void;
}

export function InvoiceDetailModal({
  isOpen,
  onClose,
  cardName,
  referenceMonthYear,
  dueDate,
  status,
  totalAmount,
  items,
  onPay,
}: InvoiceDetailModalProps) {
  const spotPurchases = items.filter((i) => i.type === 'SPOT');
  const installments = items.filter((i) => i.type === 'INSTALLMENT');
  const subscriptions = items.filter((i) => i.type === 'SUBSCRIPTION');

  const spotSubtotal = spotPurchases.reduce((acc, curr) => acc + curr.amount, 0);
  const installmentSubtotal = installments.reduce((acc, curr) => acc + curr.amount, 0);
  const subscriptionSubtotal = subscriptions.reduce((acc, curr) => acc + curr.amount, 0);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Fatura — ${cardName}`}
      description={`Referência ${referenceMonthYear} • Vencimento em ${formatDate(dueDate)}`}
      maxWidth="max-w-2xl"
    >
      <div className="space-y-6">
        {/* Status Header */}
        <div className="flex items-center justify-between p-4 bg-slate-950 rounded-2xl border border-slate-800">
          <div>
            <p className="text-xs text-slate-400">Total da Fatura</p>
            <h3 className="text-2xl font-black text-white mt-0.5">
              {formatCurrency(totalAmount)}
            </h3>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant={status === 'PAID' ? 'success' : 'warning'}>
              {status === 'PAID' ? 'Fatura Paga' : 'Fatura Aberta'}
            </Badge>
            {status !== 'PAID' && onPay && (
              <button
                onClick={onPay}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-600/20 transition-all cursor-pointer"
              >
                Pagar Fatura
              </button>
            )}
          </div>
        </div>

        {/* Section 1: Compras à Vista */}
        <div>
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-blue-400" />
              <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                Compras à Vista
              </h4>
            </div>
            <span className="text-xs font-bold text-blue-400">{formatCurrency(spotSubtotal)}</span>
          </div>
          {spotPurchases.length === 0 ? (
            <p className="text-xs text-slate-500 py-1">Nenhuma compra à vista neste ciclo.</p>
          ) : (
            <div className="space-y-1.5">
              {spotPurchases.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between py-1.5 px-3 rounded-lg bg-slate-950/40 text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400">{formatDate(item.date)}</span>
                    <span className="font-medium text-slate-200">{item.description}</span>
                  </div>
                  <span className="font-bold text-slate-100">{formatCurrency(item.amount)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Section 2: Parcelamentos */}
        <div>
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-purple-400" />
              <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                Parcelamentos
              </h4>
            </div>
            <span className="text-xs font-bold text-purple-400">
              {formatCurrency(installmentSubtotal)}
            </span>
          </div>
          {installments.length === 0 ? (
            <p className="text-xs text-slate-500 py-1">Nenhum parcelamento neste ciclo.</p>
          ) : (
            <div className="space-y-1.5">
              {installments.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between py-1.5 px-3 rounded-lg bg-slate-950/40 text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400">{formatDate(item.date)}</span>
                    <span className="font-medium text-slate-200">{item.description}</span>
                    {item.installmentInfo && (
                      <span className="px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 font-bold text-[10px]">
                        {item.installmentInfo}
                      </span>
                    )}
                  </div>
                  <span className="font-bold text-slate-100">{formatCurrency(item.amount)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Section 3: Assinaturas */}
        <div>
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Film className="w-4 h-4 text-amber-400" />
              <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                Assinaturas & Recorrentes
              </h4>
            </div>
            <span className="text-xs font-bold text-amber-400">
              {formatCurrency(subscriptionSubtotal)}
            </span>
          </div>
          {subscriptions.length === 0 ? (
            <p className="text-xs text-slate-500 py-1">Nenhuma assinatura neste ciclo.</p>
          ) : (
            <div className="space-y-1.5">
              {subscriptions.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between py-1.5 px-3 rounded-lg bg-slate-950/40 text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400">{formatDate(item.date)}</span>
                    <span className="font-medium text-slate-200">{item.description}</span>
                  </div>
                  <span className="font-bold text-slate-100">{formatCurrency(item.amount)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Summary Footer */}
        <div className="pt-4 border-t border-slate-800 flex justify-between items-center text-xs text-slate-400">
          <span>{items.length} lançamentos contabilizados</span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold"
          >
            Fechar
          </button>
        </div>
      </div>
    </Modal>
  );
}
