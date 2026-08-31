import { NextResponse } from 'next/server';
import { db } from '@/db';
import * as s from '@/db/schema';
import { eq, desc } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const list = await db.select().from(s.investments).orderBy(desc(s.investments.currentValue));
    return NextResponse.json({ success: true, investments: list });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, type, investedAmount = 0, currentValue = 0, institution } = body;

    await db
      .insert(s.users)
      .values({
        id: 'usr_default',
        name: 'Usuário',
        email: 'usuario@controlhub.app',
      })
      .onConflictDoNothing();

    const id = `inv_${Date.now()}`;
    const newInv = {
      id,
      userId: 'usr_default',
      name,
      type,
      institution: institution || 'Próprio',
      investedAmount: parseFloat(investedAmount),
      currentValue: parseFloat(currentValue),
    };

    await db.insert(s.investments).values(newInv);

    return NextResponse.json({ success: true, investment: newInv });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
