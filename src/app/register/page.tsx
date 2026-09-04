'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { NexumHubLogo } from '@/components/ui/NexumHubLogo';
import { Lock, Mail, UserCheck, Check, Sparkles, AlertTriangle } from 'lucide-react';
import { GoogleSignInButton } from '@/components/auth/GoogleSignInButton';
import Link from 'next/link';

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

  const [loading, setLoading] = useState(Boolean(token));
  const [inviteData, setInviteData] = useState<any>(null);
  const [error, setError] = useState('');

  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [color, setColor] = useState(AVATAR_COLORS[0]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }

    fetch(`/api/invite?token=${encodeURIComponent(token)}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.invite) {
          setInviteData(data.invite);
          setName(data.invite.name || '');
          setEmail(data.invite.email || '');
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
      setError('Digite a sua senha ou PIN de acesso.');
      return;
    }
    if (pin !== confirmPin) {
      setError('As senhas digitadas não coincidem.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      let res;
      if (token) {
        // Fluxo por convite do admin
        res = await fetch('/api/invite', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token, name, pin, avatarColor: color }),
        });
      } else {
        // Fluxo público direto com 7 dias de degustação
        res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, pin, avatarColor: color }),
        });
      }

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
        Validando informações de cadastro...
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-4">
      {/* Brand Header */}
      <div className="flex flex-col items-center text-center mb-6">
        <NexumHubLogo size="xl" className="mb-2" />
        <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold mt-2">
          <Sparkles className="w-3.5 h-3.5" />
          <span>7 Dias Grátis • NexumHub</span>
        </span>
      </div>

      {/* Register Card */}
      <div className="w-full max-w-md bg-zinc-900/90 border border-zinc-800 rounded-2xl p-6 md:p-8 shadow-2xl backdrop-blur-xl space-y-5">
        <div>
          <h2 className="text-lg font-bold text-white">
            {inviteData ? `Bem-vindo(a), ${inviteData.name}! 👋` : 'Crie sua conta no NexumHub'}
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            {inviteData
              ? 'Complete o formulário abaixo para ativar seu acesso.'
              : 'Acesso instantâneo a todas as ferramentas Pro por 7 dias.'}
          </p>
        </div>

        {/* 1-Click Google Sign Up */}
        <div className="space-y-3 pt-1">
          <GoogleSignInButton label="Cadastrar com o Google" />
          <div className="relative flex items-center justify-center">
            <div className="w-full border-t border-zinc-800" />
            <span className="bg-zinc-900 px-3 text-[11px] text-zinc-500 uppercase tracking-wider font-semibold absolute">
              ou crie com e-mail
            </span>
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-medium text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1.5">Seu Nome Completo</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Digite seu nome completo"
              className="w-full bg-zinc-950/70 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1.5">Seu E-mail</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-zinc-400 absolute left-3 top-3" />
              <input
                type="email"
                required
                disabled={Boolean(inviteData)}
                value={inviteData ? inviteData.email : email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seuemail@exemplo.com"
                className={`w-full bg-zinc-950/70 border border-zinc-800 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors ${inviteData ? 'cursor-not-allowed opacity-75' : ''
                  }`}
              />
            </div>
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
                className="w-full bg-zinc-950/70 border border-zinc-800 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 transition-colors"
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
                className="w-full bg-zinc-950/70 border border-zinc-800 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 transition-colors"
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
                <UserCheck className="w-4 h-4 text-zinc-950" />
                <span>Começar 7 Dias Grátis</span>
              </>
            )}
          </button>
        </form>

        <div className="pt-2 text-center border-t border-zinc-800/80">
          <p className="text-xs text-zinc-400">
            Já tem uma conta?{' '}
            <Link href="/login" className="text-emerald-400 hover:underline font-semibold">
              Fazer Login
            </Link>
          </p>
        </div>
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
