'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { subscribeToDataChanges, notifyDataChanged } from '@/lib/events/sync-event';

interface UseBackgroundSyncOptions {
  onSync?: () => Promise<void> | void;
  intervalMs?: number; // Padrão: 45.000ms (45 segundos)
  enabled?: boolean;
}

export function useBackgroundSync({
  onSync,
  intervalMs = 45000,
  enabled = true,
}: UseBackgroundSyncOptions = {}) {
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date>(new Date());
  const isSyncingRef = useRef(false);

  const triggerSync = useCallback(
    async (reason?: string) => {
      if (!enabled || isSyncingRef.current) return;
      if (typeof window === 'undefined') return;

      isSyncingRef.current = true;
      setIsSyncing(true);

      try {
        if (onSync) {
          await onSync();
        }
        setLastSyncTime(new Date());
      } catch (err) {
        console.warn('[BackgroundSync] Error during auto-sync:', err);
      } finally {
        isSyncingRef.current = false;
        setIsSyncing(false);
      }
    },
    [enabled, onSync]
  );

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return;

    // 1. Escutar trocas de abas (Voltar para o App)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        triggerSync('visibility_change');
      }
    };

    // 2. Escutar foco na janela
    const handleFocus = () => {
      triggerSync('window_focus');
    };

    // 3. Escutar alterações em outras abas
    const unsubscribeBroadcast = subscribeToDataChanges((detail) => {
      triggerSync(detail?.reason || 'broadcast_sync');
    });

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    // 4. Intervalo periódico de sincronização em segundo plano
    const timer = setInterval(() => {
      if (document.visibilityState === 'visible') {
        triggerSync('periodic_heartbeat');
      }
    }, intervalMs);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      unsubscribeBroadcast();
      clearInterval(timer);
    };
  }, [enabled, intervalMs, triggerSync]);

  return {
    isSyncing,
    lastSyncTime,
    triggerSync,
    notifyChange: notifyDataChanged,
  };
}
