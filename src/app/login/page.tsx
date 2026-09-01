'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { ShieldCheck, LogIn, Lock, Mail, UserCheck } from 'lucide-react';

export default function LoginPage() {
  const { user, login } = useAuth();
  const router = useRouter();

  const [usersList, setUsersList] = useState<any[]>([]);
  const [email, setEmail] = useState('');
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      router.push('/');
    }
  }, [user, router]);

  useEffect(() => {
    fetch('/api/users')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setUsersList(data);
          if (data.length > 0 && !email) {
            setEmail(data[0].email);
          }
        }
      })
      .catch(() => {});
  }, []);

  const handleSelectUser = (u: any) => {
    setEmail(u.email);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await login(email, pin);
      if (!res.success) {
        setError(res.error || 'Erro ao realizar login');
      }
    } catch (err: any) {
      setError(err.message || 'Ocorreu um erro ao conectar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-4">
      {/* Brand Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 mb-4 shadow-lg shadow-emerald-500/5">
          <ShieldCheck className="w-7 h-7 text-emerald-400" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-white">ControlHub</h1>
        <p className="text-sm text-zinc-400 mt-1">Gestão Financeira & Autenticação</p>
      </div>

      {/* Main Login Card */}
      <div className="w-full max-w-md bg-zinc-900/90 border border-zinc-800 rounded-2xl p-6 md:p-8 shadow-2xl backdrop-blur-xl">
        <div className="flex items-center gap-2 mb-6 pb-4 border-b border-zinc-800">
          <LogIn className="w-5 h-5 text-emerald-400" />
          <h2 className="text-base font-semibold text-white">Acesse sua Conta</h2>
        </div>

        {/* User Quick Switch Grid */}
        {usersList.length > 0 && (
          <div className="mb-6">
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-3">
              Selecione seu perfil:
            </label>
            <div className="grid grid-cols-2 gap-2">
              {usersList.map((u) => {
                const isSelected = email.toLowerCase() === u.email.toLowerCase();
                return (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => handleSelectUser(u)}
                    className={`flex items-center gap-3 p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-500/10 border-emerald-500/50 text-white shadow-md'
                        : 'bg-zinc-800/40 border-zinc-800 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
                    }`}
                  >
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white shrink-0 shadow-sm"
                      style={{ backgroundColor: u.avatarColor || '#6366f1' }}
                    >
                      {u.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold truncate">{u.name}</p>
                      <p className="text-[10px] text-zinc-500 truncate">{u.role === 'ADMIN' ? 'Administrador' : 'Usuário'}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-medium text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1.5">E-mail ou Usuário</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-zinc-400 absolute left-3 top-3" />
              <input
                type="text"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com ou lucasconto"
                className="w-full bg-zinc-950/70 border border-zinc-800 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1.5">Senha / PIN de Acesso</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-zinc-400 absolute left-3 top-3" />
              <input
                type="password"
                required
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="Digite sua senha ou PIN"
                className="w-full bg-zinc-950/70 border border-zinc-800 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-semibold text-sm transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
          >
            {loading ? (
              <span>Aguarde...</span>
            ) : (
              <>
                <UserCheck className="w-4 h-4" />
                <span>Entrar no Sistema</span>
              </>
            )}
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-zinc-800/80 text-center">
          <p className="text-xs text-zinc-500">
            Administrador: <strong className="text-zinc-300">lucasconto</strong> | Senha: <strong className="text-zinc-300">Senha@123</strong>
          </p>
          <p className="text-[11px] text-zinc-600 mt-1">
            Novos usuários são cadastrados exclusivamente pelo Administrador no Painel Backoffice.
          </p>
        </div>
      </div>
    </div>
  );
}
