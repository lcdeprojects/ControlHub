'use client';

import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { formatCurrency, formatDate } from '@/lib/utils';
import {
  Search,
  Filter,
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
} from 'lucide-react';
import { QuickActionModal } from '@/components/dashboard/QuickActionModal';
import { CurrencyInput } from '@/components/ui/CurrencyInput';

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);

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
      const [txRes, catRes] = await Promise.all([
        fetch('/api/transactions'),
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
  }, []);

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
        await fetchTransactions();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setDeletingId(null);
    }
  };

  const filtered = transactions.filter((t) => {
    const matchesSearch =
      t.description.toLowerCase().includes(search.toLowerCase()) ||
      (t.categoryName && t.categoryName.toLowerCase().includes(search.toLowerCase())) ||
      (t.accountName && t.accountName.toLowerCase().includes(search.toLowerCase()));

    if (typeFilter === 'ALL') return matchesSearch;
    if (typeFilter === 'INCOME') return matchesSearch && t.transactionType === 'INCOME';
    if (typeFilter === 'EXPENSE') return matchesSearch && t.transactionType === 'EXPENSE';
    if (typeFilter === 'CREDIT')
      return matchesSearch && (t.transactionType === 'CREDIT_CARD_PURCHASE' || t.transactionType === 'INSTALLMENT');
    if (typeFilter === 'TRANSFER') return matchesSearch && t.transactionType === 'TRANSFER';
    return matchesSearch;
  });

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
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white">Extrato de Transações</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Gerencie, edite ou exclua lançamentos com rastreabilidade e integridade automática de saldo
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

      {/* Filters Bar */}
      <Card className="p-4 flex flex-col md:flex-row items-center gap-3">
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

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
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
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                typeFilter === pill.id
                  ? 'bg-blue-600 text-white font-bold'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {pill.label}
            </button>
          ))}
        </div>
      </Card>

      {/* Transactions Container: Table for Desktop / Cards for Mobile */}
      <Card className="p-0 overflow-hidden">
        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
                <th className="py-3 px-4">Data</th>
                <th className="py-3 px-4">Descrição</th>
                <th className="py-3 px-4">Categoria</th>
                <th className="py-3 px-4">Conta / Cartão</th>
                <th className="py-3 px-4">Tipo</th>
                <th className="py-3 px-4 text-right">Valor</th>
                <th className="py-3 px-4 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">
                    Nenhum lançamento encontrado.
                  </td>
                </tr>
              ) : (
                filtered.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-800/20 transition-colors">
                    <td className="py-3 px-4 font-mono text-slate-400">
                      {formatDate(t.transactionDate)}
                    </td>
                    <td className="py-3 px-4 font-medium text-white max-w-xs truncate">
                      {t.description}
                    </td>
                    <td className="py-3 px-4">
                      <span className="flex items-center gap-1.5 text-slate-300">
                        <Tag className="w-3 h-3 text-slate-500" />
                        {t.categoryName || 'Sem categoria'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-400">
                      {t.cardName ? (
                        <span className="text-blue-400 font-medium">{t.cardName}</span>
                      ) : (
                        t.accountName || 'Conta Corrente'
                      )}
                    </td>
                    <td className="py-3 px-4">{getTypeBadge(t.transactionType)}</td>
                    <td className="py-3 px-4 text-right font-mono font-bold">
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
                    <td className="py-3 px-4 text-center">
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
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards View */}
        <div className="block md:hidden divide-y divide-slate-800/60">
          {filtered.length === 0 ? (
            <div className="py-8 text-center text-slate-500 text-xs">
              Nenhum lançamento encontrado.
            </div>
          ) : (
            filtered.map((t) => (
              <div key={t.id} className="p-4 space-y-3 hover:bg-slate-900/40 transition-colors">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-mono text-slate-400">
                    {formatDate(t.transactionDate)}
                  </span>
                  <div>{getTypeBadge(t.transactionType)}</div>
                </div>

                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1 min-w-0 flex-1">
                    <h4 className="text-sm font-bold text-white truncate">{t.description}</h4>
                    <div className="flex items-center gap-2 text-xs text-slate-400 flex-wrap">
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

                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    onClick={() => handleOpenEdit(t)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-medium border border-slate-800 transition-colors cursor-pointer"
                  >
                    <Pencil className="w-3.5 h-3.5 text-blue-400" />
                    <span>Editar</span>
                  </button>
                  <button
                    onClick={() => handleDelete(t.id)}
                    disabled={deletingId === t.id}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-medium border border-rose-500/20 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Excluir</span>
                  </button>
                </div>
              </div>
            ))
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
