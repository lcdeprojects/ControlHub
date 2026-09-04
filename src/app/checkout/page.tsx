'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { NexumHubLogo } from '@/components/ui/NexumHubLogo';
import {
  Zap,
  Check,
  ShieldCheck,
  QrCode,
  CreditCard,
  Sparkles,
  Lock,
  ArrowRight,
  AlertTriangle,
  Clock,
  Star,
} from 'lucide-react';

export default function CheckoutPage() {
  const { user, refreshUser, logout } = useAuth();
  const router = useRouter();

  const [selectedPlan, setSelectedPlan] = useState<'ANNUAL' | 'MONTHLY'>('ANNUAL');
  const [paymentMethod, setPaymentMethod] = useState<'PIX' | 'CARD'>('PIX');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [copiedPix, setCopiedPix] = useState(false);

  // Card form state
  const [cardNumber, setCardNumber] = useState('');
  const [cardHolder, setCardHolder] = useState(user?.name || '');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvc, setCardCvc] = useState('');

  const pixCopyCode = '00020126580014br.gov.bcb.pix0136nexumhub-pagamentos-pix-5529180000000520400005303986540529.905802BR5908NEXUMHUB6009SAO_PAULO62070503***6304E8A2';

  const handleCopyPix = () => {
    navigator.clipboard.writeText(pixCopyCode);
    setCopiedPix(true);
    setTimeout(() => setCopiedPix(false), 3000);
  };

  const handleSimulatePayment = async () => {
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/checkout/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan: selectedPlan === 'ANNUAL' ? 'PRO_ANNUAL' : 'PRO_MONTHLY',
          method: paymentMethod,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setSuccess(true);
        await refreshUser();
        setTimeout(() => {
          router.push('/');
        }, 1800);
      } else {
        setError(data.error || 'Erro ao aprovar pagamento');
      }
    } catch (err: any) {
      setError(err.message || 'Erro de conexão');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans selection:bg-emerald-500/30">
      {/* Top Header Bar */}
      <header className="border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-md sticky top-0 z-50 px-4 py-3.5 sm:px-8 flex items-center justify-between">
        <NexumHubLogo size="md" />
        <div className="flex items-center gap-3">
          {user && (
            <span className="text-xs text-zinc-400 font-medium hidden sm:inline">
              Conectado como <strong className="text-white">{user.email}</strong>
            </span>
          )}
          {user && (
            <button
              onClick={() => logout()}
              className="text-xs font-semibold text-zinc-400 hover:text-white px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 transition-colors cursor-pointer"
            >
              Sair
            </button>
          )}
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-8 sm:py-12 space-y-8">
        {/* Banner Status Alert */}
        <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-rose-500/10 to-emerald-500/10 border border-amber-500/30 text-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                Seu teste grátis de 7 dias expirou!
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                Para reativar seu acesso completo ao NexumHub e continuar gerenciando suas finanças, escolha um plano abaixo.
              </p>
            </div>
          </div>
          <Badge variant="danger" className="shrink-0 px-3 py-1 bg-rose-500/20 text-rose-300 border-rose-500/40 font-bold text-xs">
            <Clock className="w-3.5 h-3.5" />
            ACESSO BLOQUEADO
          </Badge>
        </div>

        {/* Hero Headline */}
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Desbloqueie o <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">NexumHub PRO</span>
          </h1>
          <p className="text-sm text-zinc-400">
            Controle total de contas, cartões de crédito, parcelamentos e relatórios em tempo real sem limitações.
          </p>
        </div>

        {/* Plan Selector Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Plano Anual */}
          <div
            onClick={() => setSelectedPlan('ANNUAL')}
            className={`relative p-6 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between space-y-6 ${
              selectedPlan === 'ANNUAL'
                ? 'bg-zinc-900/90 border-emerald-500 shadow-xl shadow-emerald-500/10'
                : 'bg-zinc-900/40 border-zinc-800 hover:border-zinc-700'
            }`}
          >
            <div className="absolute -top-3 right-6 px-3 py-0.5 rounded-full bg-gradient-to-r from-emerald-500 to-cyan-500 text-zinc-950 font-black text-[10px] uppercase tracking-wider shadow-md">
              🔥 Mais Popular (Economize 30%)
            </div>

            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">Plano Pro Anual</span>
                <input
                  type="radio"
                  checked={selectedPlan === 'ANNUAL'}
                  onChange={() => setSelectedPlan('ANNUAL')}
                  className="w-4 h-4 text-emerald-500 focus:ring-emerald-500 cursor-pointer"
                />
              </div>

              <div className="mt-3 flex items-baseline gap-1">
                <span className="text-3xl sm:text-4xl font-black text-white">R$ 24,90</span>
                <span className="text-xs text-zinc-400 font-medium">/mês</span>
              </div>
              <p className="text-xs text-zinc-400 mt-1 font-mono">Cobrado R$ 298,80 por ano</p>

              <ul className="mt-6 space-y-2.5 text-xs text-zinc-300">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Acesso ilimitado a todas as contas e cartões</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Importação inteligente de extratos bancários</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Relatórios em tempo real e extrato mensal</span>
                </li>
                <li className="flex items-center gap-2 font-semibold text-emerald-400">
                  <Star className="w-4 h-4 shrink-0" />
                  <span>Garantia de 7 dias com reembolso total</span>
                </li>
              </ul>
            </div>

            <div className="pt-4 border-t border-zinc-800 text-center">
              <span className="text-xs font-bold text-emerald-400">Desconto exclusivo aplicado</span>
            </div>
          </div>

          {/* Plano Mensal */}
          <div
            onClick={() => setSelectedPlan('MONTHLY')}
            className={`relative p-6 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between space-y-6 ${
              selectedPlan === 'MONTHLY'
                ? 'bg-zinc-900/90 border-emerald-500 shadow-xl shadow-emerald-500/10'
                : 'bg-zinc-900/40 border-zinc-800 hover:border-zinc-700'
            }`}
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">Plano Pro Mensal</span>
                <input
                  type="radio"
                  checked={selectedPlan === 'MONTHLY'}
                  onChange={() => setSelectedPlan('MONTHLY')}
                  className="w-4 h-4 text-emerald-500 focus:ring-emerald-500 cursor-pointer"
                />
              </div>

              <div className="mt-3 flex items-baseline gap-1">
                <span className="text-3xl sm:text-4xl font-black text-white">R$ 34,90</span>
                <span className="text-xs text-zinc-400 font-medium">/mês</span>
              </div>
              <p className="text-xs text-zinc-400 mt-1 font-mono">Cobrado mensalmente (cancele quando quiser)</p>

              <ul className="mt-6 space-y-2.5 text-xs text-zinc-300">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Acesso ilimitado a todas as contas e cartões</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Importação inteligente de extratos bancários</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Relatórios em tempo real e extrato mensal</span>
                </li>
              </ul>
            </div>

            <div className="pt-4 border-t border-zinc-800 text-center">
              <span className="text-xs font-medium text-zinc-400">Sem fidelidade</span>
            </div>
          </div>
        </div>

        {/* Payment Box */}
        <Card className="p-6 sm:p-8 bg-zinc-900/80 border-zinc-800 space-y-6 shadow-2xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-4">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Lock className="w-5 h-5 text-emerald-400" />
                Forma de Pagamento Segura
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                Escolha PIX para liberação imediata ou Cartão de Crédito
              </p>
            </div>

            {/* Payment Method Switcher */}
            <div className="flex items-center gap-2 p-1 bg-zinc-950 rounded-xl border border-zinc-800">
              <button
                type="button"
                onClick={() => setPaymentMethod('PIX')}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  paymentMethod === 'PIX'
                    ? 'bg-emerald-500 text-zinc-950 shadow-md'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <QrCode className="w-4 h-4" />
                <span>PIX Instantâneo</span>
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod('CARD')}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  paymentMethod === 'CARD'
                    ? 'bg-emerald-500 text-zinc-950 shadow-md'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <CreditCard className="w-4 h-4" />
                <span>Cartão de Crédito</span>
              </button>
            </div>
          </div>

          {error && (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-semibold">
              ⚠️ {error}
            </div>
          )}

          {success ? (
            <div className="p-8 rounded-2xl bg-emerald-500/10 border border-emerald-500/40 text-center space-y-4 animate-in fade-in zoom-in duration-300">
              <div className="w-16 h-16 rounded-full bg-emerald-500 text-zinc-950 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/30">
                <Check className="w-8 h-8 stroke-[3]" />
              </div>
              <div>
                <h3 className="text-xl font-black text-white">🎉 Pagamento Confirmado!</h3>
                <p className="text-sm text-emerald-400 mt-1 font-medium">
                  Seu plano NexumHub PRO foi ativado com sucesso. Redirecionando para o sistema...
                </p>
              </div>
            </div>
          ) : paymentMethod === 'PIX' ? (
            /* PIX Payment Content */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
              <div className="flex flex-col items-center justify-center p-6 bg-zinc-950 rounded-2xl border border-zinc-800 text-center space-y-3">
                <div className="p-3 bg-white rounded-2xl shadow-inner">
                  <div className="w-40 h-40 bg-zinc-900 rounded-xl flex items-center justify-center text-zinc-500 text-xs font-mono border border-zinc-800 p-2">
                    <QrCode className="w-32 h-32 text-zinc-950" />
                  </div>
                </div>
                <span className="text-[11px] text-zinc-400 font-medium">
                  Escaneie com o app do seu banco para pagar instantaneamente
                </span>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-300">Código PIX Copia e Cola:</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={pixCopyCode}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs font-mono text-zinc-400 select-all"
                    />
                    <button
                      type="button"
                      onClick={handleCopyPix}
                      className="px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs shrink-0 cursor-pointer border border-zinc-700 transition-colors"
                    >
                      {copiedPix ? 'Copiado!' : 'Copiar'}
                    </button>
                  </div>
                </div>

                <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
                    <Sparkles className="w-4 h-4" />
                    <span>Confirmação Instantânea</span>
                  </div>
                  <p className="text-xs text-zinc-300 leading-relaxed">
                    Após efetuar o pagamento pelo app do seu banco, clique no botão abaixo para concluir a liberação do seu acesso.
                  </p>

                  <button
                    type="button"
                    onClick={handleSimulatePayment}
                    disabled={loading}
                    className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-zinc-950 font-extrabold text-sm shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                  >
                    <Zap className="w-4 h-4 fill-zinc-950" />
                    <span>{loading ? 'Aprovando Pagamento...' : '⚡ Confirmar / Simular Pagamento PIX'}</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* Card Payment Content */
            <div className="space-y-4 max-w-lg mx-auto">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">Número do Cartão</label>
                <input
                  type="text"
                  placeholder="0000 0000 0000 0000"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm font-mono text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">Nome do Titular (Como no cartão)</label>
                <input
                  type="text"
                  placeholder="CARLOS SILVA"
                  value={cardHolder}
                  onChange={(e) => setCardHolder(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 uppercase"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1.5">Validade (MM/AA)</label>
                  <input
                    type="text"
                    placeholder="12/28"
                    value={cardExpiry}
                    onChange={(e) => setCardExpiry(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm font-mono text-white focus:outline-none focus:border-emerald-500 text-center"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1.5">Código CVC</label>
                  <input
                    type="text"
                    placeholder="123"
                    value={cardCvc}
                    onChange={(e) => setCardCvc(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm font-mono text-white focus:outline-none focus:border-emerald-500 text-center"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={handleSimulatePayment}
                disabled={loading}
                className="w-full mt-4 py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-zinc-950 font-extrabold text-sm shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
              >
                <CreditCard className="w-4 h-4" />
                <span>{loading ? 'Processando Cartão...' : '💳 Pagar e Liberar Acesso Agora'}</span>
              </button>
            </div>
          )}

          {/* Guarantee footer */}
          <div className="flex items-center justify-center gap-6 pt-2 text-[11px] text-zinc-400 font-medium">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Pagamento 100% Criptografado
            </span>
            <span className="flex items-center gap-1">
              <Lock className="w-4 h-4 text-cyan-400" />
              Acesso Liberado Na Hora
            </span>
          </div>
        </Card>
      </main>
    </div>
  );
}
