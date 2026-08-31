import { NextResponse } from 'next/server';
import { resetDatabase } from '@/db/reset';

export async function POST() {
  try {
    await resetDatabase();
    return NextResponse.json({ success: true, message: 'Banco de dados zerado com sucesso.' });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
