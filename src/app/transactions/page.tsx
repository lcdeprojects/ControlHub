'use client';

import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { formatCurrency, formatDate } from '@/lib/utils';
import {
  Search,
  ArrowUpRight,
  ArrowDownRight,
  CreditCard,
  Layers,
  ArrowLeftRight,
  Plus,
  Tag,
  Pencil,
  Trash2,
  Check,
  MoreVertical,
  Wallet,
  CheckSquare,
  Square,
  X,
} from 'lucide-react';
import { QuickActionModal } from '@/components/dashboard/QuickActionModal';
import { CurrencyInput } from '@/components/ui/CurrencyInput';

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [amountFilter, setAmountFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState<'date' | 'amount' | 'description'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  // Batch Selection State
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBatchDeleting, setIsBatchDeleting] = useState(false);

  // Edit State
  const [editingTransaction, setEditingTransaction] = useState<any | null>(null);
  const [editDesc, setEditDesc] = useState('');
  const [editAmount, setEditAmount] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editCategoryId, setEditCategoryId] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Delete State
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const url = `/api/transactions?sortBy=${sortBy}&sortOrder=${sortOrder}`;
      const [txRes, catRes] = await Promise.all([
        fetch(url),
        fetch('/api/categories'),
      ]);
      const [txData, catData] = await Promise.all([
        txRes.json(),
        catRes.json(),
      ]);

      if (txData.success) {
        setTransactions(txData.transactions);
      }
      if (catData.success) {
        setCategories(catData.categories);
      }
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [sortBy, sortOrder]);

  const filtered = transactions.filter((t) => {
    const matchesSearch =
      t.description.toLowerCase().includes(search.toLowerCase()) ||
      (t.categoryName && t.categoryName.toLowerCase().includes(search.toLowerCase())) ||
      (t.accountName && t.accountName.toLowerCase().includes(search.toLowerCase()));

    if (!matchesSearch) return false;

    if (typeFilter === 'INCOME' && t.transactionType !== 'INCOME') return false;
    if (typeFilter === 'EXPENSE' && t.transactionType !== 'EXPENSE') return false;
    if (typeFilter === 'CREDIT' && t.transactionType !== 'CREDIT_CARD_PURCHASE' && t.transactionType !== 'INSTALLMENT') return false;
    if (typeFilter === 'TRANSFER' && t.transactionType !== 'TRANSFER') return false;

    if (amountFilter === 'GT_100' && t.amount < 100) return false;
    if (amountFilter === 'GT_500' && t.amount < 500) return false;
    if (amountFilter === 'GT_1000' && t.amount < 1000) return false;

    return true;
  });

  // Batch Selection Handlers
  const isAllSelected = filtered.length > 0 && filtered.every((t) => selectedIds.includes(t.id));

  const handleToggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filtered.map((t) => t.id));
    }
  };

  const handleToggleSelectOne = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleBatchDelete = async () => {
    if (selectedIds.length === 0) return;

    const count = selectedIds.length;
    if (
      !confirm(
        `Tem certeza que deseja excluir ${count} lançamento(s) selecionado(s)? Os saldos serão estornados automaticamente.`
      )
    ) {
      return;
    }

    setIsBatchDeleting(true);
    try {
      const res = await fetch('/api/transactions/batch-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedIds }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSelectedIds([]);
        await fetchTransactions();
      } else {
        alert(data.error || 'Erro ao excluir transações em lote.');
      }
    } catch (err) {
      console.error('Batch delete error:', err);
      alert('Falha de conexão.');
    } finally {
      setIsBatchDeleting(false);
    }
  };

  const selectedTotalSum = filtered
    .filter((t) => selectedIds.includes(t.id))
    .reduce((sum, t) => sum + t.amount, 0);

  const handleOpenEdit = (t: any) => {
    setEditingTransaction(t);
    setEditDesc(t.description);
    setEditAmount(t.amount.toString());
    setEditDate(t.transactionDate.slice(0, 10));
    setEditCategoryId(t.categoryId || 'cat_mercado');
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTransaction) return;

    setIsSaving(true);
    try {
      const res = await fetch(`/api/transactions/${editingTransaction.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: editDesc,
          amount: parseFloat(editAmount.replace(',', '.')),
          transactionDate: editDate,
          categoryId: editCategoryId,
        }),
      });

      if (res.ok) {
        setEditingTransaction(null);
        await fetchTransactions();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este lançamento financeiro?')) return;

    setDeletingId(id);
    try {
      const res = await fetch(`/api/transactions/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setSelectedIds((prev) => prev.filter((item) => item !== id));
        await fetchTransactions();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setDeletingId(null);
    }
  };

  const handleToggleSort = (field: 'date' | 'amount' | 'description') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
    } else {
      setSortBy(field);
      setSortOrder(field === 'amount' ? 'desc' : 'desc');
    }
  };

  const summaryFiltered = filtered.reduce(
    (acc, t) => {
      if (t.transactionType === 'INCOME') {
        acc.income += t.amount;
      } else if (
        t.transactionType === 'EXPENSE' ||
        t.transactionType === 'CREDIT_CARD_PURCHASE' ||
        t.transactionType === 'INSTALLMENT'
      ) {
        acc.expense += t.amount;
      }
      return acc;
    },
    { income: 0, expense: 0 }
  );
  const netFiltered = summaryFiltered.income - summaryFiltered.expense;

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'INCOME':
        return (
          <Badge variant="success">
            <ArrowUpRight className="w-3 h-3" /> Receita
          </Badge>
        );
      case 'EXPENSE':
        return (
          <Badge variant="danger">
            <ArrowDownRight className="w-3 h-3" /> Despesa
          </Badge>
        );
      case 'CREDIT_CARD_PURCHASE':
        return (
          <Badge variant="blue">
            <CreditCard className="w-3 h-3" /> Cartão (À vista)
          </Badge>
        );
      case 'INSTALLMENT':
        return (
          <Badge variant="purple">
            <Layers className="w-3 h-3" /> Parcela
          </Badge>
        );
      case 'TRANSFER':
        return (
          <Badge variant="default">
            <ArrowLeftRight className="w-3 h-3" /> Transferência
          </Badge>
        );
      case 'CREDIT_CARD_PAYMENT':
        return (
          <Badge variant="purple">
            <CreditCard className="w-3 h-3" /> Pgto Fatura
          </Badge>
        );
      default:
        return <Badge variant="default">{type}</Badge>;
    }
  };

  return (
    <div className="space-y-6 pb-20 md:pb-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white">Extrato de Transações</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Gerencie, edite ou exclua múltiplos lançamentos em lote com integridade automática de saldo
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-500/25 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Novo Lançamento</span>
        </button>
      </div>

      {/* Floating / Sticky Batch Action Bar when items selected */}
      {selectedIds.length > 0 && (
        <div className="sticky top-4 z-30 p-4 bg-slate-900/95 border border-rose-500/40 rounded-2xl shadow-2xl backdrop-blur-xl flex items-center justify-between gap-4 flex-wrap animate-in fade-in slide-in-from-top-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center font-bold text-xs shrink-0">
              {selectedIds.length}
            </div>
            <div>
              <span className="text-xs font-bold text-white block">
                {selectedIds.length} transação(ões) selecionada(s)
              </span>
              <span className="text-[11px] font-mono text-slate-400">
                Soma total: <strong className="text-rose-400">{formatCurrency(selectedTotalSum)}</strong>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSelectedIds([])}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer transition-colors"
            >
              Limpar Seleção
            </button>

            <button
              type="button"
              onClick={handleBatchDelete}
              disabled={isBatchDeleting}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-lg shadow-rose-600/30 cursor-pointer disabled:opacity-50 transition-all"
            >
              <Trash2 className="w-4 h-4" />
              <span>{isBatchDeleting ? 'Excluindo...' : `Excluir Selecionadas (${selectedIds.length})`}</span>
            </button>
          </div>
        </div>
      )}

      {/* Filters Bar */}
      <Card className="p-4 space-y-3">
        <div className="flex flex-col md:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Buscar por descrição, estabelecimento, categoria ou conta..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Sort Selector Dropdown */}
          <div className="flex items-center gap-2 w-full md:w-auto shrink-0">
            <span className="text-xs font-semibold text-slate-400 whitespace-nowrap">Ordenar por:</span>
            <select
              value={`${sortBy}_${sortOrder}`}
              onChange={(e) => {
                const [sb, so] = e.target.value.split('_');
                setSortBy(sb as any);
                setSortOrder(so as any);
              }}
              className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-bold focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="date_desc">📅 Data (Mais recente primeiro)</option>
              <option value="date_asc">📅 Data (Mais antiga primeiro)</option>
              <option value="amount_desc">📈 Maior Valor ➔ Menor Valor ⬇</option>
              <option value="amount_asc">📉 Menor Valor ➔ Maior Valor ⬆</option>
              <option value="description_asc">🔤 Descrição (A - Z)</option>
            </select>
          </div>
        </div>

        {/* Filter Pills: Type & Amount */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/80">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            <span className="text-[11px] text-slate-400 font-semibold mr-1">Tipo:</span>
            {[
              { id: 'ALL', label: 'Todos' },
              { id: 'INCOME', label: 'Receitas' },
              { id: 'EXPENSE', label: 'Despesas' },
              { id: 'CREDIT', label: 'Cartão de Crédito' },
              { id: 'TRANSFER', label: 'Transferências' },
            ].map((pill) => (
              <button
                key={pill.id}
                onClick={() => setTypeFilter(pill.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                  typeFilter === pill.id
                    ? 'bg-blue-600 text-white font-bold'
                    : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                {pill.label}
              </button>
            ))}
          </div>

          {/* Amount Filter Pills */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-slate-400 font-semibold mr-1">Valor:</span>
            {[
              { id: 'ALL', label: 'Qualquer' },
              { id: 'GT_100', label: '> R$ 100' },
              { id: 'GT_500', label: '> R$ 500' },
              { id: 'GT_1000', label: '> R$ 1.000' },
            ].map((af) => (
              <button
                key={af.id}
                onClick={() => setAmountFilter(af.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                  amountFilter === af.id
                    ? 'bg-purple-600 text-white font-bold'
                    : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                {af.label}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Live Summary Cards Bar for Filtered Items */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card className="p-3.5 flex items-center justify-between bg-slate-900/60 border-slate-800/80">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
              Receitas Filtradas
            </span>
            <h3 className="text-lg font-black text-emerald-400 mt-0.5">
              +{formatCurrency(summaryFiltered.income)}
            </h3>
          </div>
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
            <ArrowUpRight className="w-4 h-4" />
          </div>
        </Card>

        <Card className="p-3.5 flex items-center justify-between bg-slate-900/60 border-slate-800/80">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
              Despesas Filtradas
            </span>
            <h3 className="text-lg font-black text-rose-400 mt-0.5">
              -{formatCurrency(summaryFiltered.expense)}
            </h3>
          </div>
          <div className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-400 flex items-center justify-center">
            <ArrowDownRight className="w-4 h-4" />
          </div>
        </Card>

        <Card className="p-3.5 flex items-center justify-between bg-slate-900/60 border-slate-800/80">
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                Resultado Filtrado
              </span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-slate-800 text-slate-300 font-bold">
                {filtered.length} itens
              </span>
            </div>
            <h3
              className={`text-lg font-black mt-0.5 ${
                netFiltered >= 0 ? 'text-blue-400' : 'text-rose-400'
              }`}
            >
              {netFiltered >= 0 ? '+' : ''}{formatCurrency(netFiltered)}
            </h3>
          </div>
          <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
            <Wallet className="w-4 h-4" />
          </div>
        </Card>
      </div>

      {/* Transactions Container: Table for Desktop / Cards for Mobile */}
      <Card className="p-0 overflow-hidden">
        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
                <th className="py-3 px-3 text-center w-10">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    onChange={handleToggleSelectAll}
                    className="w-4 h-4 rounded bg-slate-900 border-slate-700 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    title="Selecionar / Desmarcar Todos"
                  />
                </th>
                <th
                  onClick={() => handleToggleSort('date')}
                  className="py-3 px-3 cursor-pointer hover:text-white transition-colors"
                >
                  <div className="flex items-center gap-1">
                    <span>Data</span>
                    {sortBy === 'date' && (sortOrder === 'desc' ? ' ↓' : ' ↑')}
                  </div>
                </th>
                <th
                  onClick={() => handleToggleSort('description')}
                  className="py-3 px-3 cursor-pointer hover:text-white transition-colors"
                >
                  <div className="flex items-center gap-1">
                    <span>Descrição</span>
                    {sortBy === 'description' && (sortOrder === 'desc' ? ' ↓' : ' ↑')}
                  </div>
                </th>
                <th className="py-3 px-3">Categoria</th>
                <th className="py-3 px-3">Conta / Cartão</th>
                <th className="py-3 px-3">Tipo</th>
                <th
                  onClick={() => handleToggleSort('amount')}
                  className="py-3 px-3 text-right cursor-pointer hover:text-white transition-colors"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Valor</span>
                    {sortBy === 'amount' && (sortOrder === 'desc' ? ' ⬇' : ' ⬆')}
                  </div>
                </th>
                <th className="py-3 px-3 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500">
                    Nenhum lançamento encontrado.
                  </td>
                </tr>
              ) : (
                filtered.map((t) => {
                  const isSelected = selectedIds.includes(t.id);

                  return (
                    <tr
                      key={t.id}
                      className={`transition-colors ${
                        isSelected ? 'bg-blue-950/30' : 'hover:bg-slate-800/20'
                      }`}
                    >
                      <td className="py-3 px-3 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelectOne(t.id)}
                          className="w-4 h-4 rounded bg-slate-900 border-slate-700 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-400">
                        {formatDate(t.transactionDate)}
                      </td>
                      <td className="py-3 px-3 font-medium text-white max-w-xs truncate">
                        {t.description}
                      </td>
                      <td className="py-3 px-3">
                        <span className="flex items-center gap-1.5 text-slate-300">
                          <Tag className="w-3 h-3 text-slate-500" />
                          {t.categoryName || 'Sem categoria'}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-400">
                        {t.cardName ? (
                          <span className="text-blue-400 font-medium">{t.cardName}</span>
                        ) : (
                          t.accountName || 'Conta Corrente'
                        )}
                      </td>
                      <td className="py-3 px-3">{getTypeBadge(t.transactionType)}</td>
                      <td className="py-3 px-3 text-right font-mono font-bold">
                        <span
                          className={
                            t.transactionType === 'INCOME'
                              ? 'text-emerald-400'
                              : t.transactionType === 'EXPENSE' ||
                                t.transactionType === 'CREDIT_CARD_PURCHASE' ||
                                t.transactionType === 'INSTALLMENT'
                              ? 'text-rose-400'
                              : 'text-slate-300'
                          }
                        >
                          {t.transactionType === 'INCOME' ? '+' : '-'} {formatCurrency(t.amount)}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleOpenEdit(t)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-400 hover:bg-slate-800 transition-colors cursor-pointer"
                            title="Editar lançamento"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(t.id)}
                            disabled={deletingId === t.id}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors cursor-pointer disabled:opacity-50"
                            title="Excluir lançamento"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards View with Select Checkbox */}
        <div className="block md:hidden divide-y divide-slate-800/60">
          {filtered.length === 0 ? (
            <div className="py-8 text-center text-slate-500 text-xs">
              Nenhum lançamento encontrado.
            </div>
          ) : (
            filtered.map((t) => {
              const isSelected = selectedIds.includes(t.id);

              return (
                <div
                  key={t.id}
                  className={`p-4 space-y-2.5 transition-colors relative ${
                    isSelected ? 'bg-blue-950/30' : 'hover:bg-slate-900/40'
                  }`}
                >
                  {/* Header: Select Checkbox + Date + Badge + Dropdown Menu (...) */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleSelectOne(t.id)}
                        className="w-4 h-4 rounded bg-slate-900 border-slate-700 text-blue-600 focus:ring-blue-500 cursor-pointer"
                      />
                      <span className="text-[11px] font-mono text-slate-400">
                        {formatDate(t.transactionDate)}
                      </span>
                      {getTypeBadge(t.transactionType)}
                    </div>

                    {/* Action Menu (...) */}
                    <div className="relative">
                      <button
                        onClick={() => setOpenMenuId(openMenuId === t.id ? null : t.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                        title="Opções"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>

                      {openMenuId === t.id && (
                        <>
                          <div
                            className="fixed inset-0 z-10"
                            onClick={() => setOpenMenuId(null)}
                          />
                          <div className="absolute right-0 top-8 z-20 w-36 py-1 bg-slate-900 border border-slate-700 rounded-xl shadow-xl space-y-0.5">
                            <button
                              onClick={() => {
                                setOpenMenuId(null);
                                handleOpenEdit(t);
                              }}
                              className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-800 hover:text-blue-400 transition-colors text-left cursor-pointer"
                            >
                              <Pencil className="w-3.5 h-3.5 text-blue-400" />
                              <span>Editar</span>
                            </button>

                            <button
                              onClick={() => {
                                setOpenMenuId(null);
                                handleDelete(t.id);
                              }}
                              disabled={deletingId === t.id}
                              className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-rose-400 hover:bg-rose-500/10 transition-colors text-left cursor-pointer disabled:opacity-50"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Excluir</span>
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Body: Description + Badges & Amount */}
                  <div className="flex items-baseline justify-between gap-3 pt-1">
                    <div className="space-y-1 min-w-0 flex-1">
                      <h4 className="text-sm font-bold text-white truncate">{t.description}</h4>
                      <div className="flex items-center gap-1.5 text-xs text-slate-400 flex-wrap">
                        <span className="flex items-center gap-1 text-slate-300">
                          <Tag className="w-3 h-3 text-slate-500" />
                          {t.categoryName || 'Sem categoria'}
                        </span>
                        <span>•</span>
                        <span className="text-slate-400">
                          {t.cardName ? (
                            <span className="text-blue-400 font-medium">{t.cardName}</span>
                          ) : (
                            t.accountName || 'Conta Corrente'
                          )}
                        </span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span
                        className={`text-base font-mono font-extrabold ${
                          t.transactionType === 'INCOME'
                            ? 'text-emerald-400'
                            : t.transactionType === 'EXPENSE' ||
                              t.transactionType === 'CREDIT_CARD_PURCHASE' ||
                              t.transactionType === 'INSTALLMENT'
                            ? 'text-rose-400'
                            : 'text-slate-300'
                        }`}
                      >
                        {t.transactionType === 'INCOME' ? '+' : '-'} {formatCurrency(t.amount)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </Card>

      {/* Edit Modal */}
      {editingTransaction && (
        <Modal
          isOpen={!!editingTransaction}
          onClose={() => setEditingTransaction(null)}
          title="Editar Lançamento"
          description="Altere os dados da transação. Os saldos e a auditoria serão atualizados automaticamente."
        >
          <form onSubmit={handleSaveEdit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Descrição
              </label>
              <input
                type="text"
                required
                value={editDesc}
                onChange={(e) => setEditDesc(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Valor (R$)
                </label>
                <CurrencyInput
                  required
                  placeholder="R$ 0,00"
                  value={editAmount}
                  onChange={(val) => setEditAmount(val)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-bold text-base focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Data
                </label>
                <input
                  type="date"
                  required
                  value={editDate}
                  onChange={(e) => setEditDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Categoria
              </label>
              <select
                value={editCategoryId}
                onChange={(e) => setEditCategoryId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:border-blue-500 focus:outline-none"
              >
                {categories
                  .filter((c) =>
                    editingTransaction.transactionType === 'INCOME'
                      ? c.type === 'INCOME'
                      : c.type === 'EXPENSE' || c.type === 'HOUSEHOLD'
                  )
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
              </select>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setEditingTransaction(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-500/25 cursor-pointer disabled:opacity-50"
              >
                <Check className="w-4 h-4" />
                <span>{isSaving ? 'Salvando...' : 'Salvar Alterações'}</span>
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* New Transaction Modal */}
      <QuickActionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchTransactions}
      />
    </div>
  );
}
