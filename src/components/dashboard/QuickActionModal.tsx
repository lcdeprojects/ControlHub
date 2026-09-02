'use client';

import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { TransactionType, PaymentMethod } from '@/lib/types';
import { TrendingUp, TrendingDown, CreditCard, ArrowLeftRight, Check, AlertCircle } from 'lucide-react';
import { usePeriod } from '@/contexts/PeriodContext';

import { CurrencyInput } from '@/components/ui/CurrencyInput';

interface QuickActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function QuickActionModal({ isOpen, onClose, onSuccess }: QuickActionModalProps) {
  const { defaultDateForPeriod } = usePeriod();
  const [type, setType] = useState<TransactionType>('EXPENSE');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(defaultDateForPeriod);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('PIX');
  const [cardId, setCardId] = useState('');
  const [accountId, setAccountId] = useState('');
  const [categoryId, setCategoryId] = useState('cat_mercado');
  const [installmentCount, setInstallmentCount] = useState('1');
  const [loading, setLoading] = useState(false);

  // Dynamic user data
  const [accounts, setAccounts] = useState<any[]>([]);
  const [cards, setCards] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);

  useEffect(() => {
    if (!isOpen) return;

    setDate(defaultDateForPeriod);

    // Fetch dynamic options
    const fetchOptions = async () => {
      try {
        const [accRes, cardRes, catRes] = await Promise.all([
          fetch('/api/accounts'),
          fetch('/api/cards'),
          fetch('/api/categories'),
        ]);
        const [accData, cardData, catData] = await Promise.all([
          accRes.json(),
          cardRes.json(),
          catRes.json(),
        ]);

        if (accData.success && accData.accounts.length > 0) {
          setAccounts(accData.accounts);
          setAccountId(accData.accounts[0].id);
        }
        if (cardData.success && cardData.cards.length > 0) {
          setCards(cardData.cards);
          setCardId(cardData.cards[0].id);
        }
        if (catData.success && catData.categories.length > 0) {
          setCategories(catData.categories);
        }
      } catch (err) {
        console.error(err);
      }
    };

    fetchOptions();
  }, [isOpen, defaultDateForPeriod]);

  // Dynamic category filtering based on transaction type
  const filteredCategories = categories.filter((c) => {
    if (type === 'INCOME') return c.type === 'INCOME';
    return c.type === 'EXPENSE' || c.type === 'HOUSEHOLD';
  });

  // Auto-select first valid category when type or category list changes
  useEffect(() => {
    if (filteredCategories.length > 0) {
      const isValid = filteredCategories.some((c) => c.id === categoryId);
      if (!isValid) {
        setCategoryId(filteredCategories[0].id);
      }
    }
  }, [type, categories]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || !amount) return;

    setLoading(true);
    try {
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          description,
          amount: parseFloat(amount.replace(',', '.')),
          transactionDate: date,
          paymentMethod,
          creditCardId: type === 'CREDIT_CARD_PURCHASE' ? cardId || undefined : undefined,
          accountId: type !== 'CREDIT_CARD_PURCHASE' ? accountId || undefined : undefined,
          categoryId: categoryId || undefined,
          installmentCount: parseInt(installmentCount, 10) || 1,
        }),
      });

      if (res.ok) {
        onSuccess?.();
        onClose();
        setDescription('');
        setAmount('');
        setInstallmentCount('1');
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
      title="Novo Lançamento Financeiro"
      description="Cadastre receitas, despesas à vista, compras no cartão ou transferências."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Type Selector Tabs */}
        <div className="grid grid-cols-4 gap-2 p-1 bg-zinc-950 rounded-xl border border-zinc-800 text-xs font-semibold">
          <button
            type="button"
            onClick={() => {
              setType('EXPENSE');
              setPaymentMethod('PIX');
            }}
            className={`flex items-center justify-center gap-1.5 py-2 rounded-lg transition-all cursor-pointer ${
              type === 'EXPENSE'
                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40 font-bold'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <TrendingDown className="w-3.5 h-3.5" />
            <span>Despesa</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setType('INCOME');
              setPaymentMethod('TRANSFER');
            }}
            className={`flex items-center justify-center gap-1.5 py-2 rounded-lg transition-all cursor-pointer ${
              type === 'INCOME'
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 font-bold'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Receita</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setType('CREDIT_CARD_PURCHASE');
              setPaymentMethod('CREDIT');
            }}
            className={`flex items-center justify-center gap-1.5 py-2 rounded-lg transition-all cursor-pointer ${
              type === 'CREDIT_CARD_PURCHASE'
                ? 'bg-zinc-800 text-white border border-zinc-600 font-bold'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>Cartão</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setType('TRANSFER');
              setPaymentMethod('TRANSFER');
            }}
            className={`flex items-center justify-center gap-1.5 py-2 rounded-lg transition-all cursor-pointer ${
              type === 'TRANSFER'
                ? 'bg-zinc-800 text-white border border-zinc-600 font-bold'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <ArrowLeftRight className="w-3.5 h-3.5" />
            <span>Transf.</span>
          </button>
        </div>

        {/* Amount & Date */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1">
              Valor (R$)
            </label>
            <CurrencyInput
              required
              placeholder="R$ 0,00"
              value={amount}
              onChange={(val) => setAmount(val)}
              className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-white font-bold text-base focus:border-zinc-400 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1">
              Data do Fato Gerador
            </label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-white text-sm focus:border-zinc-400 focus:outline-none"
            />
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-semibold text-zinc-300 mb-1">
            Descrição / Estabelecimento
          </label>
          <input
            type="text"
            required
            placeholder="Ex: Supermercado, Aluguel, Farmácia, Salário..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-white text-sm focus:border-zinc-400 focus:outline-none"
          />
        </div>

        {/* Context Specific Selectors */}
        {type === 'CREDIT_CARD_PURCHASE' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                Cartão de Crédito
              </label>
              {cards.length > 0 ? (
                <select
                  value={cardId}
                  onChange={(e) => setCardId(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-white text-sm focus:border-zinc-400 focus:outline-none"
                >
                  {cards.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} (Fecha dia {c.closingDay})
                    </option>
                  ))}
                </select>
              ) : (
                <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl text-[11px] text-amber-300 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>Cadastre um cartão no menu "Cartões de Crédito".</span>
                </div>
              )}
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                Parcelas (1x à vista ou N parcelas)
              </label>
              <select
                value={installmentCount}
                onChange={(e) => setInstallmentCount(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-white text-sm focus:border-zinc-400 focus:outline-none"
              >
                <option value="1">1x (À vista na fatura)</option>
                {[2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 18, 24].map((n) => (
                  <option key={n} value={n}>
                    {n}x de R${' '}
                    {amount ? (parseFloat(amount) / n).toFixed(2) : '0,00'}
                  </option>
                ))}
              </select>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                Conta Bancária
              </label>
              {accounts.length > 0 ? (
                <select
                  value={accountId}
                  onChange={(e) => setAccountId(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-white text-sm focus:border-zinc-400 focus:outline-none"
                >
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="p-2.5 bg-zinc-800 border border-zinc-700 rounded-xl text-[11px] text-zinc-300 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>Cadastre uma conta no menu "Minhas Contas".</span>
                </div>
              )}
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                Forma de Pagamento
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-white text-sm focus:border-zinc-400 focus:outline-none"
              >
                <option value="PIX">PIX</option>
                <option value="DEBIT">Débito em Conta</option>
                <option value="BOLETO">Boleto Bancário</option>
                <option value="AUTO_DEBIT">Débito Automático</option>
                <option value="TRANSFER">Transferência</option>
                <option value="CASH">Dinheiro em Espécie</option>
              </select>
            </div>
          </div>
        )}

        {/* Category */}
        <div>
          <label className="block text-xs font-semibold text-zinc-300 mb-1">
            Categoria
          </label>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-white text-sm focus:border-zinc-400 focus:outline-none"
          >
            {filteredCategories.length > 0 ? (
              filteredCategories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))
            ) : (
              <option value="cat_mercado">Sem categoria disponível</option>
            )}
          </select>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-zinc-100 hover:bg-white text-zinc-950 text-xs font-bold shadow-lg shadow-zinc-950/40 border border-white/20 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>{loading ? 'Salvando...' : 'Confirmar Lançamento'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
}
