import { NextResponse } from 'next/server';
import { getAuthUserFromRequest } from '@/lib/auth';
import { db, ensureDatabaseSchema } from '@/db';
import * as s from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    await ensureDatabaseSchema();
    const user = await getAuthUserFromRequest(req);

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Acesso restrito ao administrador' }, { status: 403 });
    }

    const invites = await db
      .select()
      .from(s.userInvites)
      .orderBy(desc(s.userInvites.createdAt));

    return NextResponse.json({ success: true, invites });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await ensureDatabaseSchema();
    const user = await getAuthUserFromRequest(req);

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Acesso restrito ao administrador' }, { status: 403 });
    }

    const body = await req.json();
    const { name, email, role = 'USER' } = body;

    if (!name || !email) {
      return NextResponse.json({ error: 'Nome e E-mail são obrigatórios para gerar o convite.' }, { status: 400 });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const token = `inv_token_${crypto.randomBytes(16).toString('hex')}`;
    const inviteId = `inv_${Date.now()}`;

    await db.insert(s.userInvites).values({
      id: inviteId,
      name: String(name).trim(),
      email: normalizedEmail,
      role: role === 'ADMIN' ? 'ADMIN' : 'USER',
      token,
      used: false,
      createdBy: user.id,
    });

    const host = req.headers.get('host') || 'localhost:3000';
    const protocol = host.includes('localhost') ? 'http' : 'https';
    const inviteUrl = `${protocol}://${host}/register?token=${token}`;

    return NextResponse.json({
      success: true,
      invite: {
        id: inviteId,
        name,
        email: normalizedEmail,
        token,
        inviteUrl,
      },
    });
  } catch (error) {
    console.error('Error creating invite link:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    await ensureDatabaseSchema();
    const user = await getAuthUserFromRequest(req);

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Acesso restrito ao administrador' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID do convite é obrigatório' }, { status: 400 });
    }

    await db.delete(s.userInvites).where(eq(s.userInvites.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
