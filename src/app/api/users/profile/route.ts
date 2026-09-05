import { NextResponse } from 'next/server';
import { db } from '@/db';
import * as s from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getAuthUserFromRequest } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const user = await getAuthUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    return NextResponse.json({
      success: true,
      profile: {
        id: user.id,
        name: user.name,
        email: user.email,
        phoneNumber: user.phoneNumber || '',
        avatarColor: user.avatarColor,
        role: user.role,
        subscriptionStatus: user.subscriptionStatus,
        trialEndsAt: user.trialEndsAt,
      },
    });
  } catch (error: any) {
    console.error('Get profile error:', error);
    return NextResponse.json({ error: 'Erro ao buscar perfil' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const user = await getAuthUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await req.json();
    const { name, phoneNumber } = body;

    const updateData: Record<string, any> = {};

    if (name !== undefined && String(name).trim()) {
      updateData.name = String(name).trim();
    }

    if (phoneNumber !== undefined) {
      updateData.phoneNumber = phoneNumber ? String(phoneNumber).trim() : null;
    }

    if (Object.keys(updateData).length > 0) {
      await db.update(s.users).set(updateData).where(eq(s.users.id, user.id));
    }

    const updated = await db.query.users.findFirst({
      where: eq(s.users.id, user.id),
    });

    return NextResponse.json({
      success: true,
      profile: {
        id: updated?.id,
        name: updated?.name,
        email: updated?.email,
        phoneNumber: updated?.phoneNumber || '',
        avatarColor: updated?.avatarColor,
        role: updated?.role,
        subscriptionStatus: updated?.subscriptionStatus,
        trialEndsAt: updated?.trialEndsAt,
      },
    });
  } catch (error: any) {
    console.error('Update profile error:', error);
    return NextResponse.json({ error: 'Erro ao atualizar perfil' }, { status: 500 });
  }
}
