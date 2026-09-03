'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Menu, X, Sparkles } from 'lucide-react';
import { ControlHubLogo } from '@/components/ui/ControlHubLogo';

export function LandingNavbar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-zinc-800/80 bg-zinc-950/90 backdrop-blur-xl transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Official Brand Logo */}
        <Link href="/landing">
          <ControlHubLogo size="md" showText={true} />
        </Link>

        {/* Desktop Nav Links */}
        <nav className="hidden md:flex items-center gap-8 text-xs font-semibold text-zinc-300">
          <a href="#features" className="hover:text-white transition-colors">
            Recursos
          </a>
          <a href="#cards" className="hover:text-white transition-colors">
            Cartões & Faturas
          </a>
          <a href="#security" className="hover:text-white transition-colors">
            Segurança & Passkeys
          </a>
          <a href="#pricing" className="hover:text-white transition-colors">
            Diferenciais
          </a>
        </nav>

        {/* Action Buttons using System Theme */}
        <div className="hidden md:flex items-center gap-3">
          <Link
            href="/login"
            className="px-4 py-2 rounded-xl text-xs font-bold text-zinc-300 hover:text-white hover:bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition-all"
          >
            Entrar
          </Link>
          <Link
            href="/register"
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-100 hover:bg-white text-zinc-950 text-xs font-bold shadow-lg shadow-zinc-950/40 border border-white/20 transition-all active:scale-95 cursor-pointer"
          >
            <span>Começar Agora</span>
            <ArrowRight className="w-3.5 h-3.5 text-zinc-950" />
          </Link>
        </div>

        {/* Mobile Hamburger Button */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors cursor-pointer"
          aria-label="Alternar Menu"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Dropdown Menu */}
      {mobileOpen && (
        <div className="md:hidden border-b border-zinc-800 bg-zinc-950 px-4 pt-3 pb-6 space-y-4 animate-in fade-in slide-in-from-top-2">
          <nav className="flex flex-col space-y-3 text-sm font-semibold text-zinc-300">
            <a
              href="#features"
              onClick={() => setMobileOpen(false)}
              className="px-2 py-1.5 rounded-lg hover:bg-zinc-900 hover:text-white"
            >
              Recursos Principais
            </a>
            <a
              href="#cards"
              onClick={() => setMobileOpen(false)}
              className="px-2 py-1.5 rounded-lg hover:bg-zinc-900 hover:text-white"
            >
              Cartões & Projeções
            </a>
            <a
              href="#security"
              onClick={() => setMobileOpen(false)}
              className="px-2 py-1.5 rounded-lg hover:bg-zinc-900 hover:text-white"
            >
              Segurança & Biometria
            </a>
            <a
              href="#pricing"
              onClick={() => setMobileOpen(false)}
              className="px-2 py-1.5 rounded-lg hover:bg-zinc-900 hover:text-white"
            >
              Diferenciais Executivos
            </a>
          </nav>

          <div className="pt-2 border-t border-zinc-900 flex flex-col gap-2">
            <Link
              href="/login"
              onClick={() => setMobileOpen(false)}
              className="w-full text-center py-2.5 rounded-xl text-xs font-bold text-zinc-200 bg-zinc-900 border border-zinc-800"
            >
              Fazer Login
            </Link>
            <Link
              href="/register"
              onClick={() => setMobileOpen(false)}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-zinc-100 text-zinc-950 text-xs font-bold shadow-lg shadow-zinc-950/40"
            >
              <Sparkles className="w-4 h-4 text-zinc-950" />
              <span>Começar Agora Gratuitamente</span>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
