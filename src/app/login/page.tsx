'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { LogIn, Lock, Mail, UserCheck, KeyRound, HelpCircle } from 'lucide-react';
import { NexumHubLogo } from '@/components/ui/NexumHubLogo';
import { Modal } from '@/components/ui/Modal';
import { GoogleSignInButton } from '@/components/auth/GoogleSignInButton';

export default function LoginPage() {
  const { user, login } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isForgotOpen, setIsForgotOpen] = useState(false);

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

  return (
    <div className="w-full min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-4">
      {/* Brand Header */}
      <div className="flex flex-col items-center text-center mb-8">
        <NexumHubLogo size="xl" className="mb-2" />
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

        {/* Google 1-Click Login */}
        <div className="space-y-3">
          <GoogleSignInButton label="Entrar com o Google" />
          <div className="relative flex items-center justify-center">
            <div className="w-full border-t border-zinc-800" />
            <span className="bg-zinc-900 px-3 text-[11px] text-zinc-500 uppercase tracking-wider font-semibold absolute">
              ou com e-mail
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
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-medium text-zinc-300">Senha / PIN de Acesso</label>
            </div>
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
              <button
                type="button"
                onClick={() => setIsForgotOpen(true)}
                className="text-[11px] text-amber-400 hover:text-amber-300 font-semibold cursor-pointer"
              >
                Esqueci minha senha
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-semibold text-sm transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer mt-2"
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

      {/* Forgot Password Instructions Modal */}
      {isForgotOpen && (
        <Modal
          isOpen={isForgotOpen}
          onClose={() => setIsForgotOpen(false)}
          title="🔑 Esqueci minha Senha"
        >
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3">
              <KeyRound className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div className="text-xs text-zinc-300 leading-relaxed space-y-2">
                <p>
                  Por motivos de segurança financeira, a redefinição de senha é feita através de um <strong className="text-white">Link de Redefinição Pessoal e Temporário</strong>.
                </p>
                <p>
                  Solicite ao administrador da sua conta que gere o seu link no painel Backoffice. Ele enviará a URL de redefinição para você no WhatsApp.
                </p>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setIsForgotOpen(false)}
                className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold cursor-pointer"
              >
                Entendido
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
