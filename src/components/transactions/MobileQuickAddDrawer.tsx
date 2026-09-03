'use client';

import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import {
  ArrowDownRight,
  ArrowUpRight,
  CreditCard,
  Check,
  Tag,
  Wallet,
  ShoppingCart,
  Utensils,
  Fuel,
  Palmtree,
  Car,
  Home,
  HeartPulse,
  Briefcase,
  TrendingUp,
  SlidersHorizontal,
  FileText,
  DollarSign,
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface MobileQuickAddDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  onSwitchToFullForm?: () => void;
}

const DEFAULT_QUICK_CATEGORIES = [
  { id: 'cat_mercado', name: 'Mercado', icon: 'shopping-cart', type: 'EXPENSE' },
  { id: 'cat_restaurantes', name: 'Restaurantes', icon: 'utensils', type: 'EXPENSE' },
  { id: 'cat_combustivel', name: 'Combustível', icon: 'fuel', type: 'EXPENSE' },
  { id: 'cat_lazer', name: 'Lazer', icon: 'palmtree', type: 'EXPENSE' },
];

const DEFAULT_ACCOUNTS = [
  { id: 'acc_default_1', name: 'Conta Corrente' },
  { id: 'acc_default_2', name: 'Nubank' },
  { id: 'acc_default_3', name: 'Itaú' },
  { id: 'acc_default_4', name: 'Carteira' },
];

const DEFAULT_CARDS = [
  { id: 'card_default_1', name: 'Cartão Principal' },
  { id: 'card_default_2', name: 'Nubank' },
];

function getCategoryIcon(name: string, iconStr?: string) {
  const norm = (name || '').toLowerCase();
  if (norm.includes('mercado') || iconStr === 'shopping-cart') return <ShoppingCart className="w-3.5 h-3.5" />;
  if (norm.includes('restaurante') || norm.includes('aliment') || iconStr === 'utensils') return <Utensils className="w-3.5 h-3.5" />;
  if (norm.includes('combust') || iconStr === 'fuel') return <Fuel className="w-3.5 h-3.5" />;
  if (norm.includes('lazer') || norm.includes('viagem') || iconStr === 'palmtree') return <Palmtree className="w-3.5 h-3.5" />;
  if (norm.includes('transporte') || norm.includes('uber') || iconStr === 'car') return <Car className="w-3.5 h-3.5" />;
  if (norm.includes('moradia') || norm.includes('aluguel') || iconStr === 'home') return <Home className="w-3.5 h-3.5" />;
  if (norm.includes('saúde') || norm.includes('farmácia') || iconStr === 'heart-pulse') return <HeartPulse className="w-3.5 h-3.5" />;
  if (norm.includes('salário') || iconStr === 'briefcase') return <Briefcase className="w-3.5 h-3.5" />;
  if (norm.includes('rendimento') || iconStr === 'trending-up') return <TrendingUp className="w-3.5 h-3.5" />;
  return <Tag className="w-3.5 h-3.5" />;
}

export function MobileQuickAddDrawer({
  isOpen,
  onClose,
  onSuccess,
  onSwitchToFullForm,
}: MobileQuickAddDrawerProps) {
  const [type, setType] = useState<'EXPENSE' | 'INCOME' | 'CREDIT_CARD_PURCHASE'>('EXPENSE');
  const [rawAmount, setRawAmount] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('cat_mercado');
  const [selectedAccount, setSelectedAccount] = useState('');
  const [selectedCard, setSelectedCard] = useState('');
  const [categories, setCategories] = useState<any[]>(DEFAULT_QUICK_CATEGORIES);
  const [accounts, setAccounts] = useState<any[]>(DEFAULT_ACCOUNTS);
  const [creditCards, setCreditCards] = useState<any[]>(DEFAULT_CARDS);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      Promise.all([
        fetch('/api/categories').then((r) => r.json()).catch(() => null),
        fetch('/api/accounts').then((r) => r.json()).catch(() => null),
        fetch('/api/cards').then((r) => r.json()).catch(() => null),
      ])
        .then(([catData, accData, cardData]) => {
          if (catData?.success && catData.categories?.length > 0) {
            const quickCats = catData.categories.filter((c: any) => c.showInQuickAdd);
            if (quickCats.length > 0) {
              setCategories(quickCats);
              setSelectedCategory(quickCats[0].id);
            } else {
              const main4 = catData.categories.filter((c: any) =>
                ['mercado', 'restaurante', 'combustível', 'lazer'].some((key) =>
                  c.name.toLowerCase().includes(key)
                )
              );
              if (main4.length > 0) {
                setCategories(main4);
                setSelectedCategory(main4[0].id);
              } else {
                setCategories(catData.categories.slice(0, 6));
                setSelectedCategory(catData.categories[0].id);
              }
            }
          }
          if (accData?.success && accData.accounts?.length > 0) {
            setAccounts(accData.accounts);
            setSelectedAccount(accData.accounts[0].id);
          }
          if (cardData?.success && cardData.cards?.length > 0) {
            setCreditCards(cardData.cards);
            setSelectedCard(cardData.cards[0].id);
          }
        })
        .catch(console.error);
    }
  }, [isOpen]);

  const numericAmount = parseFloat(rawAmount.replace(',', '.')) || 0;

  const handleAddAmountPreset = (addValue: number) => {
    const current = numericAmount;
    setRawAmount((current + addValue).toFixed(2));
  };

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
        categoryId: selectedCategory && !selectedCategory.startsWith('cat_default') ? selectedCategory : null,
      };

      if (type === 'CREDIT_CARD_PURCHASE') {
        body.creditCardId = selectedCard && !selectedCard.startsWith('card_default') ? selectedCard : null;
        body.paymentMethod = 'CREDIT';
      } else {
        body.accountId = selectedAccount && !selectedAccount.startsWith('acc_default') ? selectedAccount : null;
        body.paymentMethod = type === 'INCOME' ? 'PIX' : 'DEBIT';
      }

      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (data.success) {
        setRawAmount('');
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

  const activeCategories = categories.filter((c) =>
    type === 'INCOME' ? c.type === 'INCOME' : c.type !== 'INCOME'
  );
  const displayCategories = activeCategories.length > 0 ? activeCategories : DEFAULT_QUICK_CATEGORIES;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="🚀 Express Quick-Add (Mobile)"
      description="Lançamento ultracompacto com teclado numérico nativo."
    >
      <div className="space-y-3.5 pt-0.5">
        {/* Switch to Full Form Header Button */}
        {onSwitchToFullForm && (
          <div className="flex items-center justify-end">
            <button
              type="button"
              onClick={onSwitchToFullForm}
              className="px-2.5 py-1 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-blue-400 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5 text-blue-400" />
              <span>Formulário Completo 📝</span>
            </button>
          </div>
        )}

        {/* Type Selector Tabs */}
        <div className="grid grid-cols-3 gap-1 bg-slate-900/90 p-1 rounded-xl border border-slate-800">
          <button
            type="button"
            onClick={() => setType('EXPENSE')}
            className={`py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-all cursor-pointer ${
              type === 'EXPENSE'
                ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <ArrowDownRight className="w-3.5 h-3.5 text-rose-200" /> Despesa
          </button>

          <button
            type="button"
            onClick={() => setType('INCOME')}
            className={`py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-all cursor-pointer ${
              type === 'INCOME'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <ArrowUpRight className="w-3.5 h-3.5 text-emerald-200" /> Receita
          </button>

          <button
            type="button"
            onClick={() => setType('CREDIT_CARD_PURCHASE')}
            className={`py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-all cursor-pointer ${
              type === 'CREDIT_CARD_PURCHASE'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5 text-blue-200" /> Cartão
          </button>
        </div>

        {/* Numeric Input Field (Abre o teclado numérico do próprio celular!) */}
        <div className="space-y-1.5">
          <div className="relative">
            <span className="absolute left-3.5 top-3.5 text-sm font-black text-slate-400">R$</span>
            <input
              type="number"
              step="0.01"
              inputMode="decimal"
              placeholder="0.00"
              value={rawAmount}
              onChange={(e) => setRawAmount(e.target.value)}
              className={`w-full pl-10 pr-4 py-3 bg-slate-900 border rounded-2xl text-2xl font-mono font-black text-white focus:outline-none transition-all ${
                type === 'INCOME'
                  ? 'border-emerald-500/40 text-emerald-400 focus:border-emerald-500'
                  : type === 'EXPENSE'
                  ? 'border-rose-500/40 text-rose-400 focus:border-rose-500'
                  : 'border-blue-500/40 text-blue-400 focus:border-blue-500'
              }`}
            />
          </div>

          {/* Quick Preset Add Buttons (+10, +50, +100, +500) */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            <span className="text-[10px] text-slate-500 font-bold uppercase shrink-0">Atalhos:</span>
            {[10, 50, 100, 200, 500].map((val) => (
              <button
                key={val}
                type="button"
                onClick={() => handleAddAmountPreset(val)}
                className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[11px] font-bold text-slate-300 hover:text-white shrink-0 cursor-pointer transition-colors"
              >
                +{val}
              </button>
            ))}
          </div>
        </div>

        {/* Optional Description Input */}
        <div>
          <input
            type="text"
            placeholder="Descrição (opcional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3.5 py-2 bg-slate-900/80 border border-slate-800 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Clickable Fast Chips - Categories */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-blue-400" /> Categoria:
            </label>
            <a
              href="/settings"
              onClick={onClose}
              className="text-[10px] text-blue-400 hover:text-blue-300 font-bold flex items-center gap-1"
            >
              <SlidersHorizontal className="w-3 h-3" /> Personalizar
            </a>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            {displayCategories.map((c) => {
              const isSelected = selectedCategory === c.id;
              const IconComponent = getCategoryIcon(c.name, c.icon);

              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => {
                    setSelectedCategory(c.id);
                    if (!description) {
                      setDescription(c.name);
                    }
                  }}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer shrink-0 ${
                    isSelected
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 border border-blue-400 scale-[1.02]'
                      : 'bg-slate-900/90 hover:bg-slate-800 text-slate-300 border border-slate-800'
                  }`}
                >
                  <span className={isSelected ? 'text-white' : 'text-blue-400'}>
                    {IconComponent}
                  </span>
                  <span>{c.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Clickable Fast Chips - Accounts / Credit Cards */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            {type === 'CREDIT_CARD_PURCHASE' ? (
              <>
                <CreditCard className="w-3.5 h-3.5 text-purple-400" /> Cartão:
              </>
            ) : (
              <>
                <Wallet className="w-3.5 h-3.5 text-emerald-400" /> Conta:
              </>
            )}
          </label>
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            {type === 'CREDIT_CARD_PURCHASE'
              ? (creditCards.length > 0 ? creditCards : DEFAULT_CARDS).map((card) => {
                  const isSelected = selectedCard === card.id;

                  return (
                    <button
                      key={card.id}
                      type="button"
                      onClick={() => setSelectedCard(card.id)}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer shrink-0 ${
                        isSelected
                          ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30 border border-purple-400 scale-[1.02]'
                          : 'bg-slate-900/90 hover:bg-slate-800 text-slate-300 border border-slate-800'
                      }`}
                    >
                      <CreditCard className="w-3.5 h-3.5 text-purple-300" />
                      <span>{card.name}</span>
                    </button>
                  );
                })
              : (accounts.length > 0 ? accounts : DEFAULT_ACCOUNTS).map((acc) => {
                  const isSelected = selectedAccount === acc.id;

                  return (
                    <button
                      key={acc.id}
                      type="button"
                      onClick={() => setSelectedAccount(acc.id)}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer shrink-0 ${
                        isSelected
                          ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30 border border-emerald-400 scale-[1.02]'
                          : 'bg-slate-900/90 hover:bg-slate-800 text-slate-300 border border-slate-800'
                      }`}
                    >
                      <Wallet className="w-3.5 h-3.5 text-emerald-300" />
                      <span>{acc.name}</span>
                    </button>
                  );
                })}
          </div>
        </div>

        {/* Compact Confirm Button */}
        <div className="pt-1">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting || numericAmount <= 0}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-black text-xs shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2 transition-all active:scale-98 cursor-pointer disabled:opacity-50"
          >
            <Check className="w-4 h-4" />
            <span>
              {submitting ? 'Lançando...' : `Confirmar Lançamento (${formatCurrency(numericAmount)})`}
            </span>
          </button>
        </div>
      </div>
    </Modal>
  );
}
