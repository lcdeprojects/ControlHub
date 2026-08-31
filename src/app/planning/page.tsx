'use client';

import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { formatCurrency } from '@/lib/utils';
import { Target, Plus, Pencil, Trash2, Check } from 'lucide-react';
import { usePeriod } from '@/contexts/PeriodContext';

export default function PlanningPage() {
  const { month, year } = usePeriod();
  const [budgets, setBudgets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [isNewBudgetOpen, setIsNewBudgetOpen] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const [newLimit, setNewLimit] = useState('');

  const [editingBudget, setEditingBudget] = useState<any | null>(null);
  const [editLimit, setEditLimit] = useState('');

  const fetchBudgets = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/budgets');
      const data = await res.json();
      if (data.success) {
        setBudgets(data.budgets || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBudgets();
  }, [month, year]);

  const totalBudget = budgets.reduce((acc, curr) => acc + (curr.limitAmount || curr.limit || 0), 0);
  const totalSpent = budgets.reduce((acc, curr) => acc + (curr.spent || 0), 0);
  const totalRemaining = totalBudget - totalSpent;

  const handleAddBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategory || !newLimit) return;

    try {
      const res = await fetch('/api/budgets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          categoryId: 'cat_mercado',
          limitAmount: parseFloat(newLimit.replace(',', '.')),
          month,
          year,
        }),
      });

      if (res.ok) {
        setIsNewBudgetOpen(false);
        setNewCategory('');
        setNewLimit('');
        await fetchBudgets();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenEdit = (b: any) => {
    setEditingBudget(b);
    setEditLimit((b.limitAmount || b.limit || 0).toString());
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBudget) return;

    try {
      const res = await fetch(`/api/budgets/${editingBudget.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          limitAmount: parseFloat(editLimit.replace(',', '.')),
        }),
      });

      if (res.ok) {
        setEditingBudget(null);
        await fetchBudgets();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteBudget = async (id: string) => {
    if (!confirm('Deseja remover este orçamento de categoria?')) return;
    try {
      const res = await fetch(`/api/budgets/${id}`, { method: 'DELETE' });
      if (res.ok) {
        await fetchBudgets();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white">Planejamento & Orçamento Mensal</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Defina, edite ou exclua tetos por categoria e acompanhe alertas em 70%, 90% e 100%
          </p>
        </div>
        <button
          onClick={() => setIsNewBudgetOpen(true)}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-500/25 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Definir Novo Teto</span>
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="flex flex-col justify-between">
          <span className="text-xs font-semibold text-slate-400 uppercase">Teto Orçamentário</span>
          <h3 className="text-2xl font-black text-white mt-2">
            {formatCurrency(totalBudget)}
          </h3>
          <p className="text-xs text-slate-400 mt-1">Limite planejado no mês</p>
        </Card>

        <Card className="flex flex-col justify-between">
          <span className="text-xs font-semibold text-slate-400 uppercase">Total Consumido</span>
          <h3 className="text-2xl font-black text-rose-400 mt-2">
            {formatCurrency(totalSpent)}
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            {totalBudget > 0 ? ((totalSpent / totalBudget) * 100).toFixed(1) : 0}% do orçamento total
          </p>
        </Card>

        <Card className="flex flex-col justify-between">
          <span className="text-xs font-semibold text-slate-400 uppercase">Saldo Disponível</span>
          <h3 className="text-2xl font-black text-emerald-400 mt-2">
            {formatCurrency(totalRemaining)}
          </h3>
          <p className="text-xs text-slate-400 mt-1">Margem segura restante</p>
        </Card>
      </div>

      {/* Categories Budgets List */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-white">Limites por Categoria</h3>
        {budgets.length === 0 ? (
          <Card className="py-8 text-center text-xs text-slate-500">
            Nenhum teto de categoria cadastrado. Clique em "Definir Novo Teto" para começar o planejamento.
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {budgets.map((b) => {
              const limit = b.limitAmount || b.limit || 1;
              const spent = b.spent || 0;
              const percent = (spent / limit) * 100;
              const remaining = limit - spent;

              let badgeVariant: 'success' | 'warning' | 'danger' = 'success';
              let alertText = 'Dentro do planejado';

              if (percent >= 100) {
                badgeVariant = 'danger';
                alertText = `Excedido em ${(percent - 100).toFixed(0)}%`;
              } else if (percent >= 90) {
                badgeVariant = 'danger';
                alertText = 'Alerta Crítico (90%+)';
              } else if (percent >= 70) {
                badgeVariant = 'warning';
                alertText = 'Atenção (70%+)';
              }

              return (
                <Card key={b.id} className="space-y-3 relative group">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-white">{b.categoryName || 'Categoria'}</h4>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Limite: <strong>{formatCurrency(limit)}</strong>
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={badgeVariant}>{alertText}</Badge>
                      <div className="flex items-center opacity-70 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleOpenEdit(b)}
                          className="p-1 rounded text-slate-400 hover:text-blue-400 cursor-pointer"
                          title="Editar Limite"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteBudget(b.id)}
                          className="p-1 rounded text-slate-400 hover:text-rose-400 cursor-pointer"
                          title="Excluir Limite"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <ProgressBar
                      value={percent}
                      indicatorClassName={
                        percent >= 100
                          ? 'bg-rose-500'
                          : percent >= 90
                          ? 'bg-amber-500'
                          : percent >= 70
                          ? 'bg-amber-400'
                          : 'bg-emerald-500'
                      }
                    />
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-300">
                        Gasto: <strong>{formatCurrency(spent)}</strong> ({percent.toFixed(0)}%)
                      </span>
                      <span className={remaining >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                        {remaining >= 0 ? 'Resta: ' : 'Estourado: '}
                        <strong>{formatCurrency(Math.abs(remaining))}</strong>
                      </span>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Budget Modal */}
      <Modal
        isOpen={isNewBudgetOpen}
        onClose={() => setIsNewBudgetOpen(false)}
        title="Definir Limite de Categoria"
        description="Configure um teto máximo de gastos para o mês."
      >
        <form onSubmit={handleAddBudget} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Categoria
            </label>
            <select
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:border-blue-500 focus:outline-none"
            >
              <option value="cat_mercado">Mercado</option>
              <option value="cat_restaurantes">Restaurantes</option>
              <option value="cat_moradia">Moradia</option>
              <option value="cat_transporte">Transporte</option>
              <option value="cat_lazer">Lazer & Viagens</option>
              <option value="cat_compras">Compras</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Limite Orçamentário (R$)
            </label>
            <input
              type="number"
              step="0.01"
              required
              placeholder="1000,00"
              value={newLimit}
              onChange={(e) => setNewLimit(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-bold text-sm focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsNewBudgetOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-500/25 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Salvar Limite</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Budget Modal */}
      {editingBudget && (
        <Modal
          isOpen={!!editingBudget}
          onClose={() => setEditingBudget(null)}
          title={`Editar Teto: ${editingBudget.categoryName || 'Categoria'}`}
          description="Altere o limite estipulado para esta categoria."
        >
          <form onSubmit={handleSaveEdit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Novo Limite (R$)
              </label>
              <input
                type="number"
                step="0.01"
                required
                value={editLimit}
                onChange={(e) => setEditLimit(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-bold text-base focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setEditingBudget(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-500/25 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Salvar Alterações</span>
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
