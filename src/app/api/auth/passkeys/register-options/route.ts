import { NextResponse } from 'next/server';
import { getAuthUserFromRequest } from '@/lib/auth';
import { generateRegistrationOptions } from '@/lib/security/webauthn';
import { ensureDatabaseSchema } from '@/db';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    await ensureDatabaseSchema();
    const user = await getAuthUserFromRequest(req);

    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const options = generateRegistrationOptions(user.id, user.name, user.email);

    return NextResponse.json({ success: true, options });
  } catch (error) {
    console.error('Error generating passkey registration options:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
