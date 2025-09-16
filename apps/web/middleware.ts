import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

const isTest = process.env.TEST_ROUTES_ENABLED === 'true';

const authMiddleware = withAuth({
  pages: { signIn: '/auth/login' },
});

function bypassMiddleware() {
  // Em testes E2E, não forçar login
  return NextResponse.next();
}

const middleware = isTest ? bypassMiddleware : authMiddleware;

export default middleware;

export const config = { matcher: ['/admin/:path*'] };
