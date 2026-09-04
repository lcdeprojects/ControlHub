'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { NexumHubLogo } from '@/components/ui/NexumHubLogo';
import { Lock, KeyRound, Check, AlertTriangle, ShieldCheck } from 'lucide-react';

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState<any>(null);
  const [error, setError] = useState('');

  // Form State
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!token) {
      setError('Token de redefinição não informado. Solicite um link ao administrador da sua conta.');
      setLoading(false);
      return;
    }

    fetch(`/api/auth/reset-password?token=${encodeURIComponent(token)}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.user) {
          setUserData(data.user);
        } else {
          setError(data.error || 'Link de redefinição inválido ou expirado.');
        }
      })
      .catch(() => setError('Erro de conexão com o servidor.'))
      .finally(() => setLoading(false));
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPin) {
      setError('Digite a sua nova senha / PIN.');
      return;
    }
    if (newPin !== confirmPin) {
      setError('As senhas digitadas não coincidem.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          newPin,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        window.location.href = '/';
      } else {
        setError(data.error || 'Erro ao redefinir senha.');
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
        Validando link de redefinição...
      </div>
    );
  }

  if (error && !userData) {
    return (
      <div className="w-full min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-6 text-center space-y-4">
          <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-white">Link Inválido ou Expirado</h2>
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
        <NexumHubLogo size="xl" className="mb-2" />
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold mt-2">
          <KeyRound className="w-3.5 h-3.5" />
          Redefinição de Senha
        </span>
      </div>

      {/* Reset Form Card */}
      <div className="w-full max-w-md bg-zinc-900/90 border border-zinc-800 rounded-2xl p-6 md:p-8 shadow-2xl backdrop-blur-xl space-y-6">
        <div>
          <h2 className="text-lg font-bold text-white">Redefinir Senha de {userData?.name} 🔐</h2>
          <p className="text-xs text-zinc-400 mt-1 font-mono">
            {userData?.email}
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-medium text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1.5">Digite sua Nova Senha / PIN</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-zinc-400 absolute left-3 top-3" />
              <input
                type="password"
                required
                value={newPin}
                onChange={(e) => setNewPin(e.target.value)}
                placeholder="Digite sua nova senha ou PIN"
                className="w-full bg-zinc-950/70 border border-zinc-800 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1.5">Confirme a Nova Senha / PIN</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-zinc-400 absolute left-3 top-3" />
              <input
                type="password"
                required
                value={confirmPin}
                onChange={(e) => setConfirmPin(e.target.value)}
                placeholder="Confirme a nova senha digitada"
                className="w-full bg-zinc-950/70 border border-zinc-800 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-zinc-950 font-bold text-sm transition-all shadow-lg shadow-amber-500/20 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer mt-2"
          >
            {submitting ? (
              <span>Salvando Nova Senha...</span>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" />
                <span>Salvar Nova Senha e Entrar</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="w-full min-h-screen bg-zinc-950 flex items-center justify-center text-zinc-400 text-sm">Carregando...</div>}>
      <ResetPasswordContent />
    </Suspense>
  );
}
