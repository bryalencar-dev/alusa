import prisma from '@/lib/prisma';
import RegisterForm from './RegisterForm';
import { redirect } from 'next/navigation';
import AuthPageContainer from '@/components/auth/AuthPageContainer';
import AuthCard from '@/components/auth/AuthCard';

interface RegisterPageProps {
  searchParams: { token?: string; next?: string };
}

export default async function RegisterPage({ searchParams }: RegisterPageProps) {
  const token = searchParams.token;
  
  // Se há token, validar convite
  if (token) {
    const invite = await prisma.invite.findUnique({ 
      where: { token },
      select: { email: true, role: true, status: true, expiresAt: true }
    });
    
    // Token inválido, expirado ou já usado
    if (!invite || invite.status !== 'PENDING' || invite.expiresAt < new Date()) {
      redirect('/auth/login?error=invalid_token');
    }
    
    return (
      <AuthPageContainer>
        <AuthCard className="w-[480px] px-12 py-10">
          <RegisterForm inviteData={{ email: invite.email, role: invite.role, token }} />
        </AuthCard>
      </AuthPageContainer>
    );
  }

  // Sem token: fluxo direto sempre cria ADMIN (first-register)
  return (
    <AuthPageContainer>
      <AuthCard className="w-[480px] px-12 py-10">
        <RegisterForm />
      </AuthCard>
    </AuthPageContainer>
  );
}
