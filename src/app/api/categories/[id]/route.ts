import { NextResponse } from 'next/server';
import { db, ensureDatabaseSchema } from '@/db';
import * as s from '@/db/schema';
import { eq, sql } from 'drizzle-orm';
import { getAuthUserId } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await ensureDatabaseSchema();
    const userId = await getAuthUserId(request);
    const resolvedParams = await params;
    const { id } = resolvedParams;
    const body = await request.json();

    const { name, icon, color, type, showInQuickAdd } = body;

    const existing = (
      await db.select().from(s.categories).where(eq(s.categories.id, id))
    )[0];

    if (!existing) {
      return NextResponse.json({ success: false, error: 'Categoria não encontrada.' }, { status: 404 });
    }

    await db
      .update(s.categories)
      .set({
        name: name !== undefined ? name : existing.name,
        icon: icon !== undefined ? icon : existing.icon,
        color: color !== undefined ? color : existing.color,
        type: type !== undefined ? type : existing.type,
        showInQuickAdd: showInQuickAdd !== undefined ? Boolean(showInQuickAdd) : existing.showInQuickAdd,
      })
      .where(eq(s.categories.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating category:', error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await ensureDatabaseSchema();
    const userId = await getAuthUserId(request);
    const resolvedParams = await params;
    const { id } = resolvedParams;

    const existing = (
      await db.select().from(s.categories).where(eq(s.categories.id, id))
    )[0];

    if (!existing) {
      return NextResponse.json({ success: false, error: 'Categoria não encontrada.' }, { status: 404 });
    }

    // Desvincular transações, orçamentos e assinaturas antes de deletar
    await db.run(sql`UPDATE transactions SET category_id = NULL WHERE category_id = ${id}`).catch(() => {});
    await db.run(sql`UPDATE budgets SET category_id = NULL WHERE category_id = ${id}`).catch(() => {});
    await db.run(sql`UPDATE subscriptions SET category_id = NULL WHERE category_id = ${id}`).catch(() => {});

    await db.delete(s.categories).where(eq(s.categories.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting category:', error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
