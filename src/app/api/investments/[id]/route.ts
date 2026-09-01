import { NextResponse } from 'next/server';
import { db } from '@/db';
import * as s from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { getAuthUserId } from '@/lib/auth';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getAuthUserId(request);
    const { id } = await params;
    const body = await request.json();
    const { name, type, investedAmount, currentValue, institution, notes } = body;

    const existing = (
      await db.select().from(s.investments).where(and(eq(s.investments.id, id), eq(s.investments.userId, userId)))
    )[0];

    if (!existing) {
      return NextResponse.json({ success: false, error: 'Investimento não encontrado.' }, { status: 404 });
    }

    await db
      .update(s.investments)
      .set({
        name: name !== undefined ? name : existing.name,
        type: type !== undefined ? type : existing.type,
        investedAmount: investedAmount !== undefined ? parseFloat(investedAmount) : existing.investedAmount,
        currentValue: currentValue !== undefined ? parseFloat(currentValue) : existing.currentValue,
        institution: institution !== undefined ? institution : existing.institution,
        notes: notes !== undefined ? notes : existing.notes,
        updatedAt: new Date().toISOString(),
      })
      .where(and(eq(s.investments.id, id), eq(s.investments.userId, userId)));

    await db.insert(s.auditLogs).values({
      id: `aud_${Date.now()}`,
      userId,
      entityType: 'INVESTMENT',
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
    const userId = await getAuthUserId(request);
    const { id } = await params;

    const existing = (
      await db.select().from(s.investments).where(and(eq(s.investments.id, id), eq(s.investments.userId, userId)))
    )[0];

    if (!existing) {
      return NextResponse.json({ success: false, error: 'Investimento não encontrado.' }, { status: 404 });
    }

    await db.delete(s.investments).where(and(eq(s.investments.id, id), eq(s.investments.userId, userId)));

    await db.insert(s.auditLogs).values({
      id: `aud_${Date.now()}`,
      userId,
      entityType: 'INVESTMENT',
      entityId: id,
      action: 'DELETE',
      oldValues: JSON.stringify(existing),
    });

    return NextResponse.json({ success: true, deletedId: id });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
