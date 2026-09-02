import { NextResponse } from 'next/server';
import { db } from '@/db';
import * as s from '@/db/schema';
import { ImportParsedRow } from '@/lib/types';
import { calculateInvoiceCycle } from '@/lib/engines/invoice-cycle';
import { eq, or, and } from 'drizzle-orm';
import { getAuthUserId } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const userId = await getAuthUserId(request);
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Não autorizado.' }, { status: 401 });
    }

    const { rows, targetCardId, targetAccountId } = await request.json() as {
      rows: ImportParsedRow[];
      targetCardId?: string;
      targetAccountId?: string;
    };

    let importedCount = 0;
    let autoLinkedCount = 0;

    // Validar se cartão pertence ao usuário
    let validCardId: string | undefined;
    let cardConfig = { closingDay: 3, dueDay: 10 };
    if (targetCardId) {
      const c = (
        await db
          .select()
          .from(s.creditCards)
          .where(and(eq(s.creditCards.id, targetCardId), eq(s.creditCards.userId, userId)))
      )[0];
      if (c) {
        validCardId = c.id;
        cardConfig = { closingDay: c.closingDay, dueDay: c.dueDay };
      }
    }

    // Validar se conta pertence ao usuário
    let validAccountId: string | undefined;
    if (targetAccountId) {
      const acc = (
        await db
          .select({ id: s.accounts.id })
          .from(s.accounts)
          .where(and(eq(s.accounts.id, targetAccountId), eq(s.accounts.userId, userId)))
      )[0];
      if (acc) validAccountId = acc.id;
    }

    // Buscar categorias válidas para o usuário (ou categorias do sistema)
    const userCategories = await db
      .select({ id: s.categories.id, name: s.categories.name })
      .from(s.categories)
      .where(or(eq(s.categories.userId, userId), eq(s.categories.isSystem, true)));

    const findBestCategory = (rawCategory?: string) => {
      if (rawCategory) {
        const rawLower = rawCategory.toLowerCase();
        const found = userCategories.find(c => c.name.toLowerCase().includes(rawLower) || rawLower.includes(c.name.toLowerCase()));
        if (found) return found.id;
      }
      return userCategories[0]?.id || null;
    };

    for (const row of rows) {
      if (row.isDuplicate) continue;

      const tDate = new Date(row.date + 'T12:00:00');
      const compMonth = tDate.getMonth() + 1;
      const compYear = tDate.getFullYear();

      let billMonth = compMonth;
      let billYear = compYear;

      if (validCardId) {
        const cycle = calculateInvoiceCycle(row.date, cardConfig);
        billMonth = cycle.billingMonth;
        billYear = cycle.billingYear;
      }

      const txId = `t_imp_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
      const resolvedCatId = findBestCategory(row.rawCategory);

      // Se for parcela vinculada a compra existente
      if (row.matchScore?.action === 'AUTO_LINK' && row.matchScore.matchedPurchaseId) {
        autoLinkedCount++;
      }

      await db.insert(s.transactions).values({
        id: txId,
        userId,
        accountId: validAccountId,
        creditCardId: validCardId,
        categoryId: resolvedCatId,
        transactionType: validCardId ? (row.isInstallment ? 'INSTALLMENT' : 'CREDIT_CARD_PURCHASE') : 'EXPENSE',
        paymentMethod: validCardId ? 'CREDIT' : 'DEBIT',
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
