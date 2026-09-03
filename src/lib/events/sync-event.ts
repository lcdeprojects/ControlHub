/**
 * Motor de Disparo de Eventos e Broadcast Channel para Sincronização em Tempo Real entre Abas
 */

export const SYNC_EVENT_NAME = 'controlhub:data-changed';
export const BROADCAST_CHANNEL_NAME = 'controlhub_sync_channel';

let channel: BroadcastChannel | null = null;

if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
  try {
    channel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
  } catch (e) {
    console.warn('BroadcastChannel fallback enabled:', e);
  }
}

/**
 * Notifica a aplicação inteira (e todas as outras abas abertas) que os dados mudaram.
 */
export function notifyDataChanged(reason?: string) {
  if (typeof window === 'undefined') return;

  // 1. Disparar evento local
  const event = new CustomEvent(SYNC_EVENT_NAME, { detail: { reason, timestamp: Date.now() } });
  window.dispatchEvent(event);

  // 2. Disparar via BroadcastChannel para outras abas/janelas
  if (channel) {
    try {
      channel.postMessage({ type: SYNC_EVENT_NAME, reason, timestamp: Date.now() });
    } catch (e) {
      console.warn('Error posting to BroadcastChannel:', e);
    }
  }
}

/**
 * Inscreve um callback para escutar atualizações de dados locais e de outras abas.
 */
export function subscribeToDataChanges(callback: (detail?: any) => void): () => void {
  if (typeof window === 'undefined') return () => {};

  const handleLocalEvent = (e: Event) => {
    const custom = e as CustomEvent;
    callback(custom.detail);
  };

  const handleBroadcastMessage = (e: MessageEvent) => {
    if (e.data && e.data.type === SYNC_EVENT_NAME) {
      callback(e.data);
    }
  };

  window.addEventListener(SYNC_EVENT_NAME, handleLocalEvent);

  if (channel) {
    channel.addEventListener('message', handleBroadcastMessage);
  }

  return () => {
    window.removeEventListener(SYNC_EVENT_NAME, handleLocalEvent);
    if (channel) {
      channel.removeEventListener('message', handleBroadcastMessage);
    }
  };
}
