import type { Metadata, Viewport } from 'next';
import './globals.css';
import { PeriodProvider } from '@/contexts/PeriodContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { AppLayout } from '@/components/layout/AppLayout';

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

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="dark">
      <body className="bg-zinc-950 text-zinc-100 min-h-screen flex">
        <AuthProvider>
          <PeriodProvider>
            <AppLayout>{children}</AppLayout>
          </PeriodProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
