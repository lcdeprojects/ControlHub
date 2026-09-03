interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitMap = new Map<string, RateLimitEntry>();

// Garbage collection periódica a cada 10 minutos para evitar vazamento de memória
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of rateLimitMap.entries()) {
      if (now > entry.resetTime) {
        rateLimitMap.delete(key);
      }
    }
  }, 10 * 60 * 1000);
}

export function getClientIp(request?: Request): string {
  if (!request) return '127.0.0.1';

  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }

  const realIp = request.headers.get('x-real-ip');
  if (realIp) return realIp.trim();

  const cfIp = request.headers.get('cf-connecting-ip');
  if (cfIp) return cfIp.trim();

  return '127.0.0.1';
}

/**
 * Verifica o limite de requisições por chave/IP.
 * @param key Identificador único (ex: `login:192.168.1.1`)
 * @param maxAttempts Máximo de tentativas permitidas na janela (Padrão: 5)
 * @param windowMs Duração da janela em milissegundos (Padrão: 15 minutos = 900.000ms)
 */
export function checkRateLimit(
  key: string,
  maxAttempts = 5,
  windowMs = 15 * 60 * 1000
): { allowed: boolean; remaining: number; resetMs: number } {
  const now = Date.now();
  const entry = rateLimitMap.get(key);

  if (!entry || now > entry.resetTime) {
    // Nova janela
    rateLimitMap.set(key, { count: 1, resetTime: now + windowMs });
    return { allowed: true, remaining: maxAttempts - 1, resetMs: windowMs };
  }

  if (entry.count >= maxAttempts) {
    // Limite excedido
    return {
      allowed: false,
      remaining: 0,
      resetMs: Math.max(0, entry.resetTime - now),
    };
  }

  // Incrementa a contagem de tentativas
  entry.count += 1;
  return {
    allowed: true,
    remaining: maxAttempts - entry.count,
    resetMs: Math.max(0, entry.resetTime - now),
  };
}

/**
 * Reseta o contador para um IP após um login bem-sucedido.
 */
export function clearRateLimit(key: string): void {
  rateLimitMap.delete(key);
}
