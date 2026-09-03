'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { formatDate } from '@/lib/utils';
import {
  ShieldCheck,
  UserPlus,
  KeyRound,
  Users,
  Shield,
  User as UserIcon,
  Check,
  RefreshCw,
  AlertTriangle,
  Trash2,
  Link as LinkIcon,
  Copy,
  Sparkles,
} from 'lucide-react';

const AVATAR_COLORS = [
  '#6366f1', // Indigo
  '#10b981', // Emerald
  '#3b82f6', // Blue
  '#f59e0b', // Amber
  '#ec4899', // Pink
  '#84cc16', // Lime
  '#06b6d4', // Cyan
  '#ef4444', // Red
];

interface UserItem {
  id: string;
  name: string;
  email: string;
  avatarColor?: string;
  role: 'ADMIN' | 'USER';
  createdAt?: string;
}

interface InviteItem {
  id: string;
  name: string;
  email: string;
  role: string;
  token: string;
  used: boolean;
  createdAt: string;
}

export default function AdminBackofficePage() {
  const { user } = useAuth();
  const [usersList, setUsersList] = useState<UserItem[]>([]);
  const [invitesList, setInvitesList] = useState<InviteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Create User Modal
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPin, setNewPin] = useState('');
  const [newRole, setNewRole] = useState<'USER' | 'ADMIN'>('USER');
  const [newColor, setNewColor] = useState(AVATAR_COLORS[0]);
  const [submittingCreate, setSubmittingCreate] = useState(false);

  // Invite Link Modal
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'USER' | 'ADMIN'>('USER');
  const [generatedUrl, setGeneratedUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [submittingInvite, setSubmittingInvite] = useState(false);

  // Reset Password Modal
  const [resetTargetUser, setResetTargetUser] = useState<UserItem | null>(null);
  const [resetPinValue, setResetPinValue] = useState('');
  const [submittingReset, setSubmittingReset] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const [uRes, iRes] = await Promise.all([
        fetch('/api/admin/users'),
        fetch('/api/admin/invites'),
      ]);
      const [uData, iData] = await Promise.all([uRes.json(), iRes.json()]);

      if (uRes.ok && uData.success) {
        setUsersList(uData.users || []);
      }
      if (iRes.ok && iData.success) {
        setInvitesList(iData.invites || []);
      }
    } catch (err: any) {
      setError('Falha de conexão com o servidor');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'ADMIN') {
      fetchUsers();
    }
  }, [user]);

  if (!user || user.role !== 'ADMIN') {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-6">
        <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-4">
          <AlertTriangle className="w-8 h-8 text-red-400" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Acesso Restrito ao Backoffice</h2>
        <p className="text-sm text-zinc-400 max-w-md mb-6">
          Você não possui permissões de Administrador para acessar esta área. Faça login com uma conta Admin (`lucasconto`).
        </p>
      </div>
    );
  }

  const handleGenerateInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingInvite(true);
    setError('');
    setSuccessMsg('');
    setGeneratedUrl('');

    try {
      const res = await fetch('/api/admin/invites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: inviteName,
          email: inviteEmail,
          role: inviteRole,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || 'Erro ao gerar link de convite');
      } else {
        setGeneratedUrl(data.invite.inviteUrl);
        setSuccessMsg(`Link de convite criado para ${inviteName}!`);
        fetchUsers();
      }
    } catch (err: any) {
      setError(err.message || 'Erro de conexão');
    } finally {
      setSubmittingInvite(false);
    }
  };

  const handleCopyInviteUrl = (urlStr: string) => {
    navigator.clipboard.writeText(urlStr);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handleRevokeInvite = async (id: string) => {
    if (!confirm('Deseja revogar este link de convite?')) return;
    try {
      const res = await fetch(`/api/admin/invites?id=${id}`, { method: 'DELETE' });
      if (res.ok) fetchUsers();
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingCreate(true);
    setError('');
    setSuccessMsg('');

    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newName,
          email: newEmail,
          pin: newPin,
          role: newRole,
          avatarColor: newColor,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || 'Erro ao criar usuário');
      } else {
        setSuccessMsg(`Usuário ${newName} criado com sucesso!`);
        setIsCreateOpen(false);
        setNewName('');
        setNewEmail('');
        setNewPin('');
        fetchUsers();
      }
    } catch (err: any) {
      setError(err.message || 'Erro de conexão');
    } finally {
      setSubmittingCreate(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetTargetUser) return;
    setSubmittingReset(true);
    setError('');
    setSuccessMsg('');

    try {
      const res = await fetch('/api/admin/users/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: resetTargetUser.id,
          newPin: resetPinValue,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || 'Erro ao resetar senha');
      } else {
        setSuccessMsg(`Senha do usuário ${resetTargetUser.name} alterada com sucesso!`);
        setResetTargetUser(null);
        setResetPinValue('');
      }
    } catch (err: any) {
      setError(err.message || 'Erro de conexão');
    } finally {
      setSubmittingReset(false);
    }
  };

  const handleMigrateLegacyData = async (targetUserId: string, targetName: string) => {
    if (!confirm(`Deseja importar/transferir todas as contas, cartões e lançamentos antigos para ${targetName}?`)) return;
    setError('');
    setSuccessMsg('');

    try {
      const res = await fetch('/api/admin/migrate-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromUserId: 'usr_default',
          toUserId: targetUserId,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || 'Erro ao migrar dados');
      } else {
        setSuccessMsg(data.message || 'Dados migrados com sucesso!');
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao migrar dados');
    }
  };

  const handleDeleteUser = async (targetUserId: string, targetName: string) => {
    if (!confirm(`Tem certeza que deseja excluir o usuário ${targetName}? Esta ação não pode ser desfeita.`)) return;
    setError('');
    setSuccessMsg('');

    try {
      const res = await fetch(`/api/admin/users?id=${encodeURIComponent(targetUserId)}`, {
        method: 'DELETE',
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || 'Erro ao excluir usuário');
      } else {
        setSuccessMsg(data.message || `Usuário ${targetName} excluído.`);
        fetchUsers();
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao excluir usuário');
    }
  };

  const adminCount = usersList.filter((u) => u.role === 'ADMIN').length;
  const userCount = usersList.filter((u) => u.role === 'USER').length;

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-emerald-400" />
            <h1 className="text-2xl font-bold text-white tracking-tight">Painel Backoffice</h1>
          </div>
          <p className="text-sm text-zinc-400 mt-1">
            Gerenciamento centralizado de usuários e controle de acesso
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Main Action: Generate Invite Link */}
          <button
            onClick={() => {
              setError('');
              setGeneratedUrl('');
              setInviteName('');
              setInviteEmail('');
              setIsInviteOpen(true);
            }}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-sm shadow-lg shadow-purple-600/25 transition-all cursor-pointer"
          >
            <LinkIcon className="w-4 h-4" />
            <span>🔗 Gerar Link de Convite</span>
          </button>

          <button
            onClick={() => {
              setError('');
              setIsCreateOpen(true);
            }}
            className="flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold border border-zinc-700 transition-all cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Manual</span>
          </button>
        </div>
      </div>

      {/* Alerts */}
      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm font-medium">
          ✅ {successMsg}
        </div>
      )}
      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm font-medium">
          ⚠️ {error}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-5 border-zinc-800 bg-zinc-900/60">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-zinc-400 font-medium">Total de Usuários</p>
              <p className="text-2xl font-bold text-white mt-1">{usersList.length}</p>
            </div>
            <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <Users className="w-5 h-5" />
            </div>
          </div>
        </Card>

        <Card className="p-5 border-zinc-800 bg-zinc-900/60">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-zinc-400 font-medium">Convites Pendentes</p>
              <p className="text-2xl font-bold text-purple-400 mt-1">
                {invitesList.filter((i) => !i.used).length}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
              <LinkIcon className="w-5 h-5" />
            </div>
          </div>
        </Card>

        <Card className="p-5 border-zinc-800 bg-zinc-900/60">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-zinc-400 font-medium">Administradores</p>
              <p className="text-2xl font-bold text-emerald-400 mt-1">{adminCount}</p>
            </div>
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <Shield className="w-5 h-5" />
            </div>
          </div>
        </Card>
      </div>

      {/* Invites Table */}
      {invitesList.length > 0 && (
        <Card className="border-zinc-800 bg-zinc-900/60 overflow-hidden">
          <div className="p-4 border-b border-zinc-800">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-400" />
              Links de Convite Enviados ({invitesList.length})
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-950/60 text-zinc-400 font-semibold uppercase tracking-wider border-b border-zinc-800">
                <tr>
                  <th className="px-4 py-3">Convidado</th>
                  <th className="px-4 py-3">E-mail</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {invitesList.map((inv) => {
                  const host = typeof window !== 'undefined' ? window.location.host : 'localhost:3000';
                  const protocol = typeof window !== 'undefined' ? window.location.protocol : 'http:';
                  const fullUrl = `${protocol}//${host}/register?token=${inv.token}`;

                  return (
                    <tr key={inv.id} className="hover:bg-zinc-800/30">
                      <td className="px-4 py-3 font-semibold text-white">{inv.name}</td>
                      <td className="px-4 py-3 text-zinc-400 font-mono">{inv.email}</td>
                      <td className="px-4 py-3">
                        {inv.used ? (
                          <Badge variant="success">Cadastrado</Badge>
                        ) : (
                          <Badge variant="blue">Pendente</Badge>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right flex items-center justify-end gap-2">
                        {!inv.used && (
                          <button
                            onClick={() => handleCopyInviteUrl(fullUrl)}
                            className="px-2.5 py-1 rounded-lg bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 font-bold border border-purple-500/40 flex items-center gap-1 cursor-pointer"
                          >
                            <Copy className="w-3 h-3" />
                            <span>Copiar Link</span>
                          </button>
                        )}
                        <button
                          onClick={() => handleRevokeInvite(inv.id)}
                          className="p-1 rounded-lg text-zinc-500 hover:text-rose-400 cursor-pointer"
                          title="Revogar convite"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Users Table */}
      <Card className="border-zinc-800 bg-zinc-900/60 overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-zinc-800 flex items-center justify-between">
          <h2 className="text-base font-semibold text-white">Usuários Ativos</h2>
          <button
            onClick={fetchUsers}
            className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors cursor-pointer"
            title="Atualizar lista"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {loading ? (
          <div className="p-8 text-center text-zinc-400 text-sm">Carregando lista de usuários...</div>
        ) : usersList.length === 0 ? (
          <div className="p-8 text-center text-zinc-400 text-sm">Nenhum usuário cadastrado.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-zinc-950/60 text-zinc-400 text-xs font-semibold uppercase tracking-wider border-b border-zinc-800">
                <tr>
                  <th className="px-6 py-3.5">Perfil</th>
                  <th className="px-6 py-3.5">E-mail / Login</th>
                  <th className="px-6 py-3.5">Função</th>
                  <th className="px-6 py-3.5">Criado Em</th>
                  <th className="px-6 py-3.5 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {usersList.map((u) => (
                  <tr key={u.id} className="hover:bg-zinc-800/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold text-white shadow-sm"
                          style={{ backgroundColor: u.avatarColor || '#6366f1' }}
                        >
                          {u.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-semibold text-white">{u.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-zinc-300 font-mono text-xs">{u.email}</td>
                    <td className="px-6 py-4">
                      {u.role === 'ADMIN' ? (
                        <Badge variant="success" className="gap-1 bg-emerald-500/10 text-emerald-400 border-emerald-500/30">
                          <Shield className="w-3 h-3" />
                          ADMIN
                        </Badge>
                      ) : (
                        <Badge variant="default" className="gap-1 bg-zinc-800 text-zinc-300 border-zinc-700">
                          <UserIcon className="w-3 h-3" />
                          USUÁRIO
                        </Badge>
                      )}
                    </td>
                    <td className="px-6 py-4 text-zinc-400 text-xs">
                      {u.createdAt ? formatDate(u.createdAt) : '—'}
                    </td>
                    <td className="px-6 py-4 text-right flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleMigrateLegacyData(u.id, u.name)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 text-xs font-medium border border-emerald-500/30 transition-colors cursor-pointer"
                        title="Transferir todas as contas, cartões e lançamentos antigos para este perfil"
                      >
                        <RefreshCw className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Puxar Dados Legados</span>
                      </button>

                      <button
                        onClick={() => {
                          setResetTargetUser(u);
                          setResetPinValue('');
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium border border-zinc-700 transition-colors cursor-pointer"
                      >
                        <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                        <span>Resetar Senha</span>
                      </button>

                      {u.id !== user?.id && (
                        <button
                          onClick={() => handleDeleteUser(u.id, u.name)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-medium border border-red-500/30 transition-colors cursor-pointer"
                          title="Excluir usuário"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Excluir</span>
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Invite Link Generator Modal */}
      {isInviteOpen && (
        <Modal isOpen={isInviteOpen} onClose={() => setIsInviteOpen(false)} title="🔗 Gerar Link de Convite para Novo Usuário">
          <form onSubmit={handleGenerateInvite} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">Nome do Convidado *</label>
              <input
                type="text"
                required
                value={inviteName}
                onChange={(e) => setInviteName(e.target.value)}
                placeholder="Ex: Carlos Silva, Maria Santos..."
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">E-mail do Convidado *</label>
              <input
                type="email"
                required
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="carlos@exemplo.com"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">Função no Sistema</label>
              <select
                value={inviteRole}
                onChange={(e: any) => setInviteRole(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
              >
                <option value="USER">Usuário Padrão</option>
                <option value="ADMIN">Administrador (Acesso ao Backoffice)</option>
              </select>
            </div>

            {generatedUrl && (
              <div className="p-3.5 bg-purple-950/40 border border-purple-500/40 rounded-xl space-y-2">
                <span className="text-xs font-bold text-purple-300 block">✅ Link de Convite Gerado!</span>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={generatedUrl}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-zinc-300 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => handleCopyInviteUrl(generatedUrl)}
                    className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-bold shrink-0 flex items-center gap-1 cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>{copied ? 'Copiado!' : 'Copiar'}</span>
                  </button>
                </div>
                <p className="text-[11px] text-zinc-400">
                  Envie este link para a pessoa. Ao abrir, ela poderá criar a própria senha e entrar no sistema!
                </p>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => setIsInviteOpen(false)}
                className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm font-medium cursor-pointer"
              >
                Fechar
              </button>
              {!generatedUrl && (
                <button
                  type="submit"
                  disabled={submittingInvite}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 text-white font-bold text-sm disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                >
                  <LinkIcon className="w-4 h-4" />
                  <span>{submittingInvite ? 'Gerando...' : 'Gerar Link de Convite'}</span>
                </button>
              )}
            </div>
          </form>
        </Modal>
      )}

      {/* Create User Modal (Manual) */}
      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Criar Novo Usuário (Manual)">
        <form onSubmit={handleCreateUser} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1.5">Nome Completo</label>
            <input
              type="text"
              required
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Ex: Carlos Silva"
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1.5">E-mail ou Usuário de Acesso</label>
            <input
              type="text"
              required
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="carlos@controlhub.app"
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1.5">Senha / PIN Inicial</label>
            <input
              type="password"
              required
              value={newPin}
              onChange={(e) => setNewPin(e.target.value)}
              placeholder="Defina o PIN inicial (Ex: 1234)"
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1.5">Função no Sistema</label>
            <select
              value={newRole}
              onChange={(e: any) => setNewRole(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
            >
              <option value="USER">Usuário Padrão</option>
              <option value="ADMIN">Administrador (Acesso ao Backoffice)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-2">Cor do Perfil</label>
            <div className="flex items-center gap-2">
              {AVATAR_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setNewColor(c)}
                  className="w-7 h-7 rounded-full flex items-center justify-center transition-transform hover:scale-110 cursor-pointer"
                  style={{ backgroundColor: c }}
                >
                  {newColor === c && <Check className="w-3.5 h-3.5 text-white" />}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-800">
            <button
              type="button"
              onClick={() => setIsCreateOpen(false)}
              className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm font-medium cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submittingCreate}
              className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-sm disabled:opacity-50 cursor-pointer"
            >
              {submittingCreate ? 'Criando...' : 'Criar Usuário'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Reset Password Modal */}
      <Modal
        isOpen={Boolean(resetTargetUser)}
        onClose={() => setResetTargetUser(null)}
        title={`Resetar Senha de ${resetTargetUser?.name || ''}`}
      >
        <form onSubmit={handleResetPassword} className="space-y-4">
          <p className="text-xs text-zinc-400">
            Defina uma nova senha/PIN para o usuário <strong className="text-white">{resetTargetUser?.email}</strong>.
          </p>

          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1.5">Nova Senha ou PIN</label>
            <input
              type="password"
              required
              value={resetPinValue}
              onChange={(e) => setResetPinValue(e.target.value)}
              placeholder="Digite a nova senha / PIN"
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-800">
            <button
              type="button"
              onClick={() => setResetTargetUser(null)}
              className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm font-medium cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submittingReset}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-sm disabled:opacity-50 cursor-pointer"
            >
              {submittingReset ? 'Salvando...' : 'Salvar Nova Senha'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
