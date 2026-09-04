'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CreditCard,
  TrendingUp,
  FileSpreadsheet,
  ArrowUpRight,
  ArrowDownRight,
  Layers,
  Eye,
} from 'lucide-react';

type ShowcaseTab = 'overview' | 'cards' | 'import' | 'networth';

export function DashboardShowcase() {
  const [activeTab, setActiveTab] = useState<ShowcaseTab>('overview');

  return (
    <div className="w-full max-w-5xl mx-auto rounded-3xl bg-zinc-950/90 border border-zinc-800/80 p-3 sm:p-5 shadow-2xl backdrop-blur-xl relative overflow-hidden">
      {/* Background Lighting */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Tabs Selector Header */}
      <div className="flex items-center justify-between gap-2 border-b border-zinc-800/80 pb-3 mb-4 overflow-x-auto no-scrollbar">
        <div className="flex items-center gap-1.5 shrink-0">
          <div className="w-3 h-3 rounded-full bg-rose-500/80" />
          <div className="w-3 h-3 rounded-full bg-amber-500/80" />
          <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
          <span className="text-[11px] font-mono text-zinc-500 ml-2">app.nexumhub.com/dashboard</span>
        </div>

        <div className="flex items-center gap-1 bg-zinc-950 p-1 rounded-2xl border border-zinc-800">
          {[
            { id: 'overview', label: 'Visão Geral', icon: Eye },
            { id: 'cards', label: 'Cartões & Faturas', icon: CreditCard },
            { id: 'import', label: 'Importador (OFX/CSV)', icon: FileSpreadsheet },
            { id: 'networth', label: 'Patrimônio', icon: TrendingUp },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as ShowcaseTab)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'bg-zinc-100 text-zinc-950 shadow-md shadow-zinc-950/40 font-black'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Dynamic Content Area */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className="space-y-4 min-h-[340px]"
        >
          {activeTab === 'overview' && (
            <div className="space-y-4">
              {/* Top Banner Mock */}
              <div className="flex items-center justify-between p-4 rounded-2xl bg-gradient-to-r from-blue-950/60 via-zinc-900 to-indigo-950/40 border border-blue-500/20">
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-blue-300 bg-blue-500/20 px-2 py-0.5 rounded-full border border-blue-500/30">
                    Setembro / 2026
                  </span>
                  <h4 className="text-sm font-black text-white mt-1">Painel Geral de Controle</h4>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-zinc-400 font-semibold block">Saldo Disponível</span>
                  <span className="text-lg font-mono font-black text-emerald-400">R$ 18.450,00</span>
                </div>
              </div>

              {/* Metric Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800">
                  <div className="flex items-center justify-between text-zinc-400 text-xs font-semibold">
                    <span>Receitas do Mês</span>
                    <ArrowUpRight className="w-4 h-4 text-emerald-400" />
                  </div>
                  <p className="text-lg font-mono font-black text-white mt-1">+R$ 21.450,00</p>
                  <span className="text-[10px] text-emerald-400 font-bold">+12% vs mês anterior</span>
                </div>

                <div className="p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800">
                  <div className="flex items-center justify-between text-zinc-400 text-xs font-semibold">
                    <span>Despesas & Consumo</span>
                    <ArrowDownRight className="w-4 h-4 text-rose-400" />
                  </div>
                  <p className="text-lg font-mono font-black text-white mt-1">-R$ 8.920,00</p>
                  <span className="text-[10px] text-zinc-400 font-medium">Faturas + Contas da Casa</span>
                </div>

                <div className="p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800">
                  <div className="flex items-center justify-between text-zinc-400 text-xs font-semibold">
                    <span>Patrimônio Líquido</span>
                    <TrendingUp className="w-4 h-4 text-blue-400" />
                  </div>
                  <p className="text-lg font-mono font-black text-blue-400 mt-1">R$ 842.000,00</p>
                  <span className="text-[10px] text-blue-300 font-bold">Investimentos + Ativos</span>
                </div>
              </div>

              {/* Recent Transactions List */}
              <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-2.5">
                <h5 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">Últimos Lançamentos</h5>
                <div className="space-y-2">
                  {[
                    { desc: 'Salário Tech Lead', cat: 'Salário', amount: '+R$ 20.000,00', color: 'emerald' },
                    { desc: 'MacBook Pro M3 Max (3/10)', cat: 'Compras (Cartão)', amount: '-R$ 600,00', color: 'rose' },
                    { desc: 'Supermercado Gourmet', cat: 'Mercado', amount: '-R$ 850,00', color: 'rose' },
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800/80">
                      <div>
                        <span className="text-xs font-bold text-white block">{item.desc}</span>
                        <span className="text-[10px] text-zinc-400">{item.cat}</span>
                      </div>
                      <span className={`text-xs font-mono font-black ${item.color === 'emerald' ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {item.amount}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'cards' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Card 1 */}
                <div className="p-4 rounded-2xl bg-gradient-to-br from-zinc-950 to-zinc-900 border border-zinc-800 space-y-3 relative overflow-hidden">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] font-extrabold uppercase text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">
                        Cartão Principal
                      </span>
                      <h4 className="text-sm font-black text-white mt-1">Mastercard Ultravioleta Black</h4>
                    </div>
                    <CreditCard className="w-6 h-6 text-purple-400" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-zinc-400 font-semibold">
                      <span>Fatura Atual (Setembro)</span>
                      <span className="text-white font-mono font-bold">R$ 8.320,00</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-zinc-950 overflow-hidden">
                      <div className="w-[65%] h-full bg-purple-500 rounded-full" />
                    </div>
                    <div className="flex justify-between text-[10px] text-zinc-500 pt-1">
                      <span>Limite Utilizado: 65%</span>
                      <span>Vencimento: Dia 10</span>
                    </div>
                  </div>
                </div>

                {/* Card 2 */}
                <div className="p-4 rounded-2xl bg-gradient-to-br from-zinc-950 to-zinc-900 border border-zinc-800 space-y-3 relative overflow-hidden">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] font-extrabold uppercase text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                        Visa Infinite
                      </span>
                      <h4 className="text-sm font-black text-white mt-1">Visa Infinite Itaú</h4>
                    </div>
                    <CreditCard className="w-6 h-6 text-blue-400" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-zinc-400 font-semibold">
                      <span>Fatura Atual (Setembro)</span>
                      <span className="text-white font-mono font-bold">R$ 3.450,00</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-zinc-950 overflow-hidden">
                      <div className="w-[30%] h-full bg-blue-500 rounded-full" />
                    </div>
                    <div className="flex justify-between text-[10px] text-zinc-500 pt-1">
                      <span>Limite Utilizado: 30%</span>
                      <span>Vencimento: Dia 28</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
                    <Layers className="w-5 h-5" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-white">Cronograma de Parcelamentos Ativos</h5>
                    <p className="text-[11px] text-zinc-400">12 compras parceladas totalizando R$ 1.550,00/mês projetados</p>
                  </div>
                </div>
                <span className="text-xs font-black text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-xl border border-emerald-500/20">
                  Sem surpresas
                </span>
              </div>
            </div>
          )}

          {activeTab === 'import' && (
            <div className="p-5 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-4">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                <FileSpreadsheet className="w-6 h-6 text-emerald-400 shrink-0" />
                <div>
                  <h5 className="text-xs font-bold text-emerald-300">Motor de Importação Inteligente</h5>
                  <p className="text-[11px] text-zinc-400">Processa extratos em OFX, CSV e Excel com algoritmo anti-duplicidade determinístico.</p>
                </div>
              </div>

              <div className="border-2 border-dashed border-zinc-800 rounded-2xl p-6 text-center space-y-2 bg-zinc-900/30">
                <FileSpreadsheet className="w-8 h-8 text-zinc-500 mx-auto animate-bounce" />
                <h6 className="text-xs font-bold text-white">Extrato Bancário Processado (OFX Nubank)</h6>
                <div className="flex justify-center gap-2 text-[10px]">
                  <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold">14 novos lançamentos</span>
                  <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-400">3 duplicados ignorados</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'networth' && (
            <div className="p-5 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-400">Evolução de Ativos</span>
                  <h4 className="text-lg font-black text-white mt-0.5">Consolidação de Bens & Investimentos</h4>
                </div>
                <div className="text-right">
                  <span className="text-xs text-zinc-400 block">Patrimônio Líquido</span>
                  <span className="text-xl font-mono font-black text-emerald-400">R$ 842.000,00</span>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {[
                  { label: 'CDB & Emergência', val: 'R$ 56.420,00' },
                  { label: 'Tesouro Direto IPCA', val: 'R$ 47.800,00' },
                  { label: 'Fundos Imobiliários (FIIs)', val: 'R$ 34.500,00' },
                  { label: 'Imóveis Residenc.', val: 'R$ 620.000,00' },
                ].map((item, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800">
                    <span className="text-[10px] text-zinc-400 font-semibold block truncate">{item.label}</span>
                    <span className="text-xs font-mono font-black text-white mt-1 block">{item.val}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
