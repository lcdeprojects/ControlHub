'use client';

import React, { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { MobileNav } from '@/components/layout/MobileNav';
import { useAuth } from '@/contexts/AuthContext';
import { ShieldCheck } from 'lucide-react';

const PUBLIC_PATHS = ['/login', '/register', '/reset-password'];

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading } = useAuth();

  const isPublicPage = PUBLIC_PATHS.some(
    (path) => pathname === path || pathname.startsWith(path + '/')
  );

  useEffect(() => {
    if (!loading) {
      if (!user && !isPublicPage) {
        router.push('/login');
      } else if (user && pathname === '/login') {
        router.push('/');
      } else if (user && pathname === '/admin' && user.role !== 'ADMIN') {
        router.push('/');
      }
    }
  }, [user, loading, isPublicPage, pathname, router]);

  if (isPublicPage) {
    return (
      <div className="w-full min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center">
        {children}
      </div>
    );
  }

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

  if (!user) {
    return null;
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
