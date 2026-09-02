import { NextResponse } from 'next/server';
import { db } from '@/db';
import * as s from '@/db/schema';
import { eq, or } from 'drizzle-orm';
import { getAuthUserId } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const userId = await getAuthUserId(request);
    const { searchParams } = new URL(request.url);
    const typeParam = searchParams.get('type');

    let list = await db
      .select()
      .from(s.categories)
      .where(or(eq(s.categories.isSystem, true), eq(s.categories.userId, userId)));

    // Filter by type if provided
    if (typeParam) {
      if (typeParam === 'INCOME') {
        list = list.filter((c) => c.type === 'INCOME');
      } else if (typeParam === 'EXPENSE') {
        list = list.filter((c) => c.type === 'EXPENSE' || c.type === 'HOUSEHOLD');
      } else {
        list = list.filter((c) => c.type === typeParam);
      }
    }

    // Deduplicate in response list by normalized name and type
    const uniqueMap = new Map<string, typeof list[0]>();
    for (const item of list) {
      const key = `${item.name.trim().toLowerCase()}_${item.type}`;
      if (!uniqueMap.has(key) || (item.isSystem && !uniqueMap.get(key)?.isSystem)) {
        uniqueMap.set(key, item);
      }
    }

    const uniqueList = Array.from(uniqueMap.values());

    return NextResponse.json({ success: true, categories: uniqueList });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
