import crypto from 'crypto';
import { cookies } from 'next/headers';
import { db } from '@/db';
import * as s from '@/db/schema';
import { eq, and, gt } from 'drizzle-orm';

export const SESSION_COOKIE_NAME = 'controlhub_session';
const SESSION_DURATION_DAYS = 30;

export function hashPin(pin: string): string {
  return crypto.createHash('sha256').update(`controlhub_salt_${pin}`).digest('hex');
}

export function verifyPin(pin: string, storedHash?: string | null): boolean {
  if (!storedHash) return false;
  // Permite comparação direta se a senha não estiver em hash (retrocompatibilidade com '1234')
  if (storedHash === pin) return true;
  return hashPin(pin) === storedHash;
}

export async function createSession(userId: string): Promise<string> {
  const sessionId = `sess_${crypto.randomUUID()}`;
  const expiresAt = new Date(Date.now() + SESSION_DURATION_DAYS * 24 * 60 * 60 * 1000).toISOString();

  await db.insert(s.sessions).values({
    id: sessionId,
    userId,
    expiresAt,
  });

  return sessionId;
}

export async function destroySession(sessionId: string): Promise<void> {
  await db.delete(s.sessions).where(eq(s.sessions.id, sessionId));
}

export async function getAuthUserFromRequest(req?: Request) {
  try {
    let sessionId: string | undefined;

    if (req) {
      const cookieHeader = req.headers.get('cookie');
      if (cookieHeader) {
        const match = cookieHeader.match(new RegExp(`${SESSION_COOKIE_NAME}=([^;]+)`));
        if (match) sessionId = match[1];
      }
      if (!sessionId) {
        const authHeader = req.headers.get('x-user-id');
        if (authHeader) {
          const user = await db.query.users.findFirst({
            where: eq(s.users.id, authHeader),
          });
          if (user) return user;
        }
      }
    }

    if (!sessionId) {
      try {
        const cookieStore = await cookies();
        sessionId = cookieStore.get(SESSION_COOKIE_NAME)?.value;
      } catch {}
    }

    if (!sessionId) {
      return null;
    }

    const now = new Date().toISOString();
    const session = await db.query.sessions.findFirst({
      where: and(
        eq(s.sessions.id, sessionId),
        gt(s.sessions.expiresAt, now)
      ),
    });

    if (!session) {
      return null;
    }

    const user = await db.query.users.findFirst({
      where: eq(s.users.id, session.userId),
    });

    return user || null;
  } catch (err) {
    console.error('Error in getAuthUserFromRequest:', err);
    return null;
  }
}

export async function getAuthUserId(req?: Request): Promise<string> {
  const user = await getAuthUserFromRequest(req);
  return user?.id || '';
}

export async function seedDefaultUserCategories(userId: string) {
  const defaultCategories = [
    { id: `cat_mercado_${userId}`, name: 'Mercado', icon: 'shopping-cart', color: '#10b981', type: 'EXPENSE' as const },
    { id: `cat_restaurantes_${userId}`, name: 'Restaurantes', icon: 'utensils', color: '#f59e0b', type: 'EXPENSE' as const },
    { id: `cat_transporte_${userId}`, name: 'Transporte / Uber', icon: 'car', color: '#ec4899', type: 'EXPENSE' as const },
    { id: `cat_combustivel_${userId}`, name: 'Combustível', icon: 'fuel', color: '#f97316', type: 'EXPENSE' as const },
    { id: `cat_saude_${userId}`, name: 'Saúde & Farmácia', icon: 'heart-pulse', color: '#ef4444', type: 'EXPENSE' as const },
    { id: `cat_academia_${userId}`, name: 'Academia', icon: 'dumbbell', color: '#14b8a6', type: 'EXPENSE' as const },
    { id: `cat_educacao_${userId}`, name: 'Educação & Cursos', icon: 'graduation-cap', color: '#a855f7', type: 'EXPENSE' as const },
    { id: `cat_lazer_${userId}`, name: 'Lazer & Viagens', icon: 'palmtree', color: '#0ea5e9', type: 'EXPENSE' as const },
    { id: `cat_compras_${userId}`, name: 'Compras & Eletrônicos', icon: 'shopping-bag', color: '#84cc16', type: 'EXPENSE' as const },
    { id: `cat_assinaturas_${userId}`, name: 'Assinaturas & Streaming', icon: 'film', color: '#d946ef', type: 'EXPENSE' as const },
    { id: `cat_moradia_${userId}`, name: 'Moradia / Aluguel', icon: 'home', color: '#6366f1', type: 'HOUSEHOLD' as const },
    { id: `cat_condominio_${userId}`, name: 'Condomínio', icon: 'building', color: '#8b5cf6', type: 'HOUSEHOLD' as const },
    { id: `cat_energia_${userId}`, name: 'Energia Elétrica', icon: 'zap', color: '#eab308', type: 'HOUSEHOLD' as const },
    { id: `cat_agua_${userId}`, name: 'Água & Saneamento', icon: 'droplet', color: '#06b6d4', type: 'HOUSEHOLD' as const },
    { id: `cat_internet_${userId}`, name: 'Internet & Fibra', icon: 'wifi', color: '#3b82f6', type: 'HOUSEHOLD' as const },
    { id: `cat_salario_${userId}`, name: 'Salário & Remuneração', icon: 'briefcase', color: '#22c55e', type: 'INCOME' as const },
    { id: `cat_rendimentos_${userId}`, name: 'Rendimentos & Dividendos', icon: 'trending-up', color: '#10b981', type: 'INCOME' as const },
    { id: `cat_outros_${userId}`, name: 'Outros', icon: 'tag', color: '#94a3b8', type: 'EXPENSE' as const },
  ];

  for (const cat of defaultCategories) {
    await db.insert(s.categories).values({
      ...cat,
      userId,
      isSystem: true,
    }).onConflictDoNothing();
  }
}
