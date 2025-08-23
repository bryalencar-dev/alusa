import NextAuth, { type AuthOptions } from "next-auth";
import Credentials from "next-auth/providers/credentials";
// prisma import removido (acesso indireto via auth-service se necessário)
import { verifyCredentials } from "./lib/auth/auth-service";

// Configuração NextAuth (v4). Evitar padrões de v5 (handlers, auth) pois pacote instalado é 4.x.
export const authConfig: AuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Senha", type: "password" }
      },
      async authorize(creds) {
        if (!creds?.email || !creds?.password) return null;
  const r = await verifyCredentials(creds.email, creds.password);
  if(!r) console.log('[auth] credenciais inválidas', creds.email);
  return r;
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        (token as any).id = (user as any).id; // eslint-disable-line @typescript-eslint/no-explicit-any
        (token as any).role = (user as any).role ?? 'USER'; // eslint-disable-line @typescript-eslint/no-explicit-any
  // garante email/name no token para sessão
  if (!token.email && (user as any).email) token.email = (user as any).email; // eslint-disable-line @typescript-eslint/no-explicit-any
  if (!token.name && (user as any).name) token.name = (user as any).name; // eslint-disable-line @typescript-eslint/no-explicit-any
      }
      return token;
    },
    async session({ session, token }) {
      (session as any).user = { // eslint-disable-line @typescript-eslint/no-explicit-any
        id: (token as any).id, // eslint-disable-line @typescript-eslint/no-explicit-any
        email: token.email,
        name: token.name,
        role: (token as any).role ?? 'USER' // eslint-disable-line @typescript-eslint/no-explicit-any
      };
      return session;
    }
  }
};

// Em NextAuth v4 no App Router, chamamos NextAuth(config) e reexportamos como GET/POST.
const handler = NextAuth(authConfig);
export { handler as GET, handler as POST };
// Reexport utilidades client-side (não usadas server) para conveniência de imports.
export { signIn, signOut } from "next-auth/react";
