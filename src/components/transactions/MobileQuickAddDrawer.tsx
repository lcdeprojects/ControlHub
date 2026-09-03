'use client';

import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import {
  ArrowDownRight,
  ArrowUpRight,
  CreditCard,
  Check,
  Delete,
  Sparkles,
  Tag,
  Wallet,
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface MobileQuickAddDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function MobileQuickAddDrawer({
  isOpen,
  onClose,
  onSuccess,
}: MobileQuickAddDrawerProps) {
  const [type, setType] = useState<'EXPENSE' | 'INCOME' | 'CREDIT_CARD_PURCHASE'>('EXPENSE');
  const [amountStr, setAmountStr] = useState('0');
  const [description, setDescription] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedAccount, setSelectedAccount] = useState('');
  const [selectedCard, setSelectedCard] = useState('');
  const [categories, setCategories] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [creditCards, setCreditCards] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Carregar dados de apoio (Categorias, Contas, Cartões)
      Promise.all([
        fetch('/api/categories').then((r) => r.json()),
        fetch('/api/accounts').then((r) => r.json()),
        fetch('/api/credit-cards').then((r) => r.json()),
      ])
        .then(([catData, accData, cardData]) => {
          if (catData.success) {
            setCategories(catData.categories || []);
            // Selecionar primeira categoria por padrão
            if (catData.categories?.length > 0) {
              setSelectedCategory(catData.categories[0].id);
            }
          }
          if (accData.success) {
            setAccounts(accData.accounts || []);
            if (accData.accounts?.length > 0) {
              setSelectedAccount(accData.accounts[0].id);
            }
          }
          if (cardData.success) {
            setCreditCards(cardData.creditCards || []);
            if (cardData.creditCards?.length > 0) {
              setSelectedCard(cardData.creditCards[0].id);
            }
          }
        })
        .catch(console.error);
    }
  }, [isOpen]);

  // Handler Numpad
  const handleNumpadPress = (val: string) => {
    if (val === 'DEL') {
      setAmountStr((prev) => (prev.length > 1 ? prev.slice(0, -1) : '0'));
      return;
    }

    if (val === 'CLR') {
      setAmountStr('0');
      return;
    }

    setAmountStr((prev) => {
      if (prev === '0') return val;
      if (prev.length >= 7) return prev; // limite de digitos
      return prev + val;
    });
  };

  // Converte valor digitado em centavos (ex: "5000" -> 50.00)
  const numericAmount = parseFloat(amountStr || '0') / 100;

  const handleSubmit = async () => {
    if (numericAmount <= 0) {
      alert('Digite um valor maior que zero.');
      return;
    }

    setSubmitting(true);
    try {
      const today = new Date().toISOString().slice(0, 10);
      const catObj = categories.find((c) => c.id === selectedCategory);
      const desc = description.trim() || (catObj ? catObj.name : 'Lançamento Rápido');

      const body: any = {
        type,
        amount: numericAmount,
        description: desc,
        transactionDate: today,
        categoryId: selectedCategory || null,
      };

      if (type === 'CREDIT_CARD_PURCHASE') {
        body.creditCardId = selectedCard || null;
        body.paymentMethod = 'CREDIT';
      } else {
        body.accountId = selectedAccount || null;
        body.paymentMethod = type === 'INCOME' ? 'PIX' : 'DEBIT';
      }

      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (data.success) {
        setAmountStr('0');
        setDescription('');
        onSuccess();
        onClose();
      } else {
        alert(data.error || 'Erro ao criar transação.');
      }
    } catch (err) {
      console.error(err);
      alert('Falha de conexão.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="🚀 Express Quick-Add (Mobile)"
      description="Lançamento ultra-rápido com pad numérico e seleção em 1 toque."
    >
      <div className="space-y-4">
        {/* Type Selector Tabs */}
        <div className="grid grid-cols-3 gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button
            type="button"
            onClick={() => setType('EXPENSE')}
            className={`py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              type === 'EXPENSE'
                ? 'bg-rose-500 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <ArrowDownRight className="w-3.5 h-3.5" /> Despesa
          </button>

          <button
            type="button"
            onClick={() => setType('INCOME')}
            className={`py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              type === 'INCOME'
                ? 'bg-emerald-500 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <ArrowUpRight className="w-3.5 h-3.5" /> Receita
          </button>

          <button
            type="button"
            onClick={() => setType('CREDIT_CARD_PURCHASE')}
            className={`py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              type === 'CREDIT_CARD_PURCHASE'
                ? 'bg-blue-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" /> Cartão
          </button>
        </div>

        {/* Big Amount Display */}
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 text-center">
          <span className="text-[10px] uppercase tracking-wider text-slate-400 font-extrabold block mb-1">
            Valor do Lançamento
          </span>
          <div
            className={`text-3xl sm:text-4xl font-mono font-black ${
              type === 'INCOME'
                ? 'text-emerald-400'
                : type === 'EXPENSE'
                ? 'text-rose-400'
                : 'text-blue-400'
            }`}
          >
            {formatCurrency(numericAmount)}
          </div>
        </div>

        {/* Optional Description Input */}
        <div>
          <input
            type="text"
            placeholder="Descrição (opcional - usa o nome da categoria se vazio)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Clickable Fast Chips - Categories */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
            <Tag className="w-3 h-3 text-blue-400" /> Categoria Rápidas:
          </label>
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            {categories
              .filter((c) => (type === 'INCOME' ? c.type === 'INCOME' : c.type !== 'INCOME'))
              .slice(0, 10)
              .map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setSelectedCategory(c.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    selectedCategory === c.id
                      ? 'bg-blue-600 text-white ring-2 ring-blue-400'
                      : 'bg-slate-950 text-slate-300 hover:bg-slate-800 border border-slate-800'
                  }`}
                >
                  {c.name}
                </button>
              ))}
          </div>
        </div>

        {/* Clickable Fast Chips - Accounts / Credit Cards */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
            {type === 'CREDIT_CARD_PURCHASE' ? (
              <>
                <CreditCard className="w-3 h-3 text-purple-400" /> Cartão de Crédito:
              </>
            ) : (
              <>
                <Wallet className="w-3 h-3 text-emerald-400" /> Conta Bancária:
              </>
            )}
          </label>
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            {type === 'CREDIT_CARD_PURCHASE'
              ? creditCards.map((card) => (
                  <button
                    key={card.id}
                    type="button"
                    onClick={() => setSelectedCard(card.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                      selectedCard === card.id
                        ? 'bg-purple-600 text-white ring-2 ring-purple-400'
                        : 'bg-slate-950 text-slate-300 hover:bg-slate-800 border border-slate-800'
                    }`}
                  >
                    💳 {card.name} ({card.brand})
                  </button>
                ))
              : accounts.map((acc) => (
                  <button
                    key={acc.id}
                    type="button"
                    onClick={() => setSelectedAccount(acc.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                      selectedAccount === acc.id
                        ? 'bg-emerald-600 text-white ring-2 ring-emerald-400'
                        : 'bg-slate-950 text-slate-300 hover:bg-slate-800 border border-slate-800'
                    }`}
                  >
                    🏦 {acc.name}
                  </button>
                ))}
          </div>
        </div>

        {/* Giant Custom Numpad Grid */}
        <div className="grid grid-cols-3 gap-2 pt-1">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9', '00', '0', 'DEL'].map((btn) => (
            <button
              key={btn}
              type="button"
              onClick={() => handleNumpadPress(btn)}
              className={`py-3 rounded-xl font-mono text-base font-extrabold transition-colors cursor-pointer select-none active:scale-95 ${
                btn === 'DEL'
                  ? 'bg-slate-900 hover:bg-rose-500/20 text-rose-400 border border-slate-800 flex items-center justify-center'
                  : 'bg-slate-900 hover:bg-slate-800 text-white border border-slate-800'
              }`}
            >
              {btn === 'DEL' ? <Delete className="w-5 h-5" /> : btn}
            </button>
          ))}
        </div>

        {/* One-Tap Save Button */}
        <div className="pt-2">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting || numericAmount <= 0}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-sm shadow-xl shadow-blue-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
          >
            <Check className="w-5 h-5" />
            <span>
              {submitting ? 'Lançando...' : `Confirmar ${formatCurrency(numericAmount)}`}
            </span>
          </button>
        </div>
      </div>
    </Modal>
  );
}
