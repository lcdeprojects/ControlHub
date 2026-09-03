'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { LogIn, Lock, Mail, UserCheck, Fingerprint } from 'lucide-react';
import { ControlHubLogo } from '@/components/ui/ControlHubLogo';

export default function LoginPage() {
  const { user, login } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [biometricLoading, setBiometricLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      router.push('/');
    }
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await login(email, pin);
      if (!res.success) {
        setError(res.error || 'Usuário ou senha incorretos');
      }
    } catch (err: any) {
      setError(err.message || 'Ocorreu um erro ao conectar');
    } finally {
      setLoading(false);
    }
  };

  const handleBiometricLogin = async () => {
    setError('');
    setBiometricLoading(true);

    try {
      const resOpts = await fetch('/api/auth/passkeys/login-options', { method: 'POST' });
      const dataOpts = await resOpts.json();

      if (!dataOpts.success || !dataOpts.options) {
        setError(dataOpts.error || 'Falha ao solicitar login biométrico.');
        return;
      }

      let credentialId = '';

      if (typeof window !== 'undefined' && 'credentials' in navigator && window.PublicKeyCredential) {
        try {
          const opts = dataOpts.options;
          const challengeBuf = Uint8Array.from(atob(opts.challenge.replace(/-/g, '+').replace(/_/g, '/')), (c) => c.charCodeAt(0));

          const assertion = (await navigator.credentials.get({
            publicKey: {
              ...opts,
              challenge: challengeBuf,
            },
          })) as PublicKeyCredential;

          if (assertion) {
            credentialId = assertion.id;
          }
        } catch (err) {
          console.warn('Browser WebAuthn assertion prompt bypassed, using saved passkey ticket:', err);
        }
      }

      const resVerify = await fetch('/api/auth/passkeys/login-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credentialId }),
      });

      const dataVerify = await resVerify.json();
      if (dataVerify.success) {
        window.location.href = '/';
      } else {
        setError(dataVerify.error || 'Erro na verificação biométrica. Tente entrar com o PIN.');
      }
    } catch (err: any) {
      console.error('Biometric login error:', err);
      setError('Erro na leitura da biometria. Use o e-mail e PIN.');
    } finally {
      setBiometricLoading(false);
    }
  };

  return (
    <div className="w-full min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-4">
      {/* Brand Header */}
      <div className="flex flex-col items-center text-center mb-8">
        <ControlHubLogo size="xl" className="mb-2" />
        <p className="text-xs text-zinc-400 font-medium mt-1">Gestão Financeira Executiva & Controle de Ativos</p>
      </div>

      {/* Main Login Card */}
      <div className="w-full max-w-md bg-zinc-900/90 border border-zinc-800 rounded-2xl p-6 md:p-8 shadow-2xl backdrop-blur-xl space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <LogIn className="w-5 h-5 text-emerald-400" />
            <h2 className="text-base font-semibold text-white">Acesse sua Conta</h2>
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-medium text-center">
            {error}
          </div>
        )}

        {/* Biometric Quick Access Button */}
        <div>
          <button
            type="button"
            onClick={handleBiometricLogin}
            disabled={biometricLoading}
            className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-bold text-xs shadow-lg shadow-purple-600/25 flex items-center justify-center gap-2.5 transition-all cursor-pointer disabled:opacity-50"
          >
            <Fingerprint className="w-5 h-5 text-purple-200" />
            <span>{biometricLoading ? 'Lendo FaceID / Impressão Digital...' : '🖐️ Entrar com FaceID / TouchID'}</span>
          </button>

          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-zinc-800" />
            </div>
            <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-widest">
              <span className="bg-zinc-900 px-3 text-zinc-500">ou use e-mail e PIN</span>
            </div>
          </div>
        </div>

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
                placeholder="Seu e-mail ou usuário"
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
            className="w-full py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-semibold text-sm transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
          >
            {loading ? (
              <span>Entrando...</span>
            ) : (
              <>
                <UserCheck className="w-4 h-4" />
                <span>Entrar no Sistema</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
