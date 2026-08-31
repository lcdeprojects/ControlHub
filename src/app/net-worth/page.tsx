'use client';

import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { formatCurrency } from '@/lib/utils';
import {
  TrendingUp,
  ShieldAlert,
  Sparkles,
  Plus,
  Pencil,
  Trash2,
  Check,
} from 'lucide-react';
import { usePeriod } from '@/contexts/PeriodContext';

export default function NetWorthPage() {
  const { month, year } = usePeriod();
  const [investments, setInvestments] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // New Asset Modal
  const [isNewAssetOpen, setIsNewAssetOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState('CDB');
  const [newInvested, setNewInvested] = useState('');
  const [newCurrent, setNewCurrent] = useState('');
  const [newInst, setNewInst] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Edit Asset Modal
  const [editingAsset, setEditingAsset] = useState<any | null>(null);
  const [editName, setEditName] = useState('');
  const [editType, setEditType] = useState('CDB');
  const [editInvested, setEditInvested] = useState('');
  const [editCurrent, setEditCurrent] = useState('');
  const [editInst, setEditInst] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [invRes, accRes, statsRes] = await Promise.all([
        fetch('/api/investments'),
        fetch('/api/accounts'),
        fetch(`/api/stats?month=${month}&year=${year}`),
      ]);
      const invData = await invRes.json();
      const accData = await accRes.json();
      const statsData = await statsRes.json();

      if (invData.success) setInvestments(invData.investments);
      if (accData.success) setAccounts(accData.accounts);
      if (statsData.success) setStats(statsData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [month, year]);

  const totalBankBalance = accounts.reduce((acc, curr) => acc + (curr.currentBalance || 0), 0);
  const totalInvestments = investments.reduce((acc, curr) => acc + (curr.currentValue || 0), 0);
  const totalGrossAssets = totalBankBalance + totalInvestments;

  const currentInvoices = stats?.currentInvoicesTotal || 0;
  const futureInstallments = stats?.futureInstallmentsTotal || 0;
  const totalLiabilities = currentInvoices + futureInstallments;
  const netWorth = totalGrossAssets - totalLiabilities;

  const liabilitiesList = [
    { name: 'Faturas de Cartão no Mês', type: 'Curto Prazo', value: currentInvoices },
    { name: 'Saldo Restante de Parcelamentos Futuros', type: 'Médio Prazo', value: futureInstallments },
  ];

  const handleCreateAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newCurrent) return;

    setIsSaving(true);
    try {
      const res = await fetch('/api/investments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newName,
          type: newType,
          investedAmount: parseFloat(newInvested.replace(',', '.') || newCurrent),
          currentValue: parseFloat(newCurrent.replace(',', '.')),
          institution: newInst || 'Próprio',
        }),
      });

      if (res.ok) {
        setIsNewAssetOpen(false);
        setNewName('');
        setNewInvested('');
        setNewCurrent('');
        setNewInst('');
        await fetchData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpenEdit = (item: any) => {
    setEditingAsset(item);
    setEditName(item.name);
    setEditType(item.type);
    setEditInvested(item.investedAmount.toString());
    setEditCurrent(item.currentValue.toString());
    setEditInst(item.institution || '');
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAsset) return;

    setIsSaving(true);
    try {
      const res = await fetch(`/api/investments/${editingAsset.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editName,
          type: editType,
          investedAmount: parseFloat(editInvested.replace(',', '.')),
          currentValue: parseFloat(editCurrent.replace(',', '.')),
          institution: editInst,
        }),
      });

      if (res.ok) {
        setEditingAsset(null);
        await fetchData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAsset = async (id: string) => {
    if (!confirm('Deseja realmente remover este ativo/investimento?')) return;

    try {
      const res = await fetch(`/api/investments/${id}`, { method: 'DELETE' });
      if (res.ok) {
        await fetchData();
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
          <h2 className="text-2xl font-black text-white">Patrimônio & Investimentos</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Cadastre, edite ou exclua ativos, imóveis e posições para cálculo do patrimônio líquido real
          </p>
        </div>
        <button
          onClick={() => setIsNewAssetOpen(true)}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-500/25 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Novo Ativo / Investimento</span>
        </button>
      </div>

      {/* Hero Net Worth Card */}
      <div className="p-8 rounded-3xl bg-gradient-to-tr from-blue-950 via-slate-900 to-indigo-950 border border-blue-500/30 shadow-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-blue-400" />
            <span className="text-xs font-bold text-blue-300 uppercase tracking-widest">
              Patrimônio Líquido Consolidado
            </span>
          </div>
          <h3 className="text-4xl font-black text-white mt-2">
            {formatCurrency(netWorth)}
          </h3>
          <p className="text-xs text-emerald-400 mt-1">
            ↑ Atualizado em tempo real com base nos seus ativos e obrigações
          </p>
        </div>

        <div className="flex gap-6 pt-4 sm:pt-0 sm:border-l border-slate-800/80 sm:pl-6 text-xs">
          <div>
            <span className="text-slate-400">Ativos Brutos</span>
            <p className="text-xl font-bold text-emerald-400 mt-0.5">
              {formatCurrency(totalGrossAssets)}
            </p>
          </div>
          <div>
            <span className="text-slate-400">Obrigações & Faturas</span>
            <p className="text-xl font-bold text-rose-400 mt-0.5">
              {formatCurrency(totalLiabilities)}
            </p>
          </div>
        </div>
      </div>

      {/* Assets List */}
      <div id="investimentos" className="space-y-3">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-emerald-400" />
          <span>Ativos & Posições de Investimento</span>
        </h3>
        <Card className="p-0 overflow-hidden">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
                <th className="py-3 px-4">Ativo / Bem</th>
                <th className="py-3 px-4">Classe</th>
                <th className="py-3 px-4">Instituição</th>
                <th className="py-3 px-4 text-right">Valor Atual</th>
                <th className="py-3 px-4 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {investments.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500">
                    Nenhum investimento ou ativo cadastrado.
                  </td>
                </tr>
              ) : (
                investments.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-800/20 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-white">{item.name}</td>
                    <td className="py-3.5 px-4 text-slate-300">{item.type}</td>
                    <td className="py-3.5 px-4 text-slate-400 font-medium">
                      {item.institution || 'Próprio'}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-100">
                      {formatCurrency(item.currentValue)}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(item)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-blue-400 hover:bg-slate-800 cursor-pointer"
                          title="Editar"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteAsset(item.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 cursor-pointer"
                          title="Excluir"
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
        </Card>
      </div>

      {/* Liabilities List */}
      <div className="space-y-3">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-rose-400" />
          <span>Obrigações, Faturas & Parcelamentos Futuros</span>
        </h3>
        <Card className="p-0 overflow-hidden">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
                <th className="py-3 px-4">Obrigação</th>
                <th className="py-3 px-4">Prazo</th>
                <th className="py-3 px-4 text-right">Saldo Devedor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {liabilitiesList.map((item) => (
                <tr key={item.name} className="hover:bg-slate-800/20 transition-colors">
                  <td className="py-3.5 px-4 font-medium text-white">{item.name}</td>
                  <td className="py-3.5 px-4 text-slate-400">{item.type}</td>
                  <td className="py-3.5 px-4 text-right font-mono font-bold text-rose-400">
                    - {formatCurrency(item.value)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>

      {/* Create Asset Modal */}
      <Modal
        isOpen={isNewAssetOpen}
        onClose={() => setIsNewAssetOpen(false)}
        title="Novo Ativo ou Investimento"
        description="Cadastre um ativo financeiro, imóvel, veículo ou reserva."
      >
        <form onSubmit={handleCreateAsset} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Nome do Ativo
            </label>
            <input
              type="text"
              required
              placeholder="Ex: Tesouro Selic 2029, Imóvel Praia..."
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Tipo / Classe
              </label>
              <select
                value={newType}
                onChange={(e) => setNewType(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:border-blue-500 focus:outline-none"
              >
                <option value="CDB">CDB / Renda Fixa</option>
                <option value="TREASURY">Tesouro Direto</option>
                <option value="FUNDS">Fundos Imobiliários / Ações</option>
                <option value="REAL_ESTATE">Imóvel</option>
                <option value="VEHICLE">Veículo</option>
                <option value="CRYPTO">Criptomoedas</option>
                <option value="OTHER">Outros Bens</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Instituição / Custodiante
              </label>
              <input
                type="text"
                placeholder="Ex: BTG Pactual, XP, Próprio..."
                value={newInst}
                onChange={(e) => setNewInst(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Valor Investido (R$)
              </label>
              <input
                type="number"
                step="0.01"
                placeholder="0,00"
                value={newInvested}
                onChange={(e) => setNewInvested(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Valor Atual de Mercado (R$)
              </label>
              <input
                type="number"
                step="0.01"
                required
                placeholder="0,00"
                value={newCurrent}
                onChange={(e) => setNewCurrent(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-bold text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsNewAssetOpen(false)}
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
              <span>Salvar Ativo</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Asset Modal */}
      {editingAsset && (
        <Modal
          isOpen={!!editingAsset}
          onClose={() => setEditingAsset(null)}
          title="Editar Ativo / Posição"
          description="Atualize a cotação ou valores patrimoniais."
        >
          <form onSubmit={handleSaveEdit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Nome do Ativo
              </label>
              <input
                type="text"
                required
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Tipo / Classe
                </label>
                <select
                  value={editType}
                  onChange={(e) => setEditType(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:border-blue-500 focus:outline-none"
                >
                  <option value="CDB">CDB / Renda Fixa</option>
                  <option value="TREASURY">Tesouro Direto</option>
                  <option value="FUNDS">Fundos Imobiliários / Ações</option>
                  <option value="REAL_ESTATE">Imóvel</option>
                  <option value="VEHICLE">Veículo</option>
                  <option value="CRYPTO">Criptomoedas</option>
                  <option value="OTHER">Outros Bens</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Instituição
                </label>
                <input
                  type="text"
                  value={editInst}
                  onChange={(e) => setEditInst(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Valor Investido (R$)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={editInvested}
                  onChange={(e) => setEditInvested(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Valor Atual (R$)
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={editCurrent}
                  onChange={(e) => setEditCurrent(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-bold text-sm focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setEditingAsset(null)}
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
                <span>Salvar Alterações</span>
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
