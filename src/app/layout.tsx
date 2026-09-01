import type { Metadata } from 'next';
import './globals.css';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { MobileNav } from '@/components/layout/MobileNav';
import { PeriodProvider } from '@/contexts/PeriodContext';

export const metadata: Metadata = {
  title: 'ControlHub — Gestão Financeira Pessoal & Cartões de Crédito',
  description: 'Sistema completo e inteligente de controle financeiro, faturas, parcelamentos, patrimônio e importações.',
  icons: {
    icon: [
      { url: '/icon.svg', type: 'image/svg+xml' },
      { url: '/logo.png', type: 'image/png' },
    ],
    shortcut: '/logo.png',
    apple: '/logo.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="dark">
      <body className="bg-slate-950 text-slate-100 min-h-screen flex">
        <PeriodProvider>
          {/* Desktop Sidebar */}
          <Sidebar />

          {/* Main Content Area */}
          <div className="flex-1 flex flex-col min-w-0 pb-20 lg:pb-8">
            <Header />
            <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-7xl w-full mx-auto">
              {children}
            </main>
          </div>

          {/* Mobile Navigation */}
          <MobileNav />
        </PeriodProvider>
      </body>
    </html>
  );
}
