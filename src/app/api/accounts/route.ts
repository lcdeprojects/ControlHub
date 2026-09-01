import { NextResponse } from 'next/server';
import { db, ensureDatabaseSchema } from '@/db';
import * as s from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getAuthUserId } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    await ensureDatabaseSchema();
    const userId = await getAuthUserId(request);
    const list = await db.select().from(s.accounts).where(eq(s.accounts.userId, userId));
    return NextResponse.json({ success: true, accounts: list });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await ensureDatabaseSchema();
    const userId = await getAuthUserId(request);
    const body = await request.json();
    const { name, type, bankName, initialBalance = 0, color = '#3b82f6' } = body;

    const parsedBalance = parseFloat(initialBalance || 0);
    const accId = `acc_${Date.now()}`;
    const newAcc = {
      id: accId,
      userId,
      name,
      type,
      bankName: bankName || name,
      initialBalance: parsedBalance,
      currentBalance: parsedBalance,
      color,
      isActive: true,
    };

    await db.insert(s.accounts).values(newAcc);

    // Audit log
    await db.insert(s.auditLogs).values({
      id: `aud_${Date.now()}`,
      userId,
      entityType: 'ACCOUNT',
      entityId: accId,
      action: 'CREATE',
      newValues: JSON.stringify(newAcc),
    });

    return NextResponse.json({ success: true, account: newAcc });
  } catch (error) {
    console.error('Account creation error:', error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
