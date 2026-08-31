'use client';

import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { formatCurrency } from '@/lib/utils';
import { ShieldCheck, Check } from 'lucide-react';

interface PayInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoiceId: string;
  cardName: string;
  amount: number;
  onSuccess?: () => void;
}

export function PayInvoiceModal({
  isOpen,
  onClose,
  invoiceId,
  cardName,
  amount,
  onSuccess,
}: PayInvoiceModalProps) {
  const [accountId, setAccountId] = useState('acc_nubank');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().slice(0, 10));
  const [loading, setLoading] = useState(false);

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/invoices/pay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoiceId,
          accountId,
          paymentDate,
          amount,
        }),
      });

      if (res.ok) {
        onSuccess?.();
        onClose();
        window.location.reload();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Pagamento de Fatura"
      description={`Liquidação da fatura do ${cardName}`}
    >
      <form onSubmit={handlePay} className="space-y-4">
        <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-2xl flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
          <div className="text-xs text-blue-300 leading-relaxed">
            <strong>Garantia de Integridade Contábil:</strong> O pagamento da fatura será registrado como liquidação de obrigação (saída de caixa bancária), <strong>sem duplicar</strong> as despesas econômicas já reconhecidas nas compras.
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">
            Valor a Pagar (R$)
          </label>
          <input
            type="text"
            disabled
            value={formatCurrency(amount)}
            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-bold text-lg cursor-not-allowed opacity-90"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">
            Conta Bancária de Saída
          </label>
          <select
            value={accountId}
            onChange={(e) => setAccountId(e.target.value)}
            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:border-blue-500 focus:outline-none"
          >
            <option value="acc_nubank">Conta Nubank (Saldo: R$ 18.450,00)</option>
            <option value="acc_itau">Itaú Uniclass (Saldo: R$ 14.200,00)</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">
            Data Efetiva do Pagamento
          </label>
          <input
            type="date"
            required
            value={paymentDate}
            onChange={(e) => setPaymentDate(e.target.value)}
            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:border-blue-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/25 transition-all cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>{loading ? 'Processando...' : 'Confirmar Pagamento'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
}
