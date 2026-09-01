import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import { normalizeTransactionDescription, calculateMatchScore, ExistingPurchaseCandidate } from './matching-algorithm';
import { generateTransactionFingerprint } from './fingerprint';
import { ImportParsedRow } from '../types';

export interface ColumnMappingConfig {
  dateCol: string;
  descriptionCol: string;
  amountCol: string;
  categoryCol?: string;
  typeCol?: string;
  installmentCol?: string;
  cardLast4Col?: string;
}

export function parseRawSpreadsheet(
  buffer: ArrayBuffer | Uint8Array,
  fileName: string
): Record<string, any>[] {
  const isCsv = fileName.toLowerCase().endsWith('.csv');

  if (isCsv) {
    const text = new TextDecoder('utf-8').decode(buffer);
    const parsed = Papa.parse(text, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: false,
      delimitersToGuess: [';', ',', '\t', '|'],
    });
    return parsed.data as Record<string, any>[];
  } else {
    // XLS / XLSX
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    const data = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
    return data as Record<string, any>[];
  }
}

/**
 * Detecta automaticamente colunas comuns em extratos de bancos brasileiros
 * (C6 Bank, Nubank, Itaú, Bradesco, Santander, Inter, BTG, BB, etc.)
 */
export function autoDetectColumns(sampleRow: Record<string, any>): ColumnMappingConfig {
  const keys = Object.keys(sampleRow);

  let dateCol =
    keys.find(k => /valor \(em r\$\)|data de compra|dt_compra|data_compra|data|date|dt_transacao/i.test(k) && /data/i.test(k)) ||
    keys.find(k => /data|date/i.test(k)) ||
    keys[0] ||
    '';

  let descriptionCol =
    keys.find(k => /descri[cç][aã]o|historico|estabelecimento|merchant|titulo|memo/i.test(k)) ||
    keys[1] ||
    '';

  // Prioriza "Valor (em R$)" (padrão C6 Bank) para não confundir com "Valor (em US$)"
  let amountCol =
    keys.find(k => /valor \(em r\$\)|valor_brl|valor \(brl\)/i.test(k)) ||
    keys.find(k => /^valor$/i.test(k)) ||
    keys.find(k => /valor|amount|quantia|vlr/i.test(k)) ||
    keys[2] ||
    '';

  let categoryCol = keys.find(k => /categoria|category|classificacao/i.test(k));
  let typeCol = keys.find(k => /tipo|type|d_c|debito_credito/i.test(k));
  let installmentCol = keys.find(k => /^parcela$/i.test(k) || /parcela/i.test(k));
  let cardLast4Col = keys.find(k => /final do cart[aã]o|cartao|final/i.test(k));

  return {
    dateCol,
    descriptionCol,
    amountCol,
    categoryCol,
    typeCol,
    installmentCol,
    cardLast4Col,
  };
}

/**
 * Processa linhas brutas, normaliza e compara contra transações e parcelamentos existentes.
 */
export function processImportRows(
  rawRows: Record<string, any>[],
  mapping: ColumnMappingConfig,
  userId: string,
  targetCardId?: string,
  existingFingerprints: Set<string> = new Set(),
  existingPurchases: ExistingPurchaseCandidate[] = []
): ImportParsedRow[] {
  const results: ImportParsedRow[] = [];

  for (const row of rawRows) {
    const rawDate = row[mapping.dateCol];
    const rawDesc = row[mapping.descriptionCol];
    const rawAmount = row[mapping.amountCol];

    if (!rawDate || !rawDesc || rawAmount === undefined || rawAmount === '') {
      continue;
    }

    const cleanDate = parseDateString(String(rawDate));
    const cleanAmount = parseAmountNumber(rawAmount);

    if (cleanAmount === 0 || !cleanDate) continue;

    const norm = normalizeTransactionDescription(String(rawDesc));
    const amountVal = Math.abs(cleanAmount);
    const type: 'DEBIT' | 'CREDIT' = cleanAmount < 0 ? 'CREDIT' : 'DEBIT';

    let currentInstallment = norm.currentInstallment;
    let totalInstallments = norm.totalInstallments;
    let isInstallment = norm.isInstallmentPattern;

    // Se o extrato possui coluna dedicada "Parcela" (ex: C6 Bank "12/12", "8/10", "Única")
    if (mapping.installmentCol && row[mapping.installmentCol]) {
      const rawInstStr = String(row[mapping.installmentCol]).trim();
      const instMatch = rawInstStr.match(/^(\d{1,2})\s*[\/|\\]\s*(\d{1,2})$/);
      if (instMatch) {
        const cur = parseInt(instMatch[1], 10);
        const tot = parseInt(instMatch[2], 10);
        if (tot > 1 && cur >= 1 && cur <= tot) {
          currentInstallment = cur;
          totalInstallments = tot;
          isInstallment = true;
        }
      } else if (/única|unica|1\/1/i.test(rawInstStr)) {
        isInstallment = false;
        currentInstallment = undefined;
        totalInstallments = undefined;
      }
    }

    // Gerar Fingerprint determinístico
    const fingerprint = generateTransactionFingerprint({
      userId,
      sourceId: targetCardId || 'GENERIC',
      transactionDate: cleanDate,
      normalizedDescription: norm.normalizedDescription,
      amount: amountVal,
      installmentNumber: currentInstallment || 0,
    });

    const isDuplicate = existingFingerprints.has(fingerprint);

    // Calcular Match Score se for padrão de parcela
    let matchScoreResult: ImportParsedRow['matchScore'];
    if (isInstallment && existingPurchases.length > 0) {
      let bestMatch: ImportParsedRow['matchScore'];
      for (const candidate of existingPurchases) {
        const scoreRes = calculateMatchScore(
          {
            creditCardId: targetCardId,
            normalizedDescription: norm.normalizedDescription,
            amount: amountVal,
            currentInstallment,
            totalInstallments,
          },
          candidate
        );
        if (!bestMatch || scoreRes.score > bestMatch.score) {
          bestMatch = scoreRes;
        }
      }
      matchScoreResult = bestMatch;
    }

    results.push({
      date: cleanDate,
      description: String(rawDesc).trim(),
      amount: amountVal,
      type,
      rawCategory: mapping.categoryCol ? String(row[mapping.categoryCol] || '') : undefined,
      normalizedDescription: norm.normalizedDescription,
      merchantName: norm.merchantName,
      currentInstallment,
      totalInstallments,
      isInstallment,
      fingerprint,
      matchScore: matchScoreResult,
      isDuplicate,
    });
  }

  return results;
}

function parseDateString(val: string): string {
  if (!val) return '';
  const trimmed = val.trim();

  // DD/MM/YYYY ou DD-MM-YYYY
  const brMatch = trimmed.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/);
  if (brMatch) {
    const day = brMatch[1].padStart(2, '0');
    const month = brMatch[2].padStart(2, '0');
    let year = brMatch[3];
    if (year.length === 2) year = `20${year}`;
    return `${year}-${month}-${day}`;
  }

  // YYYY-MM-DD
  const isoMatch = trimmed.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/);
  if (isoMatch) {
    const year = isoMatch[1];
    const month = isoMatch[2].padStart(2, '0');
    const day = isoMatch[3].padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // Fallback Date object
  const d = new Date(trimmed);
  if (!isNaN(d.getTime())) {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  return '';
}

function parseAmountNumber(val: any): number {
  if (typeof val === 'number') return val;
  if (!val) return 0;

  let str = String(val).trim();
  // Remove R$, espaços
  str = str.replace(/R\$\s?/, '').replace(/\s/g, '');

  // Trata formato brasileiro 1.234,56
  if (str.includes(',') && str.includes('.')) {
    if (str.indexOf('.') < str.indexOf(',')) {
      // 1.234,56 -> 1234.56
      str = str.replace(/\./g, '').replace(',', '.');
    } else {
      // 1,234.56 -> 1234.56
      str = str.replace(/,/g, '');
    }
  } else if (str.includes(',')) {
    // 1234,56 -> 1234.56
    str = str.replace(',', '.');
  }

  const num = parseFloat(str);
  return isNaN(num) ? 0 : num;
}
