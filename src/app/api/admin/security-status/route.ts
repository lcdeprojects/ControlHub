import { NextResponse } from 'next/server';
import { encryptValue, decryptValue, isEncrypted } from '@/lib/engines/encryption';
import { checkRateLimit, clearRateLimit } from '@/lib/security/rate-limiter';
import { getAuthUserId } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const userId = await getAuthUserId(request);

    // 1. Cifragem Teste AES-256-GCM
    const testValue = `saldo_secreto_R$_${Date.now()}`;
    const encrypted = encryptValue(testValue);
    const decrypted = decryptValue(encrypted);
    const cryptoTestPassed = isEncrypted(encrypted) && decrypted === testValue;
    const isCustomSecretSet = Boolean(process.env.ENCRYPTION_SECRET && process.env.ENCRYPTION_SECRET.length >= 16);

    // 2. Teste do Rate Limiter
    const testKey = `test_rate_limit_${Date.now()}`;
    const rl1 = checkRateLimit(testKey, 2, 60000);
    const rl2 = checkRateLimit(testKey, 2, 60000);
    const rl3 = checkRateLimit(testKey, 2, 60000); // Deve ser bloqueado
    const rateLimiterPassed = rl1.allowed && rl2.allowed && !rl3.allowed;
    clearRateLimit(testKey);

    const isAllHealthy = cryptoTestPassed && rateLimiterPassed;

    return NextResponse.json({
      success: true,
      status: isAllHealthy ? 'HEALTHY' : 'UNHEALTHY',
      security: {
        encryption: {
          algorithm: 'AES-256-GCM',
          keySizeBits: 256,
          authTagSizeBits: 128,
          isCustomSecretSet,
          testStatus: cryptoTestPassed ? 'PASSED' : 'FAILED',
        },
        protection: {
          rateLimiter: rateLimiterPassed ? 'ACTIVE (Sliding Window)' : 'INACTIVE',
          bruteForceWindowMinutes: 15,
          maxAttemptsBeforeBlock: 5,
          cookiePolicy: {
            httpOnly: true,
            sameSite: 'strict',
            path: '/',
            secure: process.env.NODE_ENV === 'production',
          },
        },
      },
    });
  } catch (error) {
    console.error('Security healthcheck error:', error);
    return NextResponse.json(
      {
        success: false,
        status: 'UNHEALTHY',
        error: String(error),
      },
      { status: 500 }
    );
  }
}
