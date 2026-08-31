import { NextResponse } from 'next/server';
import { db } from '@/db';
import * as s from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET() {
  try {
    const list = await db.select().from(s.investments);
    return NextResponse.json({ success: true, investments: list });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, type, investedAmount = 0, currentValue = 0, institution, notes } = body;

    const invId = `inv_${Date.now()}`;
    const newInv = {
      id: invId,
      userId: 'usr_default',
      name,
      type,
      investedAmount: parseFloat(investedAmount),
      currentValue: parseFloat(currentValue),
      institution,
      notes,
    };

    await db.insert(s.investments).values(newInv);

    await db.insert(s.auditLogs).values({
      id: `aud_${Date.now()}`,
      userId: 'usr_default',
      entityType: 'INVESTMENT',
      entityId: invId,
      action: 'CREATE',
      newValues: JSON.stringify(newInv),
    });

    return NextResponse.json({ success: true, investment: newInv });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
