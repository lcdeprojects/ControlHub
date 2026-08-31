import { NextResponse } from 'next/server';
import { db } from '@/db';
import * as s from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, type, bankName, currentBalance, color } = body;

    const existing = (
      await db.select().from(s.accounts).where(eq(s.accounts.id, id))
    )[0];

    if (!existing) {
      return NextResponse.json({ success: false, error: 'Conta não encontrada.' }, { status: 404 });
    }

    await db
      .update(s.accounts)
      .set({
        name: name !== undefined ? name : existing.name,
        type: type !== undefined ? type : existing.type,
        bankName: bankName !== undefined ? bankName : existing.bankName,
        currentBalance: currentBalance !== undefined ? parseFloat(currentBalance) : existing.currentBalance,
        color: color !== undefined ? color : existing.color,
      })
      .where(eq(s.accounts.id, id));

    await db.insert(s.auditLogs).values({
      id: `aud_${Date.now()}`,
      userId: existing.userId,
      entityType: 'ACCOUNT',
      entityId: id,
      action: 'UPDATE',
      oldValues: JSON.stringify(existing),
      newValues: JSON.stringify(body),
    });

    return NextResponse.json({ success: true, id });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const existing = (
      await db.select().from(s.accounts).where(eq(s.accounts.id, id))
    )[0];

    if (!existing) {
      return NextResponse.json({ success: false, error: 'Conta não encontrada.' }, { status: 404 });
    }

    await db.delete(s.accounts).where(eq(s.accounts.id, id));

    await db.insert(s.auditLogs).values({
      id: `aud_${Date.now()}`,
      userId: existing.userId,
      entityType: 'ACCOUNT',
      entityId: id,
      action: 'DELETE',
      oldValues: JSON.stringify(existing),
    });

    return NextResponse.json({ success: true, deletedId: id });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
