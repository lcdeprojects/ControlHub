import { NextResponse } from 'next/server';
import { db, ensureDatabaseSchema } from '@/db';
import * as s from '@/db/schema';
import { generateAuthenticationOptions } from '@/lib/security/webauthn';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    await ensureDatabaseSchema();
    const credentials = await db.select({ id: s.authenticators.id }).from(s.authenticators);

    const credentialIds = credentials.map((c) => c.id);
    const options = generateAuthenticationOptions(credentialIds);

    return NextResponse.json({ success: true, options });
  } catch (error) {
    console.error('Error generating passkey login options:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
