import { NextResponse } from 'next/server';
import { db } from '@/db';
import * as s from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET() {
  try {
    const list = await db.select().from(s.accounts);
    return NextResponse.json({ success: true, accounts: list });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, type, bankName, initialBalance = 0, color = '#3b82f6' } = body;

    const accId = `acc_${Date.now()}`;
    const newAcc = {
      id: accId,
      userId: 'usr_default',
      name,
      type,
      bankName,
      initialBalance: parseFloat(initialBalance),
      currentBalance: parseFloat(initialBalance),
      color,
      isActive: true,
    };

    await db.insert(s.accounts).values(newAcc);

    // Audit log
    await db.insert(s.auditLogs).values({
      id: `aud_${Date.now()}`,
      userId: 'usr_default',
      entityType: 'ACCOUNT',
      entityId: accId,
      action: 'CREATE',
      newValues: JSON.stringify(newAcc),
    });

    return NextResponse.json({ success: true, account: newAcc });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
