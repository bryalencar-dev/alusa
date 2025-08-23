import { PrismaClient, PerfilUsuario } from '@prisma/client';
import type { NextAuthOptions, User as NextAuthUser } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export type SessionUser = NextAuthUser & { roleId: string; perfil: PerfilUsuario };

export const authOptions: NextAuthOptions = {
	session: { strategy: 'jwt' },
	pages: { signIn: '/login' },
	providers: [
		Credentials({
			name: 'Credentials',
			credentials: { email: { label: 'Email', type: 'text' }, password: { label: 'Senha', type: 'password' } },
			async authorize(credentials) {
				if(!credentials?.email || !credentials.password) return null;
				const user = await prisma.user.findUnique({ where: { email: credentials.email } });
				if(!user) return null;
				const ok = await bcrypt.compare(credentials.password, user.senhaHash);
				if(!ok) return null;
				const perfil = (user as { perfil?: PerfilUsuario }).perfil || 'ALUNO';
				return { id: user.id, email: user.email, roleId: user.roleId, perfil } as SessionUser;
			}
		})
	],
	callbacks: {
			async jwt({ token, user }) {
				if(user) {
					const u = user as SessionUser;
					const t = token as unknown as { roleId?: string; perfil?: PerfilUsuario };
					t.roleId = u.roleId;
					t.perfil = u.perfil;
				}
				return token;
			},
			async session({ session, token }) {
				if(session.user) {
					const t = token as unknown as { roleId?: string; perfil?: PerfilUsuario };
					(session.user as unknown as { roleId?: string }).roleId = t.roleId;
					(session.user as unknown as { perfil?: PerfilUsuario }).perfil = t.perfil;
				}
				return session;
			}
	}
};
