'use client';

import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import {
  Settings as SettingsIcon,
  Tag,
  Plus,
  Check,
  Pencil,
  Trash2,
  SlidersHorizontal,
  Smartphone,
  MessageSquare,
  Save,
} from 'lucide-react';

import { useAuth } from '@/contexts/AuthContext';

export default function SettingsPage() {
  const { user, refreshUser } = useAuth();
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'EXPENSE' | 'INCOME'>('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Phone Number / Profile State
  const [phoneNumber, setPhoneNumber] = useState('');
  const [savingPhone, setSavingPhone] = useState(false);
  const [phoneSuccess, setPhoneSuccess] = useState('');
  const [phoneError, setPhoneError] = useState('');

  // Form State
  const [editingCategory, setEditingCategory] = useState<any | null>(null);
  const [name, setName] = useState('');
  const [type, setType] = useState<'EXPENSE' | 'INCOME' | 'HOUSEHOLD'>('EXPENSE');
  const [color, setColor] = useState('#3b82f6');
  const [icon, setIcon] = useState('tag');
  const [showInQuickAdd, setShowInQuickAdd] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user?.phoneNumber !== undefined && user?.phoneNumber !== null) {
      setPhoneNumber(user.phoneNumber);
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      const headers: Record<string, string> = {};
      if (user?.id) headers['x-user-id'] = user.id;

      const res = await fetch('/api/users/profile', { headers });
      const data = await res.json();
      if (data.success && data.profile) {
        setPhoneNumber(data.profile.phoneNumber || '');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/categories');
      const data = await res.json();
      if (data.success) {
        setCategories(data.categories || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
    fetchCategories();
  }, [user?.id]);

  const handleSavePhone = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingPhone(true);
    setPhoneSuccess('');
    setPhoneError('');

    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (user?.id) headers['x-user-id'] = user.id;

      const res = await fetch('/api/users/profile', {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ phoneNumber }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setPhoneError(data.error || 'Erro ao salvar número do WhatsApp.');
      } else {
        setPhoneSuccess('Número do WhatsApp atualizado com sucesso! Agora o bot responderá às suas mensagens.');
        setPhoneNumber(data.profile?.phoneNumber || phoneNumber);
        if (refreshUser) await refreshUser();
      }
    } catch (err: any) {
      setPhoneError(err.message || 'Erro de conexão.');
    } finally {
      setSavingPhone(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingCategory(null);
    setName('');
    setType('EXPENSE');
    setColor('#3b82f6');
    setIcon('tag');
    setShowInQuickAdd(true);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (cat: any) => {
    setEditingCategory(cat);
    setName(cat.name);
    setType(cat.type || 'EXPENSE');
    setColor(cat.color || '#3b82f6');
    setIcon(cat.icon || 'tag');
    setShowInQuickAdd(Boolean(cat.showInQuickAdd));
    setIsModalOpen(true);
  };

  const handleToggleQuickAdd = async (cat: any) => {
    const newValue = !cat.showInQuickAdd;
    try {
      const res = await fetch(`/api/categories/${cat.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ showInQuickAdd: newValue }),
      });
      if (res.ok) await fetchCategories();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;

    setSubmitting(true);
    try {
      const body = {
        name,
        type,
        color,
        icon,
        showInQuickAdd,
      };

      const url = editingCategory ? `/api/categories/${editingCategory.id}` : '/api/categories';
      const method = editingCategory ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        setIsModalOpen(false);
        await fetchCategories();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja excluir esta categoria?')) return;
    try {
      const res = await fetch(`/api/categories/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok && data.success) {
        await fetchCategories();
      } else {
        alert(data.error || 'Erro ao excluir categoria.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const filteredCategories = categories.filter((c) => {
    if (typeFilter === 'EXPENSE') return c.type === 'EXPENSE' || c.type === 'HOUSEHOLD';
    if (typeFilter === 'INCOME') return c.type === 'INCOME';
    return true;
  });

  const quickCount = categories.filter((c) => c.showInQuickAdd).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white flex items-center gap-2">
            <SettingsIcon className="w-6 h-6 text-blue-500" />
            Configurações & Categorias
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Gerencie as categorias do sistema e os atalhos do lançamento rápido no celular.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-500/25 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Nova Categoria</span>
        </button>
      </div>

      {/* QuickModal Banner Info */}
      <Card className="p-4 bg-gradient-to-r from-blue-950/60 to-indigo-950/60 border-blue-800/60">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                Atalhos do QuickModal Mobile
                <Badge variant="blue">{quickCount} Ativos</Badge>
              </h4>
              <p className="text-xs text-slate-300 mt-0.5">
                Clique no botão de celular em cada categoria abaixo para ativá-la ou desativá-la no lançamento rápido.
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* WhatsApp Integration Card */}
      <Card className="p-5 bg-gradient-to-r from-emerald-950/40 via-zinc-900/80 to-zinc-900/80 border-emerald-500/30">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1 max-w-xl">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                <MessageSquare className="w-4 h-4" />
              </div>
              <h3 className="text-base font-bold text-white">Integração WhatsApp Bot (Evolution API)</h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed pt-1">
              Vincule seu número de celular para que o robô reconheça suas mensagens enviadas via WhatsApp (ex: <span className="text-emerald-400 font-medium">&quot;Gastei 45 almoço&quot;</span>) e registre a despesa automaticamente na sua conta.
            </p>
          </div>

          <form onSubmit={handleSavePhone} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            <div className="relative">
              <input
                type="text"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="Ex: 5511999999999"
                className="w-full sm:w-56 px-3.5 py-2.5 bg-slate-950 border border-slate-700 focus:border-emerald-500 rounded-xl text-white text-xs font-mono focus:outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={savingPhone}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-500/25 transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{savingPhone ? 'Salvando...' : 'Salvar Número'}</span>
            </button>
          </form>
        </div>

        {phoneSuccess && (
          <div className="mt-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-medium">
            ✅ {phoneSuccess}
          </div>
        )}
        {phoneError && (
          <div className="mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-medium">
            ⚠️ {phoneError}
          </div>
        )}
      </Card>

      {/* Categories Filter Tabs */}
      <Card className="p-4">
        <div className="flex items-center justify-between gap-4 pb-3 mb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-400">Filtrar:</span>
            {[
              { id: 'ALL', label: 'Todas' },
              { id: 'EXPENSE', label: 'Despesas' },
              { id: 'INCOME', label: 'Receitas' },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setTypeFilter(f.id as any)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                  typeFilter === f.id
                    ? 'bg-blue-600 text-white font-bold'
                    : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredCategories.map((cat) => (
            <div
              key={cat.id}
              className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-all flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-white shrink-0 shadow-sm"
                  style={{ backgroundColor: cat.color || '#64748b' }}
                >
                  <Tag className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-white truncate">{cat.name}</h4>
                  <span className="text-[10px] text-slate-400 font-mono block">
                    {cat.type === 'INCOME' ? 'Receita' : 'Despesa'}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-1.5 shrink-0">
                {/* Toggle QuickModal */}
                <button
                  type="button"
                  onClick={() => handleToggleQuickAdd(cat)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
                    cat.showInQuickAdd
                      ? 'bg-blue-600/20 text-blue-400 border border-blue-500/40'
                      : 'bg-slate-950 text-slate-500 border border-slate-800 hover:text-slate-300'
                  }`}
                  title="Alternar exibição no QuickModal (Mobile)"
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>{cat.showInQuickAdd ? 'No Mobile' : 'Oculto'}</span>
                </button>

                {/* Edit */}
                <button
                  onClick={() => handleOpenEdit(cat)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                  title="Editar Categoria"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>

                {/* Delete */}
                <button
                  onClick={() => handleDelete(cat.id)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors cursor-pointer"
                  title="Excluir Categoria"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Modal Criar / Editar Categoria */}
      {isModalOpen && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={editingCategory ? 'Editar Categoria' : 'Nova Categoria'}
          description="Personalize o nome, cor e disponibilidade nos atalhos do celular."
        >
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Nome da Categoria *
              </label>
              <input
                type="text"
                required
                placeholder="Ex: Mercado, Restaurante, Educação, Farmácia..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Tipo da Categoria
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:border-blue-500 focus:outline-none"
                >
                  <option value="EXPENSE">Despesa Geral</option>
                  <option value="HOUSEHOLD">Custo da Casa</option>
                  <option value="INCOME">Receita</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Cor da Tag
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="w-9 h-9 p-0 bg-transparent border-0 rounded-lg cursor-pointer"
                  />
                  <span className="text-xs font-mono text-slate-400">{color}</span>
                </div>
              </div>
            </div>

            {/* Checkbox QuickModal */}
            <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between gap-3">
              <div>
                <span className="text-xs font-bold text-white block">
                  Exibir como atalho no QuickModal (Mobile)
                </span>
                <span className="text-[11px] text-slate-400 block">
                  Aparece em 1 toque na barra rápida de lançamentos.
                </span>
              </div>
              <input
                type="checkbox"
                checked={showInQuickAdd}
                onChange={(e) => setShowInQuickAdd(e.target.checked)}
                className="w-5 h-5 rounded bg-slate-900 border-slate-700 text-blue-600 focus:ring-blue-500 cursor-pointer"
              />
            </div>

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
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-500/25 cursor-pointer disabled:opacity-50"
              >
                <Check className="w-4 h-4" />
                <span>{submitting ? 'Salvando...' : 'Salvar Categoria'}</span>
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
