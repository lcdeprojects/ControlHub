'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { LandingNavbar } from '@/components/landing/LandingNavbar';
import { DashboardShowcase } from '@/components/landing/DashboardShowcase';
import { NexumHubLogo } from '@/components/ui/NexumHubLogo';
import {
  CreditCard,
  FileSpreadsheet,
  Users,
  PieChart,
  TrendingUp,
  ShieldCheck,
  Fingerprint,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Lock,
  Zap,
} from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-zinc-100 selection:text-zinc-950 overflow-x-hidden">
      {/* Top Sticky Navbar */}
      <LandingNavbar />

      {/* Hero Section */}
      <section className="relative pt-12 sm:pt-20 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* Background Radial Glow */}
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="text-center space-y-6 max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs font-bold uppercase tracking-wider shadow-inner"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>Sistema de Inteligência Financeira Pessoal & Familiar</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.1]"
          >
            Domine suas finanças e patrimônio com{' '}
            <span className="bg-gradient-to-r from-zinc-100 via-zinc-300 to-zinc-400 bg-clip-text text-transparent">
              precisão executiva.
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-sm sm:text-lg text-zinc-400 max-w-2xl mx-auto leading-relaxed font-normal"
          >
            Esqueça planilhas manuais e surpresas na fatura do cartão. O NexumHub consolida cartões de crédito, contas bancárias, importações automáticas e orçamento familiar em um único painel inteligente.
          </motion.p>

          {/* Hero CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-2"
          >
            <Link
              href="/register"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-2xl bg-zinc-100 hover:bg-white text-zinc-950 text-sm font-bold shadow-xl shadow-zinc-950/50 border border-white/20 transition-all active:scale-95 cursor-pointer"
            >
              <span>Começar Agora Gratuitamente</span>
              <ArrowRight className="w-4 h-4 text-zinc-950" />
            </Link>

            <Link
              href="/login"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-800 text-sm font-bold transition-all cursor-pointer"
            >
              <span>Acessar Minha Conta</span>
            </Link>
          </motion.div>

          {/* Trust Badges */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="flex flex-wrap items-center justify-center gap-4 text-[11px] text-zinc-400 pt-2 font-medium"
          >
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Sem necessidade de cartão de crédito
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Suporte a Passkeys (Biometria)
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Criptografia de Ponta a Ponta
            </span>
          </motion.div>
        </div>

        {/* Dashboard Showcase Preview */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.4 }}
          className="mt-12 sm:mt-16"
        >
          <DashboardShowcase />
        </motion.div>
      </section>

      {/* Feature Grid Section */}
      <section id="features" className="py-20 bg-zinc-950 border-t border-zinc-900 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <span className="text-xs font-extrabold uppercase tracking-widest text-zinc-300 bg-zinc-900 px-3 py-1 rounded-full border border-zinc-800">
              Arquitetura de Alta Performance
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-white">
              Tudo o que você precisa para assumir o controle total
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400">
              Recursos desenhados com rigor técnico para entregar previsibilidade financeira real.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <div id="cards" className="p-6 rounded-3xl bg-zinc-900/60 border border-zinc-800 hover:border-zinc-700 transition-all space-y-3 group">
              <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                <CreditCard className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white">Projeção Preditiva de Cartões</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Acompanhe o fechamento de faturas, datas de vencimento e parcelamentos futuros com cálculo automático de limite liberado mês a mês.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-6 rounded-3xl bg-zinc-900/60 border border-zinc-800 hover:border-zinc-700 transition-all space-y-3 group">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white">Importação com Anti-Duplicidade</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Suba seus extratos em OFX, CSV ou Excel. O algoritmo determinístico calcula hashes de lançamentos e evita qualquer duplicidade de dado.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-6 rounded-3xl bg-zinc-900/60 border border-zinc-800 hover:border-zinc-700 transition-all space-y-3 group">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white">Gestão Familiar (Household)</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Divida as despesas da casa (aluguel, condomínio, luz, água e mercado) de maneira justa e transparente entre todos os membros da família.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="p-6 rounded-3xl bg-zinc-900/60 border border-zinc-800 hover:border-zinc-700 transition-all space-y-3 group">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                <PieChart className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white">Orçamentos por Categoria</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Defina tetos de gastos mensais e receba alertas visuais antes de estourar o orçamento planejado para cada setor.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="p-6 rounded-3xl bg-zinc-900/60 border border-zinc-800 hover:border-zinc-700 transition-all space-y-3 group">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                <TrendingUp className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white">Consolidação de Patrimônio</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Visualize seus ativos (CDB, Tesouro, FIIs, Ações e Imóveis) vs Obrigações Totais para acompanhar o seu Patrimônio Líquido real.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="p-6 rounded-3xl bg-zinc-900/60 border border-zinc-800 hover:border-zinc-700 transition-all space-y-3 group">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white">Visão Competência vs Caixa</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Alterne em 1 clique entre o modelo por Competência (quando o gasto ocorreu) e Fluxo de Caixa (quando o dinheiro realmente saiu da conta).
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Security & Passkeys Section */}
      <section id="security" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="p-8 sm:p-12 rounded-3xl bg-zinc-900 border border-zinc-800 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-4 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-950 border border-zinc-800 text-zinc-300 text-xs font-bold uppercase tracking-wider">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Segurança de Nível Bancário</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-black text-white">
              Login Biométrico sem Senhas com Passkeys (WebAuthn)
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
              Sua segurança é nossa prioridade máxima. Acesse sua conta usando TouchID, FaceID ou Windows Hello com criptografia assimétrica de chave pública. Sem risco de vazamento de senhas.
            </p>
            <div className="flex flex-wrap items-center gap-4 text-xs font-bold text-zinc-300 pt-2">
              <span className="flex items-center gap-1.5">
                <Fingerprint className="w-4 h-4 text-emerald-400" /> Biometria Nativa
              </span>
              <span className="flex items-center gap-1.5">
                <Lock className="w-4 h-4 text-blue-400" /> Criptografia SHA-256
              </span>
            </div>
          </div>

          <div className="w-full md:w-auto shrink-0 flex items-center justify-center p-6 rounded-2xl bg-zinc-950 border border-zinc-800 shadow-2xl">
            <div className="flex flex-col items-center space-y-3 text-center">
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center animate-pulse">
                <Fingerprint className="w-8 h-8 text-emerald-400" />
              </div>
              <span className="text-xs font-black text-white">Dispositivo Autorizado</span>
              <span className="text-[10px] text-zinc-500 font-mono">WebAuthn / FIDO2 Active</span>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing & Features Included Section */}
      <section id="pricing" className="py-20 max-w-5xl mx-auto px-4 sm:px-6 space-y-8">
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <span className="text-xs font-extrabold uppercase tracking-widest text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
            Plano Único & Acesso Total
          </span>
          <h2 className="text-2xl sm:text-4xl font-black text-white">
            Invista na sua liberdade e clareza financeira
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400">
            Sem taxas escondidas nem pegadinhas. Acesso completo a todas as ferramentas do NexumHub Pro.
          </p>
        </div>

        {/* High-Converting Pricing Card */}
        <div className="relative rounded-3xl bg-zinc-900 border-2 border-emerald-500/40 p-6 sm:p-10 shadow-2xl overflow-hidden">
          {/* Top Promotional Ribbon */}
          <div className="absolute top-4 right-4 sm:top-6 sm:right-6">
            <span className="px-3 py-1 rounded-full bg-emerald-500 text-zinc-950 font-black text-[11px] uppercase tracking-wider shadow-lg shadow-emerald-500/20">
              🔥 Oferta de Lançamento - 33% OFF
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Price Column */}
            <div className="lg:col-span-5 space-y-4 text-center lg:text-left border-b lg:border-b-0 lg:border-r border-zinc-800 pb-6 lg:pb-0 lg:pr-8">
              <span className="text-xs font-extrabold text-zinc-400 uppercase tracking-widest block">
                Plano NexumHub Pro
              </span>

              <div className="space-y-1">
                <div className="flex items-center justify-center lg:justify-start gap-2">
                  <span className="text-base text-zinc-500 line-through font-bold">R$ 29,90</span>
                  <span className="text-xs font-black text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                    Economize R$ 10,00/mês
                  </span>
                </div>
                <div className="flex items-baseline justify-center lg:justify-start gap-1">
                  <span className="text-4xl sm:text-5xl font-black text-white font-mono">R$ 19,90</span>
                  <span className="text-sm font-semibold text-zinc-400">/ mês</span>
                </div>
              </div>

              <p className="text-xs text-zinc-400 leading-relaxed">
                Assinatura mensal recorrente. Cancele a qualquer momento com 1 clique, sem fidelidade nem multas.
              </p>

              <div className="pt-2">
                <Link
                  href="/register"
                  className="w-full inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-2xl bg-zinc-100 hover:bg-white text-zinc-950 text-sm font-black shadow-xl shadow-zinc-950/40 border border-white/20 transition-all active:scale-95 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-zinc-950" />
                  <span>Garantir Oferta por R$ 19,90/mês</span>
                </Link>
              </div>

              <span className="text-[11px] text-zinc-500 block text-center lg:text-left">
                🔒 7 dias de garantia incondicional ou seu dinheiro de volta.
              </span>
            </div>

            {/* Checklist Column */}
            <div className="lg:col-span-7 space-y-4">
              <h3 className="text-sm font-black uppercase tracking-wider text-zinc-300">
                Tudo o que está incluso no NexumHub Pro:
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-zinc-300">
                {[
                  'Contas Bancárias & Carteiras Ilimitadas',
                  'Gestão de Cartões & Limites',
                  'Projeção de Faturas Futuras (12+ meses)',
                  'Importação de Extratos OFX, CSV e Excel',
                  'Filtro Anti-Duplicidade Determinístico',
                  'Divisão de Custos da Casa (Household)',
                  'Planejamento por Envelopes (Budgets)',
                  'Evolução Patrimonial & Investimentos',
                  'Visão Competência vs Fluxo de Caixa',
                  'Login Biométrico sem Senhas (Passkeys)',
                  'Command Palette Global (Cmd + K)',
                  'Atualizações & Suporte Prioritário',
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2 bg-zinc-950/50 p-2 rounded-xl border border-zinc-800/80">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="font-semibold text-zinc-200">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer using Official Logo */}
      <footer className="border-t border-zinc-900 bg-zinc-950 py-8 text-zinc-500 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <Link href="/landing">
            <NexumHubLogo size="sm" showText={true} />
          </Link>

          <div className="flex items-center gap-6 font-medium text-zinc-400">
            <Link href="/login" className="hover:text-white transition-colors">
              Login
            </Link>
            <Link href="/register" className="hover:text-white transition-colors">
              Registrar
            </Link>
            <a href="#features" className="hover:text-white transition-colors">
              Recursos
            </a>
            <a href="#pricing" className="hover:text-white transition-colors">
              Planos
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
