/**
 * Helper client-safe para verificar se a assinatura do usuário expirou
 */
export function isSubscriptionExpired(user?: {
  role?: string | null;
  subscriptionStatus?: string | null;
  trialEndsAt?: string | null;
} | null): boolean {
  if (!user) return false;
  if (user.role === 'ADMIN') return false; // Admin nunca expira
  if (user.subscriptionStatus === 'ACTIVE') return false;
  if (user.subscriptionStatus === 'EXPIRED' || user.subscriptionStatus === 'CANCELLED') return true;

  // Se o status for TRIAL ou indefinido, verifica data limite do trialEndsAt
  if (user.trialEndsAt) {
    const trialEnd = new Date(user.trialEndsAt).getTime();
    const now = Date.now();
    if (trialEnd <= now) {
      return true;
    }
  }

  return false;
}
