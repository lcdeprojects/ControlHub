import { NextResponse } from 'next/server';
import { getAuthUserFromRequest } from '@/lib/auth';
import { db, ensureDatabaseSchema } from '@/db';
import * as s from '@/db/schema';
import { eq, and } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    await ensureDatabaseSchema();
    const user = await getAuthUserFromRequest(req);

    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const list = await db
      .select()
      .from(s.authenticators)
      .where(eq(s.authenticators.userId, user.id));

    return NextResponse.json({ success: true, passkeys: list });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    await ensureDatabaseSchema();
    const user = await getAuthUserFromRequest(req);

    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID é obrigatório' }, { status: 400 });
    }

    await db
      .delete(s.authenticators)
      .where(and(eq(s.authenticators.id, id), eq(s.authenticators.userId, user.id)));

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
