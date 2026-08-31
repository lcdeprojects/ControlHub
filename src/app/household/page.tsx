'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { formatCurrency, formatMonthYear } from '@/lib/utils';
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
} from 'lucide-react';
import { usePeriod } from '@/contexts/PeriodContext';

interface HouseExpense {
  id: string;
  name: string;
  amount: number;
  dayOfMonth?: number;
  accountId?: string;
  categoryId?: string;
  categoryName?: string;
  categoryIcon?: string;
  categoryColor?: string;
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
  const [loading, setLoading] = useState(true);

  // Modal States
  const [isNewExpenseOpen, setIsNewExpenseOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [newDay, setNewDay] = useState('5');
  const [newCategoryId, setNewCategoryId] = useState('cat_moradia');
  const [newAccountId, setNewAccountId] = useState('');
  const [debitNow, setDebitNow] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [editingExpense, setEditingExpense] = useState<HouseExpense | null>(null);
  const [editName, setEditName] = useState('');
  const [editAmount, setEditAmount] = useState('');
  const [editCategoryId, setEditCategoryId] = useState('cat_moradia');

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/household?month=${month}&year=${year}`);
      const data = await res.json();
      if (data.success) {
        setHouseExpenses(data.expenses || []);
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

  const totalHouseMonth = houseExpenses.reduce((acc, curr) => acc + (curr.amount || 0), 0);

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
    if (!confirm('Deseja realmente remover esta despesa da casa?')) return;

    try {
      const res = await fetch(`/api/household/${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        await fetchExpenses();
      }
    } catch (err) {
      console.error('Erro ao excluir custo da casa:', err);
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
            Controle contas fixas, debite do saldo bancário e acompanhe a evolução histórica
          </p>
        </div>
        <button
          onClick={() => setIsNewExpenseOpen(true)}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-500/25 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Nova Despesa da Casa</span>
        </button>
      </div>

      {/* Hero Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-blue-950/40 to-slate-900 border border-blue-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
            <Home className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">
              Total Mensal da Casa ({formatMonthYear(month, year)})
            </span>
            <h3 className="text-3xl font-black text-white mt-0.5">
              {formatCurrency(totalHouseMonth)}
            </h3>
          </div>
        </div>
        <div className="text-sm text-slate-300">
          Contas cadastradas: <strong>{houseExpenses.length}</strong>
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

            return (
              <Card key={item.id} className="flex items-center justify-between group relative">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: `${color}20`, color }}
                  >
                    <IconComponent className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">{item.name}</h4>
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <span>Vencimento dia {item.dayOfMonth || 5}</span>
                      <span>•</span>
                      <span>
                        {totalHouseMonth > 0
                          ? ((item.amount / totalHouseMonth) * 100).toFixed(1)
                          : 0}
                        %
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-base font-black text-white font-mono">
                    {formatCurrency(item.amount)}
                  </span>
                  <div className="flex items-center opacity-70 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleOpenEdit(item)}
                      className="p-1 rounded text-slate-400 hover:text-blue-400 cursor-pointer"
                      title="Editar"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteExpense(item.id)}
                      className="p-1 rounded text-slate-400 hover:text-rose-400 cursor-pointer"
                      title="Excluir"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
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
              <span>Conta Bancária de Saída</span>
              <span className="text-[10px] text-slate-400 font-normal">Para debitar saldo</span>
            </label>
            <select
              value={newAccountId}
              onChange={(e) => setNewAccountId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:border-blue-500 focus:outline-none"
            >
              <option value="">Não debitar de conta agora (Apenas fixar custo)</option>
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
    </div>
  );
}
