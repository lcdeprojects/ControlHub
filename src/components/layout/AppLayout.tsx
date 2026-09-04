'use client';

import React, { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { MobileNav } from '@/components/layout/MobileNav';
import { useAuth } from '@/contexts/AuthContext';
import { isSubscriptionExpired } from '@/lib/subscription';
import { ShieldCheck, AlertTriangle } from 'lucide-react';

const PUBLIC_PATHS = ['/login', '/register', '/reset-password', '/landing', '/checkout'];

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading } = useAuth();

  const isPublicPage = PUBLIC_PATHS.some(
    (path) => pathname === path || pathname.startsWith(path + '/')
  );

  const isExpired = isSubscriptionExpired(user);

  useEffect(() => {
    if (!loading) {
      if (!user && !isPublicPage) {
        router.push('/landing');
      } else if (user && (pathname === '/login' || pathname === '/landing')) {
        if (isExpired) {
          router.push('/checkout');
        } else {
          router.push('/');
        }
      } else if (user && isExpired && pathname !== '/checkout') {
        // Redireciona usuário com teste/assinatura expirada para a tela de checkout
        router.push('/checkout');
      } else if (user && pathname === '/admin' && user.role !== 'ADMIN') {
        router.push('/');
      }
    }
  }, [user, loading, isPublicPage, isExpired, pathname, router]);

  if (loading) {
    return (
      <div className="w-full min-h-screen bg-zinc-950 flex flex-col items-center justify-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center animate-pulse">
          <ShieldCheck className="w-5 h-5 text-emerald-400" />
        </div>
        <p className="text-xs text-zinc-400 font-medium">Verificando autenticação...</p>
      </div>
    );
  }

  if (user && (pathname === '/login' || pathname === '/landing')) {
    return (
      <div className="w-full min-h-screen bg-zinc-950 flex flex-col items-center justify-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center animate-pulse">
          <ShieldCheck className="w-5 h-5 text-emerald-400" />
        </div>
        <p className="text-xs text-zinc-400 font-medium">Redirecionando...</p>
      </div>
    );
  }

  if (isPublicPage) {
    return (
      <div className="w-full min-h-screen bg-zinc-950 text-zinc-100">
        {children}
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (isExpired && pathname !== '/checkout') {
    return (
      <div className="w-full min-h-screen bg-zinc-950 flex flex-col items-center justify-center gap-3 p-6 text-center">
        <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center animate-bounce">
          <AlertTriangle className="w-6 h-6 text-rose-400" />
        </div>
        <h2 className="text-lg font-bold text-white">Período de Teste Expirado</h2>
        <p className="text-xs text-zinc-400 max-w-sm">
          Redirecionando você para a página de assinaturas e pagamento...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex w-full">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 pb-20 lg:pb-8">
        <Header />
        <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-7xl w-full mx-auto font-sans">
          {children}
        </main>
      </div>
      <MobileNav />
    </div>
  );
}

