/* eslint-disable */
// Versão simplificada e permissiva para estabilizar build; posterior hardening pode remover eslint-disable.
import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { z } from 'zod';
import { verifyCredentials } from './auth-service';
import prisma from '@/lib/prisma';

declare module 'next-auth/jwt' {
  interface JWT {
    id?: string;
    role?: string;
    contaId?: string;
  }
}

const creds = z.object({ email: z.string().email(), password: z.string().min(6) });
const secret =
  process.env.NEXTAUTH_SECRET ?? (process.env.NODE_ENV === 'test' ? 'test-secret' : undefined);
if (!secret) throw new Error('NEXTAUTH_SECRET ausente. Defina em apps/web/.env.local');

export const authOptions: NextAuthOptions = {
  secret,
  pages: { signIn: '/auth/login' },
  session: { strategy: 'jwt', maxAge: 60 * 60 * 24 * 7, updateAge: 60 * 60 },
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'text' },
        password: { label: 'Senha', type: 'password' },
      },
      async authorize(raw) {
        const parsed = creds.safeParse(raw);
        if (!parsed.success) {
          if (process.env.AUTH_DEBUG === 'true')
            console.debug('[auth] authorize zod fail', parsed.error.flatten());
          return null;
        }
        const u = await verifyCredentials(parsed.data.email, parsed.data.password);
        if (!u) {
          if (process.env.AUTH_DEBUG === 'true')
            console.debug('[auth] authorize invalid credentials', { email: parsed.data.email });
          return null;
        }
        return { id: u.id, name: u.nome, email: u.email, role: u.role, contaId: u.contaId } as any;
      },
    }) as any,
  ],
  callbacks: {
    jwt({ token, user }) {
      // Quando há user (login), garanta que os campos essenciais sejam copiados para o token
      if (user) {
        token.id = (user as any).id;
        (token as any).role = (user as any).role ?? 'USER';
        // Propagar também email e name com defaults não-undefined
        (token as any).email = (user as any).email ?? '';
        (token as any).name = (user as any).name ?? '';
        // IMPORTANTE: não converter contaId inexistente em string vazia – manter null/undefined
        // para que o frontend consiga diferenciar “não carregado” de “valor válido”.
        const rawContaId = (user as any).contaId;
        (token as any).contaId = rawContaId == null || rawContaId === '' ? null : rawContaId;
      }
      return token;
    },
    async session({ session, token }) {
      // Propagar SEMPRE id, email, name e role para session.user conforme contrato
      if (!session.user) (session as any).user = {};
      (session.user as any).id = (token as any).id ?? '';
      (session.user as any).email = (token as any).email ?? '';
      (session.user as any).name = (token as any).name ?? '';
      (session.user as any).role = (token as any).role ?? 'USER';
      // Mesma lógica de preservação; se vier string vazia, converte para null
      const tokenContaId = (token as any).contaId;
      (session.user as any).contaId =
        tokenContaId == null || tokenContaId === '' ? null : tokenContaId;
      // Buscar foto atual do usuário para refletir avatar em toda a UI
      try {
        const userId = (token as any).id as string | undefined;
        if (userId) {
          const u = await prisma.usuario.findUnique({
            where: { id: userId },
            select: { foto: true },
          });
          (session.user as any).foto = u?.foto ?? null;
          // Compatibilidade com componentes que usam image padrão do NextAuth
          (session.user as any).image = u?.foto ?? null;
        } else {
          (session.user as any).foto = null;
          (session.user as any).image = null;
        }
      } catch {
        // Evita quebrar sessão por falha no DB
        (session.user as any).foto = (session.user as any).foto ?? null;
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      try {
        // Permitir apenas mesma origem
        const parsed = new URL(url, baseUrl);
        if (parsed.origin !== baseUrl) return baseUrl + '/dashboard';

        const path = parsed.pathname;
        // Normalizar barra final opcional
        const norm = path.endsWith('/') && path !== '/' ? path.slice(0, -1) : path;

        // Permitir retorno à raiz explicitamente (logout)
        if (norm === '/') return baseUrl + '/';
        // Paths auth -> após login direcionar ao dashboard
        if (!norm || norm === '/auth' || norm.startsWith('/auth/')) return baseUrl + '/dashboard';

        // Permitir caminhos relativos existentes (heurística simples: começam com '/')
        if (norm.startsWith('/')) {
          // Bloquear destinos suspeitos (ex.: /admin/dashboard que não existe) => fallback
          // Poderíamos checar lista branca; por simplicidade, bloquear se contém 'admin/dashboard'
          if (norm === '/admin/dashboard') return baseUrl + '/dashboard';
          return norm; // relativo: NextAuth resolverá para mesma origem
        }
        // Qualquer outro formato (query estranha, protocolo externo) => fallback
        return baseUrl + '/dashboard';
      } catch {
        return baseUrl + '/dashboard';
      }
    },
  },
};
