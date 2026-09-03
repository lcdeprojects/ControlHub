'use client';

import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { formatCurrency } from '@/lib/utils';
import {
  Film,
  Plus,
  Zap,
  Check,
  Pause,
  Play,
  Trash2,
  Pencil,
  Calendar,
  TrendingUp,
  Sparkles,
  Wallet,
  CreditCard,
} from 'lucide-react';

const PRESETS = [
  { name: 'Netflix', color: '#e50914', defaultAmount: 55.9, currency: 'BRL' },
  { name: 'Claude Pro (Anthropic)', color: '#d97706', defaultAmount: 20, currency: 'USD' },
  { name: 'ChatGPT Plus (OpenAI)', color: '#10b981', defaultAmount: 20, currency: 'USD' },
  { name: 'Spotify Premium', color: '#1db954', defaultAmount: 21.9, currency: 'BRL' },
  { name: 'Amazon Prime', color: '#00a8e1', defaultAmount: 19.9, currency: 'BRL' },
  { name: 'YouTube Premium', color: '#ff0000', defaultAmount: 24.9, currency: 'BRL' },
  { name: 'iCloud Storage', color: '#3b82f6', defaultAmount: 14.9, currency: 'BRL' },
];

export default function SubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [creditCards, setCreditCards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [editingSub, setEditingSub] = useState<any | null>(null);
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState<'BRL' | 'USD'>('BRL');
  const [billingCycle, setBillingCycle] = useState<'MONTHLY' | 'YEARLY'>('MONTHLY');
  const [billingDay, setBillingDay] = useState('5');
  const [color, setColor] = useState('#e50914');
  const [accountId, setAccountId] = useState('');
  const [creditCardId, setCreditCardId] = useState('');
  const [autoDebitCurrentMonth, setAutoDebitCurrentMonth] = useState(true);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [debitingId, setDebitingId] = useState<string | null>(null);

  const usdRate = 5.6;

  const fetchData = async () => {
    try {
      setLoading(true);
      const [resSub, resAcc, resCard] = await Promise.all([
        fetch('/api/subscriptions').then((r) => r.json()),
        fetch('/api/accounts').then((r) => r.json()).catch(() => null),
        fetch('/api/cards').then((r) => r.json()).catch(() => null),
      ]);

      if (resSub.success) {
        setSubscriptions(resSub.subscriptions || []);
      }
      if (resAcc?.success) {
        setAccounts(resAcc.accounts || []);
      }
      if (resCard?.success) {
        setCreditCards(resCard.cards || []);
      }
    } catch (err) {
      console.error('Error loading subscriptions page:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenCreate = (preset?: any) => {
    setEditingSub(null);
    if (preset) {
      setName(preset.name);
      setAmount(preset.defaultAmount.toString());
      setCurrency(preset.currency);
      setColor(preset.color);
    } else {
      setName('');
      setAmount('');
      setCurrency('BRL');
      setColor('#e50914');
    }
    setBillingCycle('MONTHLY');
    setBillingDay('5');
    setAccountId(accounts.length > 0 ? accounts[0].id : '');
    setCreditCardId('');
    setAutoDebitCurrentMonth(true);
    setNotes('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (sub: any) => {
    setEditingSub(sub);
    setName(sub.name);
    setAmount(sub.amount.toString());
    setCurrency(sub.currency || 'BRL');
    setBillingCycle(sub.billingCycle || 'MONTHLY');
    setBillingDay(sub.billingDay ? sub.billingDay.toString() : '5');
    setColor(sub.color || '#e50914');
    setAccountId(sub.accountId || '');
    setCreditCardId(sub.creditCardId || '');
    setAutoDebitCurrentMonth(false);
    setNotes(sub.notes || '');
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !amount) return;

    setSubmitting(true);
    try {
      const numAmount = parseFloat(amount.toString().replace(',', '.'));
      const body = {
        name,
        amount: numAmount,
        currency,
        billingCycle,
        billingDay: parseInt(billingDay, 10),
        color,
        accountId: accountId || null,
        creditCardId: creditCardId || null,
        autoDebitCurrentMonth,
        notes,
      };

      const url = editingSub ? `/api/subscriptions/${editingSub.id}` : '/api/subscriptions';
      const method = editingSub ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        setIsModalOpen(false);
        await fetchData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDebitNow = async (sub: any) => {
    setDebitingId(sub.id);
    try {
      const res = await fetch(`/api/subscriptions/${sub.id}/debit`, { method: 'POST' });
      const data = await res.json();
      if (res.ok && data.success) {
        alert(`🎉 ${data.message}`);
        await fetchData();
      } else {
        alert(data.error || 'Erro ao lançar cobrança.');
      }
    } catch (err) {
      console.error(err);
      alert('Falha de conexão.');
    } finally {
      setDebitingId(null);
    }
  };

  const handleToggleStatus = async (sub: any) => {
    const newStatus = sub.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
    try {
      const res = await fetch(`/api/subscriptions/${sub.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) await fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja excluir esta assinatura?')) return;
    try {
      const res = await fetch(`/api/subscriptions/${id}`, { method: 'DELETE' });
      if (res.ok) await fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  // Resumos e Débitos
  const activeSubs = subscriptions.filter((s) => s.status === 'ACTIVE');
  const monthlyTotalBrl = activeSubs.reduce((sum, s) => {
    let val = s.amount;
    if (s.currency === 'USD') val = val * usdRate;
    if (s.billingCycle === 'YEARLY') val = val / 12;
    return sum + val;
  }, 0);

  const yearlyTotalBrl = monthlyTotalBrl * 12;

  const filtered = subscriptions.filter((s) => {
    if (statusFilter === 'ACTIVE') return s.status === 'ACTIVE';
    if (statusFilter === 'PAUSED') return s.status === 'PAUSED';
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white flex items-center gap-2">
            <Film className="w-6 h-6 text-rose-500" />
            Assinaturas & Recorrências
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Cadastre seus serviços recorrentes com débito automático no extrato do mês
          </p>
        </div>

        <button
          onClick={() => handleOpenCreate()}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-lg shadow-rose-500/25 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Nova Assinatura</span>
        </button>
      </div>

      {/* Preset Fast-Add Chips Bar */}
      <Card className="p-4 bg-slate-900/80 border-slate-800">
        <div className="flex items-center justify-between gap-2 mb-2.5">
          <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            Criar Rápido via Modelo:
          </span>
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          {PRESETS.map((preset) => (
            <button
              key={preset.name}
              onClick={() => handleOpenCreate(preset)}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 transition-all cursor-pointer shrink-0 text-left"
            >
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: preset.color }}
              />
              <span className="text-xs font-bold text-white">{preset.name}</span>
              <span className="text-[10px] text-slate-400 font-mono">
                {preset.currency === 'USD' ? '$' : 'R$'} {preset.defaultAmount}
              </span>
            </button>
          ))}
        </div>
      </Card>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 bg-slate-900/60 border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
              Débito Estimado por Mês
            </span>
            <h3 className="text-xl font-black text-rose-400 mt-1">
              {formatCurrency(monthlyTotalBrl)}
            </h3>
            <span className="text-[10px] text-slate-500 block mt-0.5">
              Descontado no extrato mensal
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center">
            <Zap className="w-5 h-5" />
          </div>
        </Card>

        <Card className="p-4 bg-slate-900/60 border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
              Custo Anual Estimado
            </span>
            <h3 className="text-xl font-black text-amber-400 mt-1">
              {formatCurrency(yearlyTotalBrl)}
            </h3>
            <span className="text-[10px] text-slate-500 block mt-0.5">
              Impacto acumulado em 12 meses
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
            <TrendingUp className="w-5 h-5" />
          </div>
        </Card>

        <Card className="p-4 bg-slate-900/60 border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
              Assinaturas Ativas
            </span>
            <h3 className="text-xl font-black text-emerald-400 mt-1">
              {activeSubs.length} de {subscriptions.length}
            </h3>
            <span className="text-[10px] text-slate-500 block mt-0.5">
              {subscriptions.length - activeSubs.length} pausada(s)
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
            <Check className="w-5 h-5" />
          </div>
        </Card>
      </div>

      {/* Subscriptions List */}
      <Card className="p-5">
        <div className="flex items-center justify-between gap-4 mb-4 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-300">Filtrar:</span>
            {[
              { id: 'ALL', label: 'Todas' },
              { id: 'ACTIVE', label: 'Ativas' },
              { id: 'PAUSED', label: 'Pausadas' },
            ].map((p) => (
              <button
                key={p.id}
                onClick={() => setStatusFilter(p.id)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer ${
                  statusFilter === p.id
                    ? 'bg-rose-600 text-white font-bold'
                    : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-xs">
            Nenhuma assinatura cadastrada ainda. Clique em "Nova Assinatura" ou escolha um modelo acima.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((sub) => (
              <div
                key={sub.id}
                className={`p-4 rounded-2xl border transition-all flex flex-col justify-between space-y-4 ${
                  sub.status === 'PAUSED'
                    ? 'bg-slate-950/40 border-slate-800/60 opacity-60'
                    : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                }`}
              >
                {/* Top Bar: Color Avatar + Name + Badge */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white shadow-md shrink-0"
                      style={{ backgroundColor: sub.color || '#e50914' }}
                    >
                      {sub.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">{sub.name}</h4>
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-0.5">
                        <Calendar className="w-3 h-3 text-slate-500" />
                        <span>Dia {sub.billingDay} do mês</span>
                        <span>•</span>
                        <span className="uppercase text-[10px] font-mono font-bold text-slate-400">
                          {sub.billingCycle === 'YEARLY' ? 'Anual' : 'Mensal'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <Badge variant={sub.status === 'ACTIVE' ? 'success' : 'default'}>
                    {sub.status === 'ACTIVE' ? 'Ativa' : 'Pausada'}
                  </Badge>
                </div>

                {/* Middle: Amount Display */}
                <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800/80 flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-400">Débito no Saldo:</span>
                  <div className="text-right">
                    <span className="text-lg font-mono font-black text-white">
                      {sub.currency === 'USD' ? `$ ${sub.amount}` : formatCurrency(sub.amount)}
                    </span>
                    {sub.currency === 'USD' && (
                      <span className="text-[10px] text-amber-400 font-mono block">
                        ≈ {formatCurrency(sub.amount * usdRate)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Debitar no Extrato Action Button */}
                <button
                  type="button"
                  onClick={() => handleDebitNow(sub)}
                  disabled={debitingId === sub.id || sub.status === 'PAUSED'}
                  className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-rose-600 to-indigo-600 hover:from-rose-500 hover:to-indigo-500 text-white font-bold text-xs shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-40"
                >
                  <Zap className="w-3.5 h-3.5 text-amber-300" />
                  <span>{debitingId === sub.id ? 'Debitando...' : '⚡ Debitar no Extrato do Mês'}</span>
                </button>

                {/* Bottom Controls */}
                <div className="flex items-center justify-between pt-1 text-xs border-t border-slate-800/60">
                  <button
                    onClick={() => handleToggleStatus(sub)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-colors cursor-pointer ${
                      sub.status === 'ACTIVE'
                        ? 'bg-amber-500/10 text-amber-400 hover:bg-amber-500/20'
                        : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                    }`}
                  >
                    {sub.status === 'ACTIVE' ? (
                      <>
                        <Pause className="w-3.5 h-3.5" /> Pausar
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5" /> Ativar
                      </>
                    )}
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(sub)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                      title="Editar Assinatura"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(sub.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors cursor-pointer"
                      title="Excluir Assinatura"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Modal Simples Nova / Editar Assinatura */}
      {isModalOpen && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={editingSub ? 'Editar Assinatura' : 'Criar Assinatura'}
          description="Informe o nome, valor e conta. A cobrança será lançada no extrato do mês."
        >
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Nome do Serviço *
              </label>
              <input
                type="text"
                required
                placeholder="Ex: Netflix, Claude Pro, Spotify, ChatGPT..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:border-rose-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Valor *
                </label>
                <input
                  type="text"
                  required
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-bold font-mono text-sm focus:border-rose-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Moeda</label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:border-rose-500 focus:outline-none"
                >
                  <option value="BRL">BRL (R$ - Real)</option>
                  <option value="USD">USD ($ - Dólar)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Conta para Débito
                </label>
                <select
                  value={accountId}
                  onChange={(e) => {
                    setAccountId(e.target.value);
                    if (e.target.value) setCreditCardId('');
                  }}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:border-rose-500 focus:outline-none"
                >
                  <option value="">Nenhuma / Conta Padrão</option>
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name} (R$ {acc.currentBalance})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Ou Cartão de Crédito
                </label>
                <select
                  value={creditCardId}
                  onChange={(e) => {
                    setCreditCardId(e.target.value);
                    if (e.target.value) setAccountId('');
                  }}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:border-rose-500 focus:outline-none"
                >
                  <option value="">Nenhum Cartão</option>
                  {creditCards.map((card) => (
                    <option key={card.id} value={card.id}>
                      {card.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Ciclo de Cobrança
                </label>
                <select
                  value={billingCycle}
                  onChange={(e) => setBillingCycle(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:border-rose-500 focus:outline-none"
                >
                  <option value="MONTHLY">Mensal</option>
                  <option value="YEARLY">Anual</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Dia de Débito no Mês (1 a 31)
                </label>
                <input
                  type="number"
                  min={1}
                  max={31}
                  value={billingDay}
                  onChange={(e) => setBillingDay(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:border-rose-500 focus:outline-none"
                />
              </div>
            </div>

            {!editingSub && (
              <div className="p-3 bg-rose-950/40 border border-rose-500/40 rounded-xl flex items-center justify-between gap-3">
                <div>
                  <span className="text-xs font-bold text-white block">
                    ⚡ Debitar no extrato deste mês agora
                  </span>
                  <span className="text-[11px] text-slate-400 block">
                    Cria o lançamento no extrato e debita o saldo imediatamente.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={autoDebitCurrentMonth}
                  onChange={(e) => setAutoDebitCurrentMonth(e.target.checked)}
                  className="w-5 h-5 rounded bg-slate-900 border-slate-700 text-rose-600 focus:ring-rose-500 cursor-pointer"
                />
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white cursor-pointer"
              >
                Cancelar
              </button>

              <button
                type="submit"
                disabled={submitting}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-lg shadow-rose-500/25 cursor-pointer disabled:opacity-50"
              >
                <Check className="w-4 h-4" />
                <span>{submitting ? 'Salvando...' : 'Salvar Assinatura'}</span>
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
