import { NextResponse } from 'next/server';
import { db, ensureDatabaseSchema } from '@/db';
import * as s from '@/db/schema';
import { generateTransactionFingerprint } from '@/lib/engines/fingerprint';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    await ensureDatabaseSchema();
    const { invoiceId, accountId, paymentDate, amount } = await request.json();

    await db
      .insert(s.users)
      .values({
        id: 'usr_default',
        name: 'Leonardo C.',
        email: 'usuario@nexumhub.app',
      })
      .onConflictDoNothing();

    const tDate = new Date(paymentDate + 'T12:00:00');
    const compMonth = tDate.getMonth() + 1;
    const compYear = tDate.getFullYear();

    const txId = `t_pay_${Date.now()}`;
    const fp = generateTransactionFingerprint({
      userId: 'usr_default',
      sourceId: accountId,
      transactionDate: paymentDate,
      normalizedDescription: 'PAGAMENTO FATURA CARTAO',
      amount,
    });

    // 1. Inserir transação de pagamento com tipo CREDIT_CARD_PAYMENT
    await db.insert(s.transactions).values({
      id: txId,
      userId: 'usr_default',
      accountId,
      transactionType: 'CREDIT_CARD_PAYMENT',
      paymentMethod: 'AUTO_DEBIT',
      description: 'Pagamento de Fatura do Cartão',
      normalizedDescription: 'PAGAMENTO FATURA CARTAO',
      amount,
      transactionDate: paymentDate,
      competenceMonth: compMonth,
      competenceYear: compYear,
      fingerprint: fp,
    });

    // 2. Debitar saldo da conta bancária de saída
    const acc = (await db.select().from(s.accounts).where(eq(s.accounts.id, accountId)))[0];
    if (acc) {
      await db
        .update(s.accounts)
        .set({ currentBalance: (acc.currentBalance || 0) - amount })
        .where(eq(s.accounts.id, accountId));
    }

    // 3. Atualizar status da fatura para PAID se ID válido existir
    if (invoiceId && invoiceId !== 'inv_current') {
      await db
        .update(s.invoices)
        .set({
          status: 'PAID',
          paidAmount: amount,
          paidAt: paymentDate,
          paymentTransactionId: txId,
        })
        .where(eq(s.invoices.id, invoiceId));
    }

    return NextResponse.json({ success: true, transactionId: txId });
  } catch (error) {
    console.error('Pay invoice error:', error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
