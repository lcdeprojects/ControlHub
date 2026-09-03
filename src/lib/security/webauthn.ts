import crypto from 'crypto';

/**
 * Utilitário de codificação/decodificação Base64URL conforme especificação W3C WebAuthn
 */
export function bufferToBase64URL(buffer: Buffer | Uint8Array): string {
  return Buffer.from(buffer)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

export function base64URLToBuffer(base64url: string): Buffer {
  let base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  return Buffer.from(base64, 'base64');
}

/**
 * Gera um desafio (challenge) aleatório seguro de 32 bytes em formato Base64URL
 */
export function generateChallenge(): string {
  return bufferToBase64URL(crypto.randomBytes(32));
}

/**
 * Prepara as opções de registro WebAuthn enviadas ao navegador (PublicKeyCredentialCreationOptions)
 */
export function generateRegistrationOptions(userId: string, userName: string, userEmail: string) {
  const challenge = generateChallenge();

  return {
    challenge,
    rp: {
      name: 'ControlHub Financial',
      id: typeof window !== 'undefined' ? window.location.hostname : 'localhost',
    },
    user: {
      id: bufferToBase64URL(Buffer.from(userId)),
      name: userEmail || userName,
      displayName: userName,
    },
    pubKeyCredParams: [
      { alg: -7, type: 'public-key' }, // ES256 (P-256)
      { alg: -257, type: 'public-key' }, // RS256
    ],
    timeout: 60000,
    attestation: 'none' as const,
    authenticatorSelection: {
      authenticatorAttachment: 'platform' as const, // FaceID, TouchID, Windows Hello, Fingerprint
      userVerification: 'required' as const,
      residentKey: 'preferred' as const,
    },
  };
}

/**
 * Prepara as opções de autenticação WebAuthn enviadas ao navegador (PublicKeyCredentialRequestOptions)
 */
export function generateAuthenticationOptions(allowCredentialIds: string[] = []) {
  const challenge = generateChallenge();

  return {
    challenge,
    timeout: 60000,
    userVerification: 'required' as const,
    allowCredentials: allowCredentialIds.map((id) => ({
      id,
      type: 'public-key' as const,
      transports: ['internal' as const],
    })),
  };
}
