import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // 96-bit IV para AES-GCM
const SALT = 'nexumhub_aes256_salt_v1';

function getEncryptionKey(): Buffer {
  const secret = process.env.ENCRYPTION_SECRET || 'nexumhub_default_secret_key_change_in_prod';
  return crypto.scryptSync(secret, SALT, 32);
}

/**
 * Criptografa um valor de texto ou número utilizando AES-256-GCM.
 * Formato retornado: `enc:v1:<iv_hex>:<authTag_hex>:<encrypted_hex>`
 */
export function encryptValue(plainText: string | number | null | undefined): string {
  if (plainText === null || plainText === undefined || plainText === '') {
    return '';
  }

  const strToEncrypt = String(plainText);
  if (isEncrypted(strToEncrypt)) {
    return strToEncrypt; // Já está criptografado
  }

  try {
    const key = getEncryptionKey();
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    let encrypted = cipher.update(strToEncrypt, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag().toString('hex');

    return `enc:v1:${iv.toString('hex')}:${authTag}:${encrypted}`;
  } catch (err) {
    console.error('Encryption error:', err);
    return strToEncrypt;
  }
}

/**
 * Descriptografa uma string cifrada no formato `enc:v1:<iv>:<authTag>:<encrypted>`
 * Se a string não for cifrada, retorna o próprio texto sem alterações (transparência retroativa).
 */
export function decryptValue(encryptedStr: string | null | undefined): string {
  if (!encryptedStr || typeof encryptedStr !== 'string') {
    return '';
  }

  if (!isEncrypted(encryptedStr)) {
    return encryptedStr; // Dado não criptografado (legado), retorna texto puro
  }

  try {
    const parts = encryptedStr.split(':');
    if (parts.length !== 5 || parts[0] !== 'enc' || parts[1] !== 'v1') {
      return encryptedStr;
    }

    const iv = Buffer.from(parts[2], 'hex');
    const authTag = Buffer.from(parts[3], 'hex');
    const cipherText = parts[4];
    const key = getEncryptionKey();

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(cipherText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (err) {
    console.error('Decryption error:', err);
    return encryptedStr;
  }
}

/**
 * Verifica se a string está no formato cifrado `enc:v1:...`
 */
export function isEncrypted(value: string | null | undefined): boolean {
  if (!value || typeof value !== 'string') return false;
  return value.startsWith('enc:v1:');
}
