import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

const isTest = process.env.TEST_ROUTES_ENABLED === 'true';

export default async function middleware(req: NextRequest) {
  if (isTest) {
    // Em testes E2E, não forçar login
    return NextResponse.next();
  }

  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (token) return NextResponse.next();

  const url = req.nextUrl.clone();
  const signInUrl = new URL('/auth/login', url.origin);
  signInUrl.searchParams.set('expired', 'true');
  // Requisito: após login sempre ir ao dashboard
  signInUrl.searchParams.set('callbackUrl', '/dashboard');
  return NextResponse.redirect(signInUrl);
}

export const config = { 
  matcher: [
    '/admin/:path*',
    '/alunos/:path*',
    '/professores/:path*', 
    '/matriculas/:path*',
    '/dashboard/:path*'
  ] 
};
