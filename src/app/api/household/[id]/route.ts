import { NextResponse } from 'next/server';
import { db, ensureDatabaseSchema } from '@/db';
import * as s from '@/db/schema';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await ensureDatabaseSchema();
    const { id } = await params;
    const body = await request.json();
    const { name, amount, dayOfMonth, categoryId } = body;

    const updateData: any = {};
    if (name !== undefined) updateData.description = name;
    if (amount !== undefined) {
      updateData.amount = typeof amount === 'string' ? parseFloat(amount.replace(',', '.')) : parseFloat(amount);
    }
    if (dayOfMonth !== undefined) updateData.dayOfMonth = parseInt(dayOfMonth, 10);
    if (categoryId !== undefined) updateData.categoryId = categoryId;

    await db
      .update(s.recurringTransactions)
      .set(updateData)
      .where(eq(s.recurringTransactions.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating household expense:', error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await ensureDatabaseSchema();
    const { id } = await params;

    await db
      .delete(s.recurringTransactions)
      .where(eq(s.recurringTransactions.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting household expense:', error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
