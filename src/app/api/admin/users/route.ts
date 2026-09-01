import { NextResponse } from 'next/server';
import { db } from '@/db';
import * as s from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getAuthUserFromRequest, hashPin, seedDefaultUserCategories } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    const authUser = await getAuthUserFromRequest(req);
    if (!authUser || authUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Acesso negado. Apenas administradores podem acessar esta função.' }, { status: 403 });
    }

    const allUsers = await db.query.users.findMany({
      columns: {
        id: true,
        name: true,
        email: true,
        avatarColor: true,
        role: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ success: true, users: allUsers });
  } catch (error: any) {
    console.error('Admin list users error:', error);
    return NextResponse.json({ error: 'Erro ao listar usuários' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const authUser = await getAuthUserFromRequest(req);
    if (!authUser || authUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Acesso negado. Apenas administradores podem criar usuários.' }, { status: 403 });
    }

    const body = await req.json();
    const { name, email, pin, role = 'USER', avatarColor = '#6366f1' } = body;

    if (!name || !email || !pin) {
      return NextResponse.json({ error: 'Nome, E-mail e PIN/Senha são obrigatórios' }, { status: 400 });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const existing = await db.query.users.findFirst({
      where: eq(s.users.email, normalizedEmail),
    });

    if (existing) {
      return NextResponse.json({ error: 'Já existe um usuário cadastrado com este e-mail' }, { status: 400 });
    }

    const userId = `usr_${crypto.randomUUID()}`;
    const pinHash = hashPin(String(pin).trim());

    await db.insert(s.users).values({
      id: userId,
      name: String(name).trim(),
      email: normalizedEmail,
      pinHash,
      avatarColor,
      role: role === 'ADMIN' ? 'ADMIN' : 'USER',
    });

    await seedDefaultUserCategories(userId);

    return NextResponse.json({
      success: true,
      user: {
        id: userId,
        name: String(name).trim(),
        email: normalizedEmail,
        avatarColor,
        role: role === 'ADMIN' ? 'ADMIN' : 'USER',
      },
    });
  } catch (error: any) {
    console.error('Admin create user error:', error);
    return NextResponse.json({ error: error.message || 'Erro ao criar usuário' }, { status: 500 });
  }
}
