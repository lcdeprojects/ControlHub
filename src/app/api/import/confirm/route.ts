import { NextResponse } from 'next/server';
import { db } from '@/db';
import * as s from '@/db/schema';
import { ImportParsedRow } from '@/lib/types';
import { calculateInvoiceCycle } from '@/lib/engines/invoice-cycle';
import { eq } from 'drizzle-orm';

export async function POST(request: Request) {
  try {
    const { rows, targetCardId, targetAccountId } = await request.json() as {
      rows: ImportParsedRow[];
      targetCardId?: string;
      targetAccountId?: string;
    };

    let importedCount = 0;
    let autoLinkedCount = 0;

    let cardConfig = { closingDay: 3, dueDay: 10 };
    if (targetCardId) {
      const c = (await db.select().from(s.creditCards).where(eq(s.creditCards.id, targetCardId)))[0];
      if (c) cardConfig = { closingDay: c.closingDay, dueDay: c.dueDay };
    }

    for (const row of rows) {
      if (row.isDuplicate) continue;

      const tDate = new Date(row.date + 'T12:00:00');
      const compMonth = tDate.getMonth() + 1;
      const compYear = tDate.getFullYear();

      let billMonth = compMonth;
      let billYear = compYear;

      if (targetCardId) {
        const cycle = calculateInvoiceCycle(row.date, cardConfig);
        billMonth = cycle.billingMonth;
        billYear = cycle.billingYear;
      }

      const txId = `t_imp_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;

      // Se for parcela vinculada a compra existente
      if (row.matchScore?.action === 'AUTO_LINK' && row.matchScore.matchedPurchaseId) {
        autoLinkedCount++;
      }

      await db.insert(s.transactions).values({
        id: txId,
        userId: 'usr_default',
        accountId: targetAccountId,
        creditCardId: targetCardId,
        categoryId: 'cat_compras',
        transactionType: targetCardId ? (row.isInstallment ? 'INSTALLMENT' : 'CREDIT_CARD_PURCHASE') : 'EXPENSE',
        paymentMethod: targetCardId ? 'CREDIT' : 'DEBIT',
        description: row.description,
        normalizedDescription: row.normalizedDescription,
        amount: row.amount,
        transactionDate: row.date,
        competenceMonth: compMonth,
        competenceYear: compYear,
        billingMonth: billMonth,
        billingYear: billYear,
        fingerprint: row.fingerprint,
        source: 'IMPORT',
      }).onConflictDoNothing();

      importedCount++;
    }

    return NextResponse.json({
      success: true,
      importedCount,
      autoLinkedCount,
    });
  } catch (error) {
    console.error('Confirm import error:', error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
