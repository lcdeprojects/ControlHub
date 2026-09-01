import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json(
    { error: 'O auto-cadastro público está desativado. Novas contas são criadas exclusivamente pelo Administrador do sistema no Painel Backoffice.' },
    { status: 403 }
  );
}
