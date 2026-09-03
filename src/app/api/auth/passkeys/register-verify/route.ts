import { NextResponse } from 'next/server';
import { getAuthUserFromRequest } from '@/lib/auth';
import { db, ensureDatabaseSchema } from '@/db';
import * as s from '@/db/schema';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    await ensureDatabaseSchema();
    const user = await getAuthUserFromRequest(req);

    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await req.json();
    const { credentialId, publicKey, deviceName } = body;

    if (!credentialId || !publicKey) {
      return NextResponse.json({ error: 'Credencial inválida' }, { status: 400 });
    }

    await db.insert(s.authenticators).values({
      id: credentialId,
      userId: user.id,
      credentialPublicKey: publicKey,
      counter: 0,
      transports: 'internal',
      deviceName: deviceName || 'Dispositivo Biométrico (FaceID/TouchID)',
    }).onConflictDoNothing();

    return NextResponse.json({ success: true, message: 'Biometria/Passkey registrada com sucesso!' });
  } catch (error) {
    console.error('Error verifying passkey registration:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
