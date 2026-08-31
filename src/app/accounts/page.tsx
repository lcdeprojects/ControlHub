'use client';

import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { formatCurrency } from '@/lib/utils';
import {
  Landmark,
  ArrowLeftRight,
  Plus,
  Pencil,
  Trash2,
  ShieldCheck,
  Check,
} from 'lucide-react';

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // New Account Modal
  const [isNewAccountOpen, setIsNewAccountOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState('CHECKING');
  const [newBank, setNewBank] = useState('');
  const [newInitialBalance, setNewInitialBalance] = useState('');
  const [newColor, setNewColor] = useState('#3b82f6');

  // Edit Account Modal
  const [editingAccount, setEditingAccount] = useState<any | null>(null);
  const [editName, setEditName] = useState('');
  const [editType, setEditType] = useState('CHECKING');
  const [editBank, setEditBank] = useState('');
  const [editBalance, setEditBalance] = useState('');
  const [editColor, setEditColor] = useState('#3b82f6');

  // Transfer Modal
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [sourceAcc, setSourceAcc] = useState('');
  const [destAcc, setDestAcc] = useState('');
  const [transferAmount, setTransferAmount] = useState('');
  const [transferDate, setTransferDate] = useState(new Date().toISOString().slice(0, 10));
  const [isSaving, setIsSaving] = useState(false);

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/accounts');
      const data = await res.json();
      if (data.success) {
        setAccounts(data.accounts);
        if (data.accounts.length > 0) {
          setSourceAcc(data.accounts[0].id);
          setDestAcc(data.accounts[1]?.id || data.accounts[0].id);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const totalBalance = accounts.reduce((acc, a) => acc + (a.currentBalance || 0), 0);

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName) return;

    setIsSaving(true);
    try {
      const res = await fetch('/api/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newName,
          type: newType,
          bankName: newBank || newName,
          initialBalance: parseFloat(newInitialBalance.replace(',', '.') || '0'),
          color: newColor,
        }),
      });

      if (res.ok) {
        setIsNewAccountOpen(false);
        setNewName('');
        setNewBank('');
        setNewInitialBalance('');
        await fetchAccounts();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpenEdit = (acc: any) => {
    setEditingAccount(acc);
    setEditName(acc.name);
    setEditType(acc.type);
    setEditBank(acc.bankName || acc.name);
    setEditBalance((acc.currentBalance || 0).toString());
    setEditColor(acc.color || '#3b82f6');
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAccount) return;

    setIsSaving(true);
    try {
      const res = await fetch(`/api/accounts/${editingAccount.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editName,
          type: editType,
          bankName: editBank,
          currentBalance: parseFloat(editBalance.replace(',', '.')),
          color: editColor,
        }),
      });

      if (res.ok) {
        setEditingAccount(null);
        await fetchAccounts();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAccount = async (id: string) => {
    if (!confirm('Deseja realmente remover esta conta?')) return;

    try {
      const res = await fetch(`/api/accounts/${id}`, { method: 'DELETE' });
      if (res.ok) {
        await fetchAccounts();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferAmount || sourceAcc === destAcc) return;

    setIsSaving(true);
    try {
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'TRANSFER',
          description: `Transferência entre contas`,
          amount: parseFloat(transferAmount.replace(',', '.')),
          transactionDate: transferDate,
          paymentMethod: 'TRANSFER',
          accountId: sourceAcc,
        }),
      });

      if (res.ok) {
        setIsTransferOpen(false);
        setTransferAmount('');
        await fetchAccounts();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white">Minhas Contas Bancárias</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Cadastre, edite ou exclua contas com controle consolidado e transferências seguras
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsTransferOpen(true)}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-all cursor-pointer"
          >
            <ArrowLeftRight className="w-4 h-4" />
            <span>Transferir</span>
          </button>
          <button
            onClick={() => setIsNewAccountOpen(true)}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-500/25 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Nova Conta</span>
          </button>
        </div>
      </div>

      {/* Total Consolidated Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950/40 to-blue-950/40 border border-slate-800 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Saldo Consolidado em Contas
          </span>
          <h3 className="text-3xl font-black text-white mt-1">
            {formatCurrency(totalBalance)}
          </h3>
          <p className="text-xs text-emerald-400 mt-1 font-medium">
            ● {accounts.length} contas sincronizadas
          </p>
        </div>
      </div>

      {/* Accounts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {accounts.map((acc) => (
          <Card key={acc.id} className="flex flex-col justify-between space-y-4 relative group">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-md"
                  style={{ backgroundColor: acc.color || '#3b82f6' }}
                >
                  <Landmark className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-white">{acc.name}</h4>
                  <p className="text-xs text-slate-400">
                    {acc.type === 'CHECKING'
                      ? 'Conta Corrente'
                      : acc.type === 'SAVINGS'
                      ? 'Poupança'
                      : acc.type === 'INVESTMENT'
                      ? 'Investimentos'
                      : 'Carteira'}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => handleOpenEdit(acc)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-blue-400 hover:bg-slate-800 transition-colors cursor-pointer"
                  title="Editar Conta"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleDeleteAccount(acc.id)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors cursor-pointer"
                  title="Excluir Conta"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-400">Saldo Atual</span>
                <p className="text-2xl font-black text-white mt-0.5">
                  {formatCurrency(acc.currentBalance || 0)}
                </p>
              </div>
              <Badge variant="blue">{acc.bankName || 'Banco'}</Badge>
            </div>
          </Card>
        ))}
      </div>

      {/* Create Account Modal */}
      <Modal
        isOpen={isNewAccountOpen}
        onClose={() => setIsNewAccountOpen(false)}
        title="Cadastrar Nova Conta"
        description="Adicione uma conta corrente, poupança, carteira ou conta de investimentos."
      >
        <form onSubmit={handleCreateAccount} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Nome da Conta
            </label>
            <input
              type="text"
              required
              placeholder="Ex: Santander Select, Nubank, Itaú..."
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Tipo de Conta
              </label>
              <select
                value={newType}
                onChange={(e) => setNewType(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:border-blue-500 focus:outline-none"
              >
                <option value="CHECKING">Conta Corrente</option>
                <option value="SAVINGS">Poupança</option>
                <option value="INVESTMENT">Investimentos</option>
                <option value="WALLET">Carteira / Dinheiro</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Instituição / Banco
              </label>
              <input
                type="text"
                placeholder="Ex: Nubank, Itaú, Bradesco..."
                value={newBank}
                onChange={(e) => setNewBank(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Saldo Inicial (R$)
              </label>
              <input
                type="number"
                step="0.01"
                placeholder="0,00"
                value={newInitialBalance}
                onChange={(e) => setNewInitialBalance(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-bold text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Cor de Identificação
              </label>
              <div className="flex items-center gap-2 mt-1">
                {['#3b82f6', '#820ad1', '#ec7000', '#10b981', '#0b1d3a', '#ef4444'].map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setNewColor(color)}
                    className={`w-6 h-6 rounded-full border-2 transition-transform cursor-pointer ${
                      newColor === color ? 'border-white scale-110 shadow-lg' : 'border-transparent'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsNewAccountOpen(false)}
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
              <span>Salvar Conta</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Account Modal */}
      {editingAccount && (
        <Modal
          isOpen={!!editingAccount}
          onClose={() => setEditingAccount(null)}
          title="Editar Conta Bancária"
          description="Atualize as informações ou saldo da conta."
        >
          <form onSubmit={handleSaveEdit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Nome da Conta
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
                  Tipo de Conta
                </label>
                <select
                  value={editType}
                  onChange={(e) => setEditType(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:border-blue-500 focus:outline-none"
                >
                  <option value="CHECKING">Conta Corrente</option>
                  <option value="SAVINGS">Poupança</option>
                  <option value="INVESTMENT">Investimentos</option>
                  <option value="WALLET">Carteira / Dinheiro</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Instituição / Banco
                </label>
                <input
                  type="text"
                  value={editBank}
                  onChange={(e) => setEditBank(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Saldo Atual (R$)
              </label>
              <input
                type="number"
                step="0.01"
                required
                value={editBalance}
                onChange={(e) => setEditBalance(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-bold text-base focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setEditingAccount(null)}
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

      {/* Transfer Modal */}
      <Modal
        isOpen={isTransferOpen}
        onClose={() => setIsTransferOpen(false)}
        title="Transferência entre Contas Próprias"
        description="Mova recursos entre suas contas com neutralidade fiscal e contábil"
      >
        <form onSubmit={handleTransfer} className="space-y-4">
          <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-xl flex items-start gap-3 text-xs text-purple-300">
            <ShieldCheck className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
            <span>
              <strong>Regra de Integridade:</strong> Transferências entre contas próprias nunca são tratadas como receitas ou despesas, mantendo a precisão exata do seu fluxo.
            </span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Valor da Transferência (R$)
            </label>
            <input
              type="number"
              step="0.01"
              required
              placeholder="0,00"
              value={transferAmount}
              onChange={(e) => setTransferAmount(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-bold text-lg focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Conta de Origem (Débito)
              </label>
              <select
                value={sourceAcc}
                onChange={(e) => setSourceAcc(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:border-blue-500 focus:outline-none"
              >
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({formatCurrency(a.currentBalance || 0)})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Conta de Destino (Crédito)
              </label>
              <select
                value={destAcc}
                onChange={(e) => setDestAcc(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:border-blue-500 focus:outline-none"
              >
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({formatCurrency(a.currentBalance || 0)})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Data da Movimentação
            </label>
            <input
              type="date"
              required
              value={transferDate}
              onChange={(e) => setTransferDate(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsTransferOpen(false)}
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
              <span>Confirmar Transferência</span>
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
