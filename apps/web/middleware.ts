import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

// Rotas públicas base
const publicPaths = ["/login"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const testRoutesEnabled = process.env.TEST_ROUTES_ENABLED === 'true';
  const isTestRoute = pathname.startsWith('/api/test') || pathname.startsWith('/test');
  const isPublic =
    publicPaths.includes(pathname) ||
    pathname.startsWith("/api/auth") ||
    (isTestRoute && testRoutesEnabled);

  if (isPublic) return NextResponse.next();

  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  // Sem sessão → vai para /login
  if (!token) return NextResponse.redirect(new URL("/login", req.url));

  // Logado e tentando /login → manda para /portal
  if (pathname === "/login") {
    return NextResponse.redirect(new URL("/portal", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
