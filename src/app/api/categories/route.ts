import { NextResponse } from 'next/server';
import { db } from '@/db';
import * as s from '@/db/schema';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const list = await db.select().from(s.categories);
    return NextResponse.json({ success: true, categories: list });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
