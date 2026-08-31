import { NextResponse } from 'next/server';
import { db } from '@/db';
import * as s from '@/db/schema';
import {
  parseRawSpreadsheet,
  autoDetectColumns,
  processImportRows,
  ColumnMappingConfig,
} from '@/lib/engines/import-parser';
import { eq } from 'drizzle-orm';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const targetCardId = (formData.get('targetCardId') as string) || undefined;
    const targetAccountId = (formData.get('targetAccountId') as string) || undefined;

    if (!file) {
      return NextResponse.json({ success: false, error: 'Nenhum arquivo enviado.' }, { status: 400 });
    }

    const buffer = await file.arrayBuffer();
    const rawRows = parseRawSpreadsheet(buffer, file.name);

    if (rawRows.length === 0) {
      return NextResponse.json({ success: false, error: 'Planilha vazia ou ilegível.' }, { status: 400 });
    }

    // Auto-detectar colunas
    const detectedMapping = autoDetectColumns(rawRows[0]);

    // Buscar fingerprints existentes no banco
    const existingTransactions = await db.select({ fingerprint: s.transactions.fingerprint }).from(s.transactions);
    const existingFingerprints = new Set(existingTransactions.map((t) => t.fingerprint));

    // Buscar compras parceladas existentes para matching
    const existingPurchases = await db
      .select({
        id: s.installmentPurchases.id,
        creditCardId: s.installmentPurchases.creditCardId,
        normalizedDescription: s.installmentPurchases.normalizedDescription,
        installmentValue: s.installmentPurchases.installmentValue,
        installmentCount: s.installmentPurchases.installmentCount,
      })
      .from(s.installmentPurchases);

    // Processar linhas
    const processedRows = processImportRows(
      rawRows,
      detectedMapping,
      'usr_default',
      targetCardId,
      existingFingerprints,
      existingPurchases
    );

    return NextResponse.json({
      success: true,
      fileName: file.name,
      mapping: detectedMapping,
      rows: processedRows,
    });
  } catch (error) {
    console.error('Import parser error:', error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
