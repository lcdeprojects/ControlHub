import { NextResponse } from 'next/server';
import { db, ensureDatabaseSchema } from '@/db';
import * as s from '@/db/schema';
import { eq, or } from 'drizzle-orm';
import { getAuthUserId } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    await ensureDatabaseSchema();
    const userId = await getAuthUserId(request);
    const { searchParams } = new URL(request.url);
    const typeParam = searchParams.get('type');
    const quickOnly = searchParams.get('quickOnly') === 'true';

    let list = await db
      .select()
      .from(s.categories)
      .where(or(eq(s.categories.isSystem, true), eq(s.categories.userId, userId)));

    // Deduplicate in response list by normalized name and type
    const uniqueMap = new Map<string, typeof list[0]>();
    for (const item of list) {
      const key = `${item.name.trim().toLowerCase()}_${item.type}`;
      if (!uniqueMap.has(key) || (!item.isSystem && uniqueMap.get(key)?.isSystem)) {
        uniqueMap.set(key, item);
      }
    }

    let uniqueList = Array.from(uniqueMap.values());

    // Filter by type if provided
    if (typeParam) {
      if (typeParam === 'INCOME') {
        uniqueList = uniqueList.filter((c) => c.type === 'INCOME');
      } else if (typeParam === 'EXPENSE') {
        uniqueList = uniqueList.filter((c) => c.type === 'EXPENSE' || c.type === 'HOUSEHOLD');
      } else {
        uniqueList = uniqueList.filter((c) => c.type === typeParam);
      }
    }

    if (quickOnly) {
      uniqueList = uniqueList.filter((c) => c.showInQuickAdd);
    }

    return NextResponse.json({ success: true, categories: uniqueList });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await ensureDatabaseSchema();
    const userId = await getAuthUserId(request);
    const body = await request.json();

    const { name, icon = 'tag', color = '#3b82f6', type = 'EXPENSE', showInQuickAdd = false } = body;

    if (!name) {
      return NextResponse.json({ success: false, error: 'Nome da categoria é obrigatório.' }, { status: 400 });
    }

    const catId = `cat_custom_${Date.now()}`;

    await db.insert(s.categories).values({
      id: catId,
      userId,
      name,
      icon,
      color,
      type,
      isSystem: false,
      showInQuickAdd: Boolean(showInQuickAdd),
    });

    return NextResponse.json({ success: true, categoryId: catId });
  } catch (error) {
    console.error('Error creating category:', error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
