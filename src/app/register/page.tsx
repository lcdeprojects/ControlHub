'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { ControlHubLogo } from '@/components/ui/ControlHubLogo';
import { Lock, Mail, UserCheck, ShieldCheck, Check, Sparkles, AlertTriangle } from 'lucide-react';

const AVATAR_COLORS = [
  '#6366f1', // Indigo
  '#10b981', // Emerald
  '#3b82f6', // Blue
  '#f59e0b', // Amber
  '#ec4899', // Pink
  '#84cc16', // Lime
  '#06b6d4', // Cyan
];

function RegisterContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');

  const [loading, setLoading] = useState(true);
  const [inviteData, setInviteData] = useState<any>(null);
  const [error, setError] = useState('');

  // Form State
  const [name, setName] = useState('');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [color, setColor] = useState(AVATAR_COLORS[0]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!token) {
      setError('Token de convite não informado. Solicite um link ao administrador.');
      setLoading(false);
      return;
    }

    fetch(`/api/invite?token=${encodeURIComponent(token)}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.invite) {
          setInviteData(data.invite);
          setName(data.invite.name || '');
        } else {
          setError(data.error || 'Convite inválido ou expirado.');
        }
      })
      .catch(() => setError('Erro de conexão com o servidor.'))
      .finally(() => setLoading(false));
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pin) {
      setError('Digite a sua nova senha / PIN.');
      return;
    }
    if (pin !== confirmPin) {
      setError('As senhas digitadas não coincidem.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          name,
          pin,
          avatarColor: color,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        window.location.href = '/';
      } else {
        setError(data.error || 'Erro ao realizar cadastro.');
      }
    } catch (err: any) {
      setError(err.message || 'Falha de conexão.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-4 text-zinc-400 text-sm">
        Validando link de convite...
      </div>
    );
  }

  if (error && !inviteData) {
    return (
      <div className="w-full min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-6 text-center space-y-4">
          <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-white">Convite Inválido ou Expirado</h2>
          <p className="text-xs text-zinc-400">{error}</p>
          <a
            href="/login"
            className="inline-block px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold transition-all"
          >
            Ir para Login
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-4">
      {/* Brand Header */}
      <div className="flex flex-col items-center text-center mb-6">
        <ControlHubLogo size="xl" className="mb-2" />
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold mt-2">
          <Sparkles className="w-3.5 h-3.5" />
          Primeiro Acesso ao Sistema
        </span>
      </div>

      {/* Register Card */}
      <div className="w-full max-w-md bg-zinc-900/90 border border-zinc-800 rounded-2xl p-6 md:p-8 shadow-2xl backdrop-blur-xl space-y-6">
        <div>
          <h2 className="text-lg font-bold text-white">Bem-vindo(a), {inviteData?.name}! 👋</h2>
          <p className="text-xs text-zinc-400 mt-1">
            Crie a sua senha/PIN pessoal para acessar o ControlHub.
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-medium text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1.5">Seu E-mail (Convidado)</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-zinc-500 absolute left-3 top-3" />
              <input
                type="text"
                disabled
                value={inviteData?.email || ''}
                className="w-full bg-zinc-950/40 border border-zinc-800/60 rounded-xl pl-9 pr-4 py-2.5 text-sm text-zinc-400 font-mono cursor-not-allowed"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1.5">Seu Nome Completo</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-zinc-950/70 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1.5">Crie sua Senha / PIN de Acesso</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-zinc-400 absolute left-3 top-3" />
              <input
                type="password"
                required
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="Digite sua senha ou PIN"
                className="w-full bg-zinc-950/70 border border-zinc-800 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1.5">Confirme sua Senha / PIN</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-zinc-400 absolute left-3 top-3" />
              <input
                type="password"
                required
                value={confirmPin}
                onChange={(e) => setConfirmPin(e.target.value)}
                placeholder="Confirme a senha digitada"
                className="w-full bg-zinc-950/70 border border-zinc-800 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-2">Cor do Perfil</label>
            <div className="flex items-center gap-2">
              {AVATAR_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className="w-7 h-7 rounded-full flex items-center justify-center transition-transform hover:scale-110 cursor-pointer"
                  style={{ backgroundColor: c }}
                >
                  {color === c && <Check className="w-3.5 h-3.5 text-white" />}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-zinc-950 font-bold text-sm transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer mt-2"
          >
            {submitting ? (
              <span>Criando Conta...</span>
            ) : (
              <>
                <UserCheck className="w-4 h-4" />
                <span>Finalizar Cadastro e Entrar</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="w-full min-h-screen bg-zinc-950 flex items-center justify-center text-zinc-400 text-sm">Carregando...</div>}>
      <RegisterContent />
    </Suspense>
  );
}
