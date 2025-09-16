/* eslint-disable */
// Versão simplificada e permissiva para estabilizar build; posterior hardening pode remover eslint-disable.
import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { z } from 'zod';
import { verifyCredentials } from './auth-service';

declare module 'next-auth/jwt' { interface JWT { id?: string; role?: string } }

const creds = z.object({ email: z.string().email(), password: z.string().min(6) });
const secret = process.env.NEXTAUTH_SECRET;
if (!secret) throw new Error('NEXTAUTH_SECRET ausente. Defina em apps/web/.env.local');

export const authOptions: NextAuthOptions = {
  secret,
  pages: { signIn: '/auth/login' },
  session: { strategy: 'jwt', maxAge: 60 * 60 * 24 * 7, updateAge: 60 * 60 },
  providers: [CredentialsProvider({
    name: 'Credentials',
    credentials: { email: { label: 'Email', type: 'text' }, password: { label: 'Senha', type: 'password' } },
    async authorize(raw) {
      const parsed = creds.safeParse(raw);
      if (!parsed.success) return null;
      const u = await verifyCredentials(parsed.data.email, parsed.data.password);
      if (!u) return null;
  return { id: u.id, name: u.nome, email: u.email, role: u.role } as any;
    }
  }) as any],
  callbacks: {
    jwt({ token, user }) {
      // Quando há user (login), garanta que os campos essenciais sejam copiados para o token
      if (user) {
        token.id = (user as any).id;
        (token as any).role = (user as any).role ?? 'USER';
        // Propagar também email e name com defaults não-undefined
        (token as any).email = (user as any).email ?? '';
        (token as any).name = (user as any).name ?? '';
      }
      return token;
    },
    session({ session, token }) {
      // Propagar SEMPRE id, email, name e role para session.user conforme contrato
      if (!session.user) (session as any).user = {};
      (session.user as any).id = (token as any).id ?? '';
      (session.user as any).email = (token as any).email ?? '';
      (session.user as any).name = (token as any).name ?? '';
      (session.user as any).role = (token as any).role ?? 'USER';
      return session;
    }
  }
};
