import { NextResponse } from 'next/server';
import { db, ensureDatabaseSchema, getDbConnectionInfo } from '@/db';
import * as s from '@/db/schema';
import { sql } from 'drizzle-orm';
import { getAuthUserId } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    await ensureDatabaseSchema();
    const userId = await getAuthUserId(request);
    const connInfo = getDbConnectionInfo();

    const startTime = Date.now();
    // Query de teste de latência
    await db.run(sql`SELECT 1`);
    const latencyMs = Date.now() - startTime;

    // Obter estatísticas de contagem de registros
    const [userCount, txCount, accCount, cardCount, subCount] = await Promise.all([
      db.select({ count: sql<number>`count(*)` }).from(s.users),
      db.select({ count: sql<number>`count(*)` }).from(s.transactions),
      db.select({ count: sql<number>`count(*)` }).from(s.accounts),
      db.select({ count: sql<number>`count(*)` }).from(s.creditCards),
      db.select({ count: sql<number>`count(*)` }).from(s.subscriptions),
    ]);

    return NextResponse.json({
      success: true,
      status: 'HEALTHY',
      connection: {
        mode: connInfo.mode,
        url: connInfo.url,
        hasAuthToken: connInfo.hasAuthToken,
        latencyMs,
      },
      stats: {
        users: userCount[0]?.count || 0,
        transactions: txCount[0]?.count || 0,
        accounts: accCount[0]?.count || 0,
        creditCards: cardCount[0]?.count || 0,
        subscriptions: subCount[0]?.count || 0,
      },
    });
  } catch (error) {
    console.error('Database healthcheck error:', error);
    return NextResponse.json(
      {
        success: false,
        status: 'UNHEALTHY',
        error: String(error),
      },
      { status: 500 }
    );
  }
}
