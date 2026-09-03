'use client';

import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import {
  ArrowDownRight,
  ArrowUpRight,
  CreditCard,
  Check,
  Delete,
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
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface MobileQuickAddDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  onSwitchToFullForm?: () => void;
}

// Fallback das 4 categorias principais solicitadas pelo usuário
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
  const [amountStr, setAmountStr] = useState('0');
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
            // Filtrar categorias marcadas para o QuickModal (showInQuickAdd) ou usar as 4 principais por padrão
            const quickCats = catData.categories.filter((c: any) => c.showInQuickAdd);
            if (quickCats.length > 0) {
              setCategories(quickCats);
              setSelectedCategory(quickCats[0].id);
            } else {
              // Fallback para as 4 categorias solicitadas
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
      if (prev.length >= 7) return prev;
      return prev + val;
    });
  };

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

  const activeCategories = categories.filter((c) =>
    type === 'INCOME' ? c.type === 'INCOME' : c.type !== 'INCOME'
  );
  const displayCategories = activeCategories.length > 0 ? activeCategories : DEFAULT_QUICK_CATEGORIES;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="🚀 Express Quick-Add (Mobile)"
      description="Lançamento ultra-rápido com pad numérico e chips em 1 toque."
    >
      <div className="space-y-4 pt-1">
        {/* Switch to Full Form Button */}
        {onSwitchToFullForm && (
          <div className="flex items-center justify-end">
            <button
              type="button"
              onClick={onSwitchToFullForm}
              className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-blue-400 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5 text-blue-400" />
              <span>Formulário Completo 📝</span>
            </button>
          </div>
        )}

        {/* Type Selector Tabs */}
        <div className="grid grid-cols-3 gap-1.5 bg-slate-900/90 p-1.5 rounded-2xl border border-slate-800">
          <button
            type="button"
            onClick={() => setType('EXPENSE')}
            className={`py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              type === 'EXPENSE'
                ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/30 scale-[1.02]'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <ArrowDownRight className="w-4 h-4 text-rose-200" /> Despesa
          </button>

          <button
            type="button"
            onClick={() => setType('INCOME')}
            className={`py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              type === 'INCOME'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30 scale-[1.02]'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <ArrowUpRight className="w-4 h-4 text-emerald-200" /> Receita
          </button>

          <button
            type="button"
            onClick={() => setType('CREDIT_CARD_PURCHASE')}
            className={`py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              type === 'CREDIT_CARD_PURCHASE'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30 scale-[1.02]'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <CreditCard className="w-4 h-4 text-blue-200" /> Cartão
          </button>
        </div>

        {/* Big Amount Display */}
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 text-center shadow-inner">
          <span className="text-[10px] uppercase font-black tracking-widest text-slate-400 block mb-1">
            Valor do Lançamento
          </span>
          <div
            className={`text-3xl sm:text-4xl font-mono font-black tracking-tight ${
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
            placeholder="Descrição (opcional - usa a categoria se vazio)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-4 py-2.5 bg-slate-900/80 border border-slate-800 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
          />
        </div>

        {/* Clickable Fast Chips - Categories */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-blue-400" /> Categorias Rápidas:
            </label>
            <a
              href="/settings"
              onClick={onClose}
              className="text-[10px] text-blue-400 hover:text-blue-300 font-bold flex items-center gap-1"
            >
              <SlidersHorizontal className="w-3 h-3" /> Customizar
            </a>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
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
                  className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30 border border-blue-400 scale-[1.02]'
                      : 'bg-slate-900/90 hover:bg-slate-800/90 text-slate-300 border border-slate-800'
                  }`}
                >
                  <span className={isSelected ? 'text-white' : 'text-blue-400'}>
                    {IconComponent}
                  </span>
                  <span className="truncate">{c.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Clickable Fast Chips - Accounts / Credit Cards */}
        <div className="space-y-2">
          <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            {type === 'CREDIT_CARD_PURCHASE' ? (
              <>
                <CreditCard className="w-3.5 h-3.5 text-purple-400" /> Cartão de Crédito:
              </>
            ) : (
              <>
                <Wallet className="w-3.5 h-3.5 text-emerald-400" /> Conta Bancária:
              </>
            )}
          </label>
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
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
                          ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30 border border-purple-400 scale-105'
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
                          ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30 border border-emerald-400 scale-105'
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

        {/* Giant Custom Numpad Grid */}
        <div className="grid grid-cols-3 gap-2.5 pt-1">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9', '00', '0', 'DEL'].map((btn) => (
            <button
              key={btn}
              type="button"
              onClick={() => handleNumpadPress(btn)}
              className={`py-3.5 rounded-2xl font-mono text-lg font-black transition-all cursor-pointer select-none active:scale-95 flex items-center justify-center ${
                btn === 'DEL'
                  ? 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30'
                  : 'bg-slate-900/90 hover:bg-slate-800 text-white border border-slate-800/80 hover:border-slate-700 shadow-sm'
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
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-black text-sm shadow-xl shadow-indigo-500/25 flex items-center justify-center gap-2 transition-all active:scale-98 cursor-pointer disabled:opacity-50"
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
