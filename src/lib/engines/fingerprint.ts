/**
 * Requisitos 25 e 26: Sistema Anti-duplicidade determinístico por Fingerprint.
 * 
 * Uma reimportação idêntica gera o mesmo hash -> 0 novas transações.
 * Parcelas diferentes da mesma compra (ex: APPLE 01/10 vs APPLE 02/10)
 * possuem números de parcelas e datas de faturas diferentes -> hashes diferentes, logo NÃO são duplicatas.
 */

export interface FingerprintParams {
  userId: string;
  sourceId?: string; // cardId ou accountId
  transactionDate: string; // YYYY-MM-DD
  normalizedDescription: string;
  amount: number;
  installmentNumber?: number;
  externalId?: string;
}

export function generateTransactionFingerprint(params: FingerprintParams): string {
  const {
    userId,
    sourceId = 'GENERIC',
    transactionDate,
    normalizedDescription,
    amount,
    installmentNumber = 0,
    externalId = '',
  } = params;

  // Normaliza o texto e arredonda o valor para 2 casas
  const cleanDesc = (normalizedDescription || '').trim().toLowerCase().replace(/\s+/g, ' ');
  const cleanAmount = (Math.round(amount * 100) / 100).toFixed(2);
  const cleanDate = transactionDate.slice(0, 10);

  // String canônica única
  const canonicalString = [
    userId,
    sourceId,
    cleanDate,
    cleanDesc,
    cleanAmount,
    installmentNumber.toString(),
    externalId.trim(),
  ].join('|');

  return simpleHash(canonicalString);
}

/**
 * Função de hash rápida e determinística (Fowler-Noll-Vo / Murmur inspired em hexadecimal)
 */
function simpleHash(str: string): string {
  let h1 = 0xdeadbeef ^ 0;
  let h2 = 0x41c6ce57 ^ 0;
  for (let i = 0, ch; i < str.length; i++) {
    ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507);
  h1 ^= Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507);
  h2 ^= Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  
  const part1 = (h1 >>> 0).toString(16).padStart(8, '0');
  const part2 = (h2 >>> 0).toString(16).padStart(8, '0');
  return `fp_${part1}${part2}`;
}
