'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { formatCurrency, formatMonthYear, formatDate } from '@/lib/utils';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import {
  Home,
  Building,
  Zap,
  Droplet,
  Wifi,
  Wrench,
  ShoppingCart,
  Plus,
  Pencil,
  Trash2,
  Check,
  Tag,
  Landmark,
  ShieldCheck,
  CheckCircle2,
  Clock,
  ZapIcon,
  RotateCcw,
} from 'lucide-react';
import { usePeriod } from '@/contexts/PeriodContext';

interface HouseExpense {
  id: string;
  name: string;
  amount: number;
  dayOfMonth?: number;
  accountId?: string;
  accountName?: string;
  categoryId?: string;
  categoryName?: string;
  categoryIcon?: string;
  categoryColor?: string;
  status: 'PAID' | 'PENDING';
  paidTransactionId?: string | null;
  paidDate?: string | null;
  paidAccountId?: string | null;
  paidAccountName?: string | null;
}

interface Account {
  id: string;
  name: string;
  currentBalance: number;
}

const iconMap: Record<string, any> = {
  home: Home,
  building: Building,
  zap: Zap,
  droplet: Droplet,
  wifi: Wifi,
  wrench: Wrench,
  'shopping-cart': ShoppingCart,
  tag: Tag,
};

const householdCategories = [
  { id: 'cat_moradia', name: 'Moradia / Aluguel', icon: 'home', color: '#6366f1' },
  { id: 'cat_condominio', name: 'Condomínio', icon: 'building', color: '#8b5cf6' },
  { id: 'cat_energia', name: 'Energia Elétrica', icon: 'zap', color: '#eab308' },
  { id: 'cat_agua', name: 'Água & Saneamento', icon: 'droplet', color: '#06b6d4' },
  { id: 'cat_internet', name: 'Internet & Fibra', icon: 'wifi', color: '#3b82f6' },
  { id: 'cat_manutencao', name: 'Manutenção da Casa', icon: 'wrench', color: '#64748b' },
  { id: 'cat_outros', name: 'Outros Custos', icon: 'tag', color: '#94a3b8' },
];

export default function HouseholdPage() {
  const { month, year } = usePeriod();
  const [houseExpenses, setHouseExpenses] = useState<HouseExpense[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [monthlyHistory, setMonthlyHistory] = useState<any[]>([]);
  const [totalPlanned, setTotalPlanned] = useState(0);
  const [totalPaid, setTotalPaid] = useState(0);
  const [totalPending, setTotalPending] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // New Modal States
  const [isNewExpenseOpen, setIsNewExpenseOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [newDay, setNewDay] = useState('5');
  const [newCategoryId, setNewCategoryId] = useState('cat_moradia');
  const [newAccountId, setNewAccountId] = useState('');
  const [debitNow, setDebitNow] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Edit Modal States
  const [editingExpense, setEditingExpense] = useState<HouseExpense | null>(null);
  const [editName, setEditName] = useState('');
  const [editAmount, setEditAmount] = useState('');
  const [editCategoryId, setEditCategoryId] = useState('cat_moradia');

  // Single Pay Modal States
  const [payingExpense, setPayingExpense] = useState<HouseExpense | null>(null);
  const [payAccountId, setPayAccountId] = useState('');
  const [payDate, setPayDate] = useState('');
  const [isPaying, setIsPaying] = useState(false);

  // Bulk Pay State
  const [isBulkPaying, setIsBulkPaying] = useState(false);

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/household?month=${month}&year=${year}`);
      const data = await res.json();
      if (data.success) {
        setHouseExpenses(data.expenses || []);
        setTotalPlanned(data.totalPlanned || 0);
        setTotalPaid(data.totalPaid || 0);
        setTotalPending(data.totalPending || 0);
        setPendingCount(data.pendingCount || 0);
        setMonthlyHistory(data.monthlyHistory || []);
      }
    } catch (err) {
      console.error('Erro ao carregar despesas da casa:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAccounts = async () => {
    try {
      const res = await fetch('/api/accounts');
      const data = await res.json();
      if (data.success && Array.isArray(data.accounts)) {
        setAccounts(data.accounts);
        if (data.accounts.length > 0 && !newAccountId) {
          setNewAccountId(data.accounts[0].id);
        }
      }
    } catch (err) {
      console.error('Erro ao carregar contas bancárias:', err);
    }
  };

  useEffect(() => {
    fetchExpenses();
    fetchAccounts();
  }, [month, year]);

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newAmount) return;

    try {
      setIsSaving(true);
      const res = await fetch('/api/household', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newName,
          amount: newAmount,
          dayOfMonth: newDay,
          categoryId: newCategoryId,
          accountId: newAccountId || undefined,
          debitNow: Boolean(newAccountId && debitNow),
          month,
          year,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setIsNewExpenseOpen(false);
        setNewName('');
        setNewAmount('');
        setNewDay('5');
        await fetchExpenses();
        await fetchAccounts();
      }
    } catch (err) {
      console.error('Erro ao adicionar custo da casa:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpenEdit = (item: HouseExpense) => {
    setEditingExpense(item);
    setEditName(item.name);
    setEditAmount(item.amount.toString());
    setEditCategoryId(item.categoryId || 'cat_moradia');
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingExpense) return;

    try {
      setIsSaving(true);
      const res = await fetch(`/api/household/${editingExpense.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editName,
          amount: editAmount,
          categoryId: editCategoryId,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setEditingExpense(null);
        await fetchExpenses();
      }
    } catch (err) {
      console.error('Erro ao atualizar custo da casa:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteExpense = async (id: string) => {
    if (!confirm('Deseja realmente remover esta despesa fixa da casa?')) return;

    try {
      const res = await fetch(`/api/household/${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        await fetchExpenses();
        await fetchAccounts();
      }
    } catch (err) {
      console.error('Erro ao excluir custo da casa:', err);
    }
  };

  const handleOpenPay = (item: HouseExpense) => {
    setPayingExpense(item);
    setPayAccountId(item.accountId || (accounts[0]?.id || ''));
    const dayStr = String(Math.min(Math.max(item.dayOfMonth || 5, 1), 28)).padStart(2, '0');
    const monthStr = String(month).padStart(2, '0');
    setPayDate(`${year}-${monthStr}-${dayStr}`);
  };

  const handleConfirmPay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payingExpense || !payAccountId) return;

    try {
      setIsPaying(true);
      const res = await fetch('/api/household/pay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recurringId: payingExpense.id,
          accountId: payAccountId,
          paymentDate: payDate,
          month,
          year,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setPayingExpense(null);
        await fetchExpenses();
        await fetchAccounts();
      }
    } catch (err) {
      console.error('Erro ao baixar despesa:', err);
    } finally {
      setIsPaying(false);
    }
  };

  const handleUnpay = async (transactionId: string) => {
    if (!confirm('Deseja estornar esta baixa? O valor será devolvido ao saldo da conta.')) return;

    try {
      const res = await fetch('/api/household/unpay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactionId }),
      });

      const data = await res.json();
      if (data.success) {
        await fetchExpenses();
        await fetchAccounts();
      }
    } catch (err) {
      console.error('Erro ao estornar pagamento:', err);
    }
  };

  const handleBulkPay = async () => {
    if (!confirm(`Deseja baixar todas as ${pendingCount} despesas pendentes de ${formatMonthYear(month, year)} debitando das contas cadastradas?`)) {
      return;
    }

    try {
      setIsBulkPaying(true);
      const res = await fetch('/api/household/pay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          payAllPending: true,
          month,
          year,
        }),
      });

      const data = await res.json();
      if (data.success) {
        await fetchExpenses();
        await fetchAccounts();
      }
    } catch (err) {
      console.error('Erro ao liquidar todas as pendências:', err);
    } finally {
      setIsBulkPaying(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-500/20 text-blue-300 border border-blue-500/30 uppercase tracking-widest">
              {formatMonthYear(month, year)}
            </span>
            <span className="text-xs text-slate-400">Custos Residenciais</span>
          </div>
          <h2 className="text-2xl font-black text-white mt-1">Custos da Casa</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Gestão mensal de contas fixas com controle de liquidação e débito bancário
          </p>
        </div>

        <div className="flex items-center gap-3">
          {pendingCount > 0 && (
            <button
              onClick={handleBulkPay}
              disabled={isBulkPaying}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-300 text-xs font-bold transition-all cursor-pointer disabled:opacity-50 shadow-lg shadow-emerald-950/40"
            >
              <ZapIcon className="w-4 h-4 text-emerald-400" />
              <span>{isBulkPaying ? 'Baixando...' : `Liquidar Pendências (${formatCurrency(totalPending)})`}</span>
            </button>
          )}

          <button
            onClick={() => setIsNewExpenseOpen(true)}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-500/25 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Nova Despesa da Casa</span>
          </button>
        </div>
      </div>

      {/* Hero 3-Cards Status Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">
              Total Orçado do Mês
            </span>
            <h3 className="text-2xl font-black text-white mt-1">
              {formatCurrency(totalPlanned)}
            </h3>
            <span className="text-[11px] text-slate-400 mt-0.5 block">
              {houseExpenses.length} contas cadastradas
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
            <Home className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-emerald-950/20 border border-emerald-500/20 flex items-center justify-between">
          <div>
            <span className="text-xs text-emerald-400 font-bold uppercase tracking-wider">
              Já Debitado / Pago
            </span>
            <h3 className="text-2xl font-black text-emerald-400 mt-1">
              {formatCurrency(totalPaid)}
            </h3>
            <span className="text-[11px] text-emerald-300/70 mt-0.5 block">
              Baixa efetuada no saldo
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-amber-950/20 border border-amber-500/20 flex items-center justify-between">
          <div>
            <span className="text-xs text-amber-400 font-bold uppercase tracking-wider">
              Pendente de Baixa
            </span>
            <h3 className="text-2xl font-black text-amber-400 mt-1">
              {formatCurrency(totalPending)}
            </h3>
            <span className="text-[11px] text-amber-300/70 mt-0.5 block">
              {pendingCount} contas a debitar
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
            <Clock className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Expenses Breakdown Grid */}
      {loading ? (
        <Card className="py-8 text-center text-xs text-slate-400">
          Carregando custos da casa...
        </Card>
      ) : houseExpenses.length === 0 ? (
        <Card className="py-8 text-center text-xs text-slate-500">
          Nenhuma despesa de casa cadastrada. Clique em "Nova Despesa da Casa" para adicionar condomínio, aluguel, luz, etc.
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {houseExpenses.map((item) => {
            const IconComponent = (item.categoryIcon && iconMap[item.categoryIcon]) || Home;
            const color = item.categoryColor || '#3b82f6';
            const isPaid = item.status === 'PAID';

            return (
              <Card
                key={item.id}
                className={`flex flex-col justify-between p-5 transition-all ${
                  isPaid ? 'border-emerald-500/30 bg-slate-900/60' : 'border-slate-800 bg-slate-900/90'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                        style={{ backgroundColor: `${color}20`, color }}
                      >
                        <IconComponent className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white leading-tight">{item.name}</h4>
                        <span className="text-xs text-slate-400 block mt-0.5">
                          Vencimento dia {item.dayOfMonth || 5}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 opacity-70 hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleOpenEdit(item)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-blue-400 hover:bg-slate-800 transition-colors"
                        title="Editar"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteExpense(item.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                        title="Excluir"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 flex items-baseline justify-between">
                    <span className="text-xl font-black text-white font-mono">
                      {formatCurrency(item.amount)}
                    </span>
                    <span className="text-xs text-slate-400 font-medium">
                      {totalPlanned > 0 ? ((item.amount / totalPlanned) * 100).toFixed(1) : 0}% do total
                    </span>
                  </div>
                </div>

                {/* Status & Action Bar */}
                <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                  {isPaid ? (
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold">
                        <CheckCircle2 className="w-4 h-4 shrink-0" />
                        <span className="truncate">
                          Debitado {item.paidAccountName ? `(${item.paidAccountName})` : ''}
                        </span>
                      </div>

                      {item.paidTransactionId && (
                        <button
                          onClick={() => handleUnpay(item.paidTransactionId!)}
                          className="p-1 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-slate-800 transition-colors text-[11px] flex items-center gap-1 cursor-pointer"
                          title="Estornar baixa e reabrir pendência"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>Estornar</span>
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-1.5 text-xs text-amber-400 font-semibold">
                        <Clock className="w-4 h-4 shrink-0" />
                        <span>Pendente no mês</span>
                      </div>

                      <button
                        onClick={() => handleOpenPay(item)}
                        className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-600/20 transition-all cursor-pointer flex items-center gap-1"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Pagar / Baixar</span>
                      </button>
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* History Chart */}
      <Card className="h-80 flex flex-col justify-between">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h3 className="text-base font-bold text-white">Evolução dos Custos da Casa</h3>
            <p className="text-xs text-slate-400">Histórico de custos residenciais</p>
          </div>
        </div>

        <div className="flex-1 w-full min-h-0">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyHistory} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis dataKey="month" stroke="#64748b" fontSize={12} tickLine={false} />
              <YAxis
                stroke="#64748b"
                fontSize={11}
                tickLine={false}
                tickFormatter={(val) => `R$${val}`}
              />
              <Tooltip
                formatter={(val: any) => [formatCurrency(val), 'Custo da Casa']}
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }}
              />
              <Bar dataKey="amount" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={36} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Create Modal */}
      <Modal
        isOpen={isNewExpenseOpen}
        onClose={() => setIsNewExpenseOpen(false)}
        title="Nova Despesa da Casa"
        description="Adicione uma conta fixa ou custo residencial e debite da conta bancária."
      >
        <form onSubmit={handleAddExpense} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Nome da Despesa
            </label>
            <input
              type="text"
              required
              placeholder="Ex: Condomínio, Aluguel, Enel, Sanepar, Internet..."
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Valor Mensal (R$)
              </label>
              <input
                type="number"
                step="0.01"
                required
                placeholder="0,00"
                value={newAmount}
                onChange={(e) => setNewAmount(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-bold text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Dia de Vencimento
              </label>
              <input
                type="number"
                min="1"
                max="31"
                value={newDay}
                onChange={(e) => setNewDay(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Categoria Residencial
            </label>
            <select
              value={newCategoryId}
              onChange={(e) => setNewCategoryId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:border-blue-500 focus:outline-none"
            >
              {householdCategories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center justify-between">
              <span>Conta Bancária Principal</span>
              <span className="text-[10px] text-slate-400 font-normal">Para debitar saldo</span>
            </label>
            <select
              value={newAccountId}
              onChange={(e) => setNewAccountId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:border-blue-500 focus:outline-none"
            >
              <option value="">Não vincular conta agora</option>
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.name} (Saldo: {formatCurrency(acc.currentBalance)})
                </option>
              ))}
            </select>
          </div>

          {newAccountId && (
            <label className="flex items-center gap-2 p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl cursor-pointer">
              <input
                type="checkbox"
                checked={debitNow}
                onChange={(e) => setDebitNow(e.target.checked)}
                className="w-4 h-4 rounded text-blue-600 focus:ring-0 bg-slate-950 border-slate-700"
              />
              <span className="text-xs text-blue-200 font-medium">
                Debitar imediatamente o valor do saldo da conta no mês atual ({formatMonthYear(month, year)})
              </span>
            </label>
          )}

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsNewExpenseOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-500/25 cursor-pointer disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              <span>{isSaving ? 'Salvando...' : 'Salvar Despesa'}</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      {editingExpense && (
        <Modal
          isOpen={!!editingExpense}
          onClose={() => setEditingExpense(null)}
          title="Editar Despesa da Casa"
          description="Altere o nome, valor ou categoria da despesa residencial."
        >
          <form onSubmit={handleSaveEdit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Nome da Despesa
              </label>
              <input
                type="text"
                required
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Valor Mensal (R$)
              </label>
              <input
                type="number"
                step="0.01"
                required
                value={editAmount}
                onChange={(e) => setEditAmount(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-bold text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Categoria Residencial
              </label>
              <select
                value={editCategoryId}
                onChange={(e) => setEditCategoryId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:border-blue-500 focus:outline-none"
              >
                {householdCategories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setEditingExpense(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
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

      {/* Pay Modal */}
      {payingExpense && (
        <Modal
          isOpen={!!payingExpense}
          onClose={() => setPayingExpense(null)}
          title="Baixar Custo Residencial"
          description={`Liquidação de ${payingExpense.name} no mês de ${formatMonthYear(month, year)}.`}
        >
          <form onSubmit={handleConfirmPay} className="space-y-4">
            <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-2xl flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
              <div className="text-xs text-blue-300 leading-relaxed">
                Ao confirmar, o valor de <strong>{formatCurrency(payingExpense.amount)}</strong> será lançado como despesa do mês de {formatMonthYear(month, year)} e debitado imediatamente do saldo da conta bancária.
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Valor da Conta (R$)
              </label>
              <input
                type="text"
                disabled
                value={formatCurrency(payingExpense.amount)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-bold text-base cursor-not-allowed opacity-90"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Conta Bancária para Débito
              </label>
              <select
                value={payAccountId}
                onChange={(e) => setPayAccountId(e.target.value)}
                required
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:border-blue-500 focus:outline-none"
              >
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name} (Saldo: {formatCurrency(acc.currentBalance)})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Data do Pagamento
              </label>
              <input
                type="date"
                required
                value={payDate}
                onChange={(e) => setPayDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setPayingExpense(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isPaying || !payAccountId}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/25 cursor-pointer disabled:opacity-50"
              >
                <Check className="w-4 h-4" />
                <span>{isPaying ? 'Processando...' : 'Confirmar e Debitar Saldo'}</span>
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
