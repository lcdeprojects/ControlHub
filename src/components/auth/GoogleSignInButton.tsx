'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { isSubscriptionExpired } from '@/lib/subscription';

declare global {
  interface Window {
    google?: any;
  }
}

interface GoogleSignInButtonProps {
  label?: string;
  className?: string;
}

export function GoogleSignInButton({ label = 'Continuar com o Google', className }: GoogleSignInButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const buttonRef = useRef<HTMLDivElement>(null);
  const { refreshUser } = useAuth();
  const router = useRouter();

  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '190696727818-mneqcnp62grouu4349l84qesuggtkneb.apps.googleusercontent.com';

  const handleCredentialResponse = async (response: any) => {
    if (!response || !response.credential) return;
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential: response.credential }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || 'Erro ao autenticar com o Google');
        setLoading(false);
        return;
      }

      await refreshUser();
      if (isSubscriptionExpired(data.user)) {
        router.push('/checkout');
      } else {
        router.push('/');
      }
    } catch (err: any) {
      console.error('Google login client error:', err);
      setError('Falha de conexão com o servidor do Google');
      setLoading(false);
    }
  };

  useEffect(() => {
    // Carregar o SDK do Google se ainda não tiver sido carregado
    if (typeof window === 'undefined') return;

    const initializeGoogle = () => {
      if (window.google?.accounts?.id) {
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: handleCredentialResponse,
        });

        if (buttonRef.current) {
          buttonRef.current.innerHTML = '';
          window.google.accounts.id.renderButton(buttonRef.current, {
            theme: 'filled_black',
            size: 'large',
            text: 'continue_with',
            shape: 'pill',
            width: '100%',
            locale: 'pt_BR',
          });
        }
      }
    };

    if (window.google?.accounts?.id) {
      initializeGoogle();
    } else {
      const existingScript = document.getElementById('google-gsi-script');
      if (!existingScript) {
        const script = document.createElement('script');
        script.id = 'google-gsi-script';
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.defer = true;
        script.onload = initializeGoogle;
        document.body.appendChild(script);
      } else {
        existingScript.addEventListener('load', initializeGoogle);
      }
    }
  }, [clientId]);

  return (
    <div className="w-full flex flex-col items-center gap-2">
      {error && (
        <div className="w-full p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold text-center">
          {error}
        </div>
      )}

      {loading ? (
        <div className="w-full py-3 rounded-2xl bg-zinc-900 border border-zinc-800 text-xs font-bold text-zinc-300 flex items-center justify-center gap-2 animate-pulse">
          <div className="w-4 h-4 rounded-full border-2 border-emerald-400 border-t-transparent animate-spin" />
          <span>Conectando com o Google...</span>
        </div>
      ) : (
        <div className="w-full flex justify-center min-h-[44px]">
          <div ref={buttonRef} className="w-full flex justify-center" />
        </div>
      )}
    </div>
  );
}
