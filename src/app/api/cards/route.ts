import { NextResponse } from 'next/server';
import { db } from '@/db';
import * as s from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const month = parseInt(searchParams.get('month') || '8', 10);
    const year = parseInt(searchParams.get('year') || '2026', 10);

    let nextMonth = month + 1;
    let nextYear = year;
    if (nextMonth > 12) {
      nextMonth = 1;
      nextYear += 1;
    }

    const cards = await db.select().from(s.creditCards);
    const transactions = await db.select().from(s.transactions);

    const enrichedCards = cards.map((card) => {
      const cardTx = transactions.filter((t) => t.creditCardId === card.id);

      // Fatura do mês selecionado
      const currentInvoiceAmount = cardTx
        .filter(
          (t) =>
            t.billingMonth === month &&
            t.billingYear === year &&
            (t.transactionType === 'CREDIT_CARD_PURCHASE' || t.transactionType === 'INSTALLMENT')
        )
        .reduce((acc, t) => acc + (t.amount || 0), 0);

      // Fatura do próximo mês
      const nextInvoiceAmount = cardTx
        .filter(
          (t) =>
            t.billingMonth === nextMonth &&
            t.billingYear === nextYear &&
            (t.transactionType === 'CREDIT_CARD_PURCHASE' || t.transactionType === 'INSTALLMENT')
        )
        .reduce((acc, t) => acc + (t.amount || 0), 0);

      // Limite total utilizado
      const usedLimit = cardTx
        .filter((t) => t.transactionType === 'CREDIT_CARD_PURCHASE' || t.transactionType === 'INSTALLMENT')
        .reduce((acc, t) => acc + (t.amount || 0), 0);

      const availableLimit = Math.max(card.creditLimit - usedLimit, 0);

      return {
        id: card.id,
        name: card.name,
        bank: card.bank,
        brand: card.brand,
        last4Digits: card.last4Digits || '0000',
        creditLimit: card.creditLimit,
        usedLimit,
        availableLimit,
        closingDay: card.closingDay,
        dueDay: card.dueDay,
        currentInvoiceAmount,
        nextInvoiceAmount,
        color: card.color,
      };
    });

    return NextResponse.json({ success: true, cards: enrichedCards });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      name,
      bank,
      brand = 'Mastercard',
      last4Digits = '0000',
      creditLimit = 5000,
      closingDay = 3,
      dueDay = 10,
      defaultAccountId,
      color = '#18181b',
    } = body;

    const cardId = `card_${Date.now()}`;
    const newCard = {
      id: cardId,
      userId: 'usr_default',
      defaultAccountId: defaultAccountId || null,
      name,
      bank,
      brand,
      last4Digits,
      creditLimit: parseFloat(creditLimit),
      closingDay: parseInt(closingDay, 10),
      dueDay: parseInt(dueDay, 10),
      color,
    };

    await db.insert(s.creditCards).values(newCard);

    await db.insert(s.auditLogs).values({
      id: `aud_${Date.now()}`,
      userId: 'usr_default',
      entityType: 'CREDIT_CARD',
      entityId: cardId,
      action: 'CREATE',
      newValues: JSON.stringify(newCard),
    });

    return NextResponse.json({ success: true, card: newCard });
  } catch (error) {
    console.error('Create card error:', error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
