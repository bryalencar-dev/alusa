import { NextResponse } from 'next/server';

// Stub de recuperação de senha
export function POST() {
  return NextResponse.json(
    { error: 'Recuperação de senha ainda não habilitada' },
    { status: 501 }
  );
}
