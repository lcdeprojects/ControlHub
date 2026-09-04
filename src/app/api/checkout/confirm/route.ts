import { NextResponse } from 'next/server';
import { getAuthUserFromRequest } from '@/lib/auth';
import { db } from '@/db';
import * as s from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(req: Request) {
  try {
    const user = await getAuthUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const plan = body.plan || 'PRO_ANNUAL';

    // Atualiza status da assinatura para ACTIVE
    await db
      .update(s.users)
      .set({
        subscriptionStatus: 'ACTIVE',
      })
      .where(eq(s.users.id, user.id));

    return NextResponse.json({
      success: true,
      message: `Assinatura ${plan === 'PRO_ANNUAL' ? 'Plano Pro Anual' : 'Plano Pro Mensal'} confirmada com sucesso! Acesso completo liberado.`,
      user: {
        ...user,
        subscriptionStatus: 'ACTIVE',
      },
    });
  } catch (error: any) {
    console.error('Checkout error:', error);
    return NextResponse.json({ error: error.message || 'Erro ao processar pagamento' }, { status: 500 });
  }
}
