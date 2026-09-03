import { NextResponse } from 'next/server';
import { db, ensureDatabaseSchema } from '@/db';
import * as s from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { getAuthUserId } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await ensureDatabaseSchema();
    const userId = await getAuthUserId(request);
    const { id: cardId } = await params;
    const { searchParams } = new URL(request.url);

    const month = parseInt(searchParams.get('month') || String(new Date().getMonth() + 1), 10);
    const year = parseInt(searchParams.get('year') || String(new Date().getFullYear()), 10);

    // Buscar o cartão
    const card = (
      await db
        .select()
        .from(s.creditCards)
        .where(and(eq(s.creditCards.id, cardId), eq(s.creditCards.userId, userId)))
    )[0];

    if (!card) {
      return NextResponse.json({ success: false, error: 'Cartão não encontrado.' }, { status: 404 });
    }

    // Buscar transações associadas a este cartão para a fatura do mês/ano
    const txList = await db
      .select({
        id: s.transactions.id,
        description: s.transactions.description,
        amount: s.transactions.amount,
        transactionDate: s.transactions.transactionDate,
        transactionType: s.transactions.transactionType,
        billingMonth: s.transactions.billingMonth,
        billingYear: s.transactions.billingYear,
        isRecurring: s.transactions.isRecurring,
        categoryName: s.categories.name,
      })
      .from(s.transactions)
      .leftJoin(s.categories, eq(s.transactions.categoryId, s.categories.id))
      .where(and(eq(s.transactions.creditCardId, cardId), eq(s.transactions.userId, userId)));

    // Filtrar apenas as transações do mês e ano de faturamento selecionados
    const invoiceTransactions = txList.filter(
      (t) => t.billingMonth === month && t.billingYear === year
    );

    // Formatar os itens para o modal da fatura
    const items = invoiceTransactions.map((t) => {
      let type: 'SPOT' | 'INSTALLMENT' | 'SUBSCRIPTION' = 'SPOT';
      let installmentInfo: string | undefined = undefined;

      const instMatch = t.description.match(/\((\d+\/\d+)\)/);
      if (instMatch) {
        type = 'INSTALLMENT';
        installmentInfo = instMatch[1];
      } else if (t.isRecurring || t.description.toLowerCase().includes('assinatura:')) {
        type = 'SUBSCRIPTION';
      } else if (t.transactionType === 'INSTALLMENT') {
        type = 'INSTALLMENT';
      }

      return {
        id: t.id,
        description: t.description,
        amount: t.amount,
        date: t.transactionDate,
        type,
        installmentInfo,
        categoryName: t.categoryName || 'Geral',
      };
    });

    const totalAmount = items.reduce((acc, curr) => acc + curr.amount, 0);

    return NextResponse.json({
      success: true,
      card: {
        id: card.id,
        name: card.name,
        dueDay: card.dueDay,
        closingDay: card.closingDay,
      },
      items,
      totalAmount,
    });
  } catch (error) {
    console.error('Error fetching invoice items:', error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
