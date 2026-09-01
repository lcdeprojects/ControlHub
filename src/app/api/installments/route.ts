import { NextResponse } from 'next/server';
import { db } from '@/db';
import * as s from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { getShortMonth } from '@/lib/utils';

import { getAuthUserId } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const userId = await getAuthUserId(request);
    const { searchParams } = new URL(request.url);
    const month = parseInt(searchParams.get('month') || '8', 10);
    const year = parseInt(searchParams.get('year') || '2026', 10);

    const purchases = await db
      .select({
        id: s.installmentPurchases.id,
        description: s.installmentPurchases.description,
        totalAmount: s.installmentPurchases.totalAmount,
        installmentCount: s.installmentPurchases.installmentCount,
        installmentValue: s.installmentPurchases.installmentValue,
        firstBillingMonth: s.installmentPurchases.firstBillingMonth,
        firstBillingYear: s.installmentPurchases.firstBillingYear,
        status: s.installmentPurchases.status,
        cardName: s.creditCards.name,
      })
      .from(s.installmentPurchases)
      .leftJoin(s.creditCards, eq(s.installmentPurchases.creditCardId, s.creditCards.id))
      .where(eq(s.installmentPurchases.userId, userId))
      .orderBy(desc(s.installmentPurchases.createdAt));

    const installments = await db.select().from(s.installments);

    const enrichedPurchases = purchases.map((p) => {
      const pInstallments = installments.filter((i) => i.installmentPurchaseId === p.id);
      const paidCount = pInstallments.filter((i) => i.status === 'PAID').length;
      const paidAmount = paidCount * p.installmentValue;
      const remainingAmount = Math.max(p.totalAmount - paidAmount, 0);

      // Calcular último mês de cobrança
      let lastMonth = p.firstBillingMonth + p.installmentCount - 1;
      let lastYear = p.firstBillingYear;
      while (lastMonth > 12) {
        lastMonth -= 12;
        lastYear += 1;
      }

      return {
        id: p.id,
        description: p.description,
        cardName: p.cardName || 'Cartão de Crédito',
        totalAmount: p.totalAmount,
        installmentCount: p.installmentCount,
        installmentValue: p.installmentValue,
        currentPaidInstallments: paidCount,
        paidAmount,
        remainingAmount,
        lastBillingMonth: lastMonth,
        lastBillingYear: lastYear,
        status: p.status,
      };
    });

    // Projeção futura dinâmica de 6 meses baseada nas parcelas cadastradas no banco
    const futureProjection = [];
    for (let offset = 0; offset < 6; offset++) {
      let targetM = month + offset;
      let targetY = year;
      while (targetM > 12) {
        targetM -= 12;
        targetY += 1;
      }

      const matchingInst = installments.filter(
        (i) => i.billingMonth === targetM && i.billingYear === targetY
      );

      const monthTotal = matchingInst.reduce((acc, curr) => acc + (curr.amount || 0), 0);
      const activeCount = new Set(matchingInst.map((i) => i.installmentPurchaseId)).size;

      futureProjection.push({
        month: `${getShortMonth(targetM)}/${String(targetY).slice(2)}`,
        amount: monthTotal,
        activeCount,
      });
    }

    // Parcelas do mês selecionado
    const currentMonthInstallments = installments.filter(
      (i) => i.billingMonth === month && i.billingYear === year
    );
    const monthlyInstallmentTotal = currentMonthInstallments.reduce((acc, curr) => acc + curr.amount, 0);

    const totalOriginalAmount = purchases.reduce((acc, curr) => acc + curr.totalAmount, 0);
    const totalPaid = enrichedPurchases.reduce((acc, curr) => acc + curr.paidAmount, 0);
    const totalCommitted = totalOriginalAmount - totalPaid;

    const stats = {
      totalOriginalAmount,
      totalPaid,
      totalCommitted,
      monthlyInstallmentTotal,
      activeCount: purchases.length,
    };

    return NextResponse.json({
      success: true,
      purchases: enrichedPurchases,
      futureProjection,
      stats,
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
