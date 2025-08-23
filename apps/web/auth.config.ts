import NextAuth, { type AuthOptions } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "./lib/prisma"; // caminho relativo dentro de apps/web
import bcrypt from "bcryptjs";

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
        // Tenta modelo User (schema atual). Se não existir, cai no fallback.
        const tryUser = async () => {
          try {
            const u = await prisma.user.findUnique({ where: { email: creds.email }, include: { role: true } });
            if (u?.senhaHash) {
              const ok = await bcrypt.compare(creds.password, u.senhaHash);
              if (ok) {
                console.log('[auth] login via User ok', u.email);
                return { id: u.id, email: u.email, name: u.email.split("@")[0], role: u.role?.name || "USER" };
              }
              console.log('[auth] senha inválida User', u.email);
            }
          } catch (e) {
            console.warn('[auth] tryUser erro', (e as Error).message);
          }
          return null;
        };

        const tryUsuario = async () => {
          try {
            const anyPrisma = prisma as any; // eslint-disable-line @typescript-eslint/no-explicit-any
            if (!anyPrisma.usuario) return null;
            const uu = await anyPrisma.usuario.findUnique({ where: { email: creds.email } });
            if (uu?.senhaHash) {
              const ok = await bcrypt.compare(creds.password, uu.senhaHash);
              if (ok) {
                console.log('[auth] login via Usuario ok', uu.email);
                return { id: uu.id, email: uu.email, name: (uu as any).nome ?? uu.email, role: "USER" }; // eslint-disable-line @typescript-eslint/no-explicit-any
              }
              console.log('[auth] senha inválida Usuario', uu.email);
            }
          } catch (e) {
            console.warn('[auth] tryUsuario erro', (e as Error).message);
          }
          return null;
        };

        const r = (await tryUser()) || (await tryUsuario());
        if (!r) console.log('[auth] credenciais inválidas', creds.email);
        return r;
      }
    })
  ],
  callbacks: {
  async jwt({ token, user }: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
      if (user) {
        const u = user as { id: string; role?: string };
        token.id = u.id;
        token.role = u.role || "USER";
      }
      return token;
    },
  async session({ session, token }: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
      if (session.user) {
        (session.user as any).id = token.id; // eslint-disable-line @typescript-eslint/no-explicit-any
        (session.user as any).role = (token as any).role || "USER"; // eslint-disable-line @typescript-eslint/no-explicit-any
      }
      return session;
    }
  }
};

// Em NextAuth v4 no App Router, chamamos NextAuth(config) e reexportamos como GET/POST.
const handler = NextAuth(authConfig);
export { handler as GET, handler as POST };
// Reexport utilidades client-side (não usadas server) para conveniência de imports.
export { signIn, signOut } from "next-auth/react";
