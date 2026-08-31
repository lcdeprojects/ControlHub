'use client';

import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { formatCurrency } from '@/lib/utils';
import { ShieldCheck, Check, AlertCircle } from 'lucide-react';

interface Account {
  id: string;
  name: string;
  bankName?: string;
  currentBalance: number;
}

interface PayInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoiceId: string;
  cardName: string;
  amount: number;
  defaultAccountId?: string;
  onSuccess?: () => void;
}

export function PayInvoiceModal({
  isOpen,
  onClose,
  invoiceId,
  cardName,
  amount,
  defaultAccountId,
  onSuccess,
}: PayInvoiceModalProps) {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [accountId, setAccountId] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().slice(0, 10));
  const [loading, setLoading] = useState(false);
  const [fetchingAccounts, setFetchingAccounts] = useState(true);

  useEffect(() => {
    if (isOpen) {
      setFetchingAccounts(true);
      fetch('/api/accounts')
        .then((res) => res.json())
        .then((data) => {
          if (data.success && Array.isArray(data.accounts)) {
            setAccounts(data.accounts);
            if (data.accounts.length > 0) {
              const matched = defaultAccountId && data.accounts.some((a: Account) => a.id === defaultAccountId);
              setAccountId(matched ? (defaultAccountId as string) : data.accounts[0].id);
            } else {
              setAccountId('');
            }
          }
        })
        .catch((err) => console.error('Erro ao buscar contas:', err))
        .finally(() => setFetchingAccounts(false));
    }
  }, [isOpen, defaultAccountId]);

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountId) return;
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
          {fetchingAccounts ? (
            <div className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-400 text-xs">
              Carregando contas cadastradas...
            </div>
          ) : accounts.length === 0 ? (
            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>Nenhuma conta bancária encontrada. Cadastre uma conta antes de pagar a fatura.</span>
            </div>
          ) : (
            <select
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:border-blue-500 focus:outline-none"
            >
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.name} (Saldo: {formatCurrency(acc.currentBalance)})
                </option>
              ))}
            </select>
          )}
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
            disabled={loading || accounts.length === 0 || !accountId}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold shadow-lg shadow-emerald-600/25 transition-all cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>{loading ? 'Processando...' : 'Confirmar Pagamento'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
}
