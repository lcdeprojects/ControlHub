import { NextResponse } from 'next/server';
import { db } from '@/db';

export async function GET() {
  try {
    const allUsers = await db.query.users.findMany({
      columns: {
        id: true,
        name: true,
        email: true,
        avatarColor: true,
        createdAt: true,
      },
    });
    return NextResponse.json(allUsers);
  } catch (error: any) {
    console.error('List users error:', error);
    return NextResponse.json({ error: 'Erro ao listar usuários' }, { status: 500 });
  }
}
