import { NormalizedMerchantResult, MatchScoreResult } from '../types';

/**
 * Requisito 22: Normalização de descrições bancárias e extração de parcelas.
 * Ex: "APPLE STORE 01/10" -> Merchant: "APPLE STORE", parcela 1 de 10.
 * Ex: "MAGAZINE LUIZA PARC 04/10" -> Merchant: "MAGAZINE LUIZA", parcela 4 de 10.
 */
export function normalizeTransactionDescription(rawDescription: string): NormalizedMerchantResult {
  if (!rawDescription) {
    return {
      rawDescription: '',
      normalizedDescription: '',
      merchantName: '',
      isInstallmentPattern: false,
    };
  }

  const raw = rawDescription.trim().toUpperCase();

  // Expressões regulares para padrões comuns em faturas brasileiras:
  // "ESTABELECIMENTO 01/10", "ESTAB (02/10)", "ESTAB PARC 03/12", "ESTAB - PARCELA 4/10"
  const installmentRegexes = [
    /(?:PARC(?:ELA)?[\s\.-]*)?(\d{1,2})\s*[\/|\\]\s*(\d{1,2})/i,
    /\((\d{1,2})\s*[\/|\\]\s*(\d{1,2})\)/i,
    /PARC(?:ELA)?\s*(\d{1,2})\s*DE\s*(\d{1,2})/i,
  ];

  let currentInstallment: number | undefined;
  let totalInstallments: number | undefined;
  let isInstallmentPattern = false;
  let cleanName = raw;

  for (const regex of installmentRegexes) {
    const match = cleanName.match(regex);
    if (match) {
      const cur = parseInt(match[1], 10);
      const tot = parseInt(match[2], 10);
      if (tot > 1 && cur >= 1 && cur <= tot) {
        currentInstallment = cur;
        totalInstallments = tot;
        isInstallmentPattern = true;
        cleanName = cleanName.replace(regex, '');
        break;
      }
    }
  }

  // Remove ruídos comuns de maquininhas e adquirentes
  cleanName = cleanName
    .replace(/\b(PAG\*|PAGTO|COMPRA|PGTO|PAYPAL\*|MP\*|MERCADOPAGO\*|IFOOD\*|UBER\*|DL\*)\b/gi, '')
    .replace(/[\*#\-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // Se ficou vazio após limpeza, mantém o original limpo
  if (!cleanName) {
    cleanName = raw.replace(/\s+/g, ' ').trim();
  }

  return {
    rawDescription,
    normalizedDescription: cleanName,
    merchantName: cleanName,
    currentInstallment,
    totalInstallments,
    isInstallmentPattern,
  };
}

export interface ExistingPurchaseCandidate {
  id: string;
  creditCardId: string;
  normalizedDescription: string;
  merchantName?: string;
  installmentValue: number;
  installmentCount: number;
  lastIdentifiedInstallment?: number;
}

/**
 * Requisito 23: Algoritmo de Matching com Score (0 a 100).
 */
export function calculateMatchScore(
  importedItem: {
    creditCardId?: string;
    normalizedDescription: string;
    amount: number;
    currentInstallment?: number;
    totalInstallments?: number;
  },
  candidate: ExistingPurchaseCandidate
): MatchScoreResult {
  let score = 0;
  const details = {
    cardMatch: 0,
    merchantMatch: 0,
    amountMatch: 0,
    installmentSequenceMatch: 0,
  };

  // 1. Mesmo cartão (+30 pontos)
  if (importedItem.creditCardId && candidate.creditCardId === importedItem.creditCardId) {
    details.cardMatch = 30;
    score += 30;
  }

  // 2. Similaridade de Merchant / Descrição normalizada (+30 pontos)
  const sim = stringSimilarity(importedItem.normalizedDescription, candidate.normalizedDescription);
  if (sim >= 0.8) {
    details.merchantMatch = 30;
    score += 30;
  } else if (sim >= 0.5) {
    const partial = Math.round(30 * sim);
    details.merchantMatch = partial;
    score += partial;
  }

  // 3. Mesmo valor da parcela (+20 pontos com tolerância de R$ 0,05 para centavos)
  const diff = Math.abs(importedItem.amount - candidate.installmentValue);
  if (diff <= 0.05) {
    details.amountMatch = 20;
    score += 20;
  }

  // 4. Sequência de parcelas válida (+20 pontos)
  if (
    importedItem.totalInstallments &&
    importedItem.totalInstallments === candidate.installmentCount &&
    importedItem.currentInstallment &&
    importedItem.currentInstallment > 1
  ) {
    // É uma continuação de parcelamento
    details.installmentSequenceMatch = 20;
    score += 20;
  }

  let action: MatchScoreResult['action'] = 'NEW_PURCHASE';
  let reason = 'Transação sem parcelamento correspondente';

  if (score >= 90) {
    action = 'AUTO_LINK';
    reason = `Score alto (${score}/100) — Vinculação automática com "${candidate.normalizedDescription}" (${importedItem.currentInstallment}/${importedItem.totalInstallments})`;
  } else if (score >= 60) {
    action = 'NEEDS_CONFIRMATION';
    reason = `Score moderado (${score}/100) — Possível parcela ${importedItem.currentInstallment}/${importedItem.totalInstallments} de "${candidate.normalizedDescription}". Requer confirmação.`;
  }

  return {
    score,
    details,
    matchedPurchaseId: candidate.id,
    action,
    reason,
  };
}

/**
 * Similaridade baseada em Coeficiente de Dice / Bigramas
 */
function stringSimilarity(str1: string, str2: string): number {
  const s1 = (str1 || '').trim().toLowerCase();
  const s2 = (str2 || '').trim().toLowerCase();

  if (s1 === s2) return 1.0;
  if (!s1 || !s2) return 0;
  if (s1.includes(s2) || s2.includes(s1)) return 0.85;

  const pairs1 = getBigrams(s1);
  const pairs2 = getBigrams(s2);
  const union = pairs1.length + pairs2.length;
  if (union === 0) return 0;

  let hits = 0;
  for (const x of pairs1) {
    const idx = pairs2.indexOf(x);
    if (idx >= 0) {
      hits++;
      pairs2.splice(idx, 1);
    }
  }

  return (2.0 * hits) / union;
}

function getBigrams(str: string): string[] {
  const bigrams: string[] = [];
  for (let i = 0; i < str.length - 1; i++) {
    bigrams.push(str.substring(i, i + 2));
  }
  return bigrams;
}
