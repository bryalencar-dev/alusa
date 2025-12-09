import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { redirect } from 'next/navigation';
import { AsaasIntegrationPageContent } from '@/features/integracoes/asaas/AsaasIntegrationPageContent';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function IntegracaoAsaasPage() {
  const session = await getServerSession(authOptions).catch(() => null);
  type SessUser = { role?: string; contaId?: string };
  const role = (session as { user?: SessUser } | null)?.user?.role;
  const contaId = (session as { user?: SessUser } | null)?.user?.contaId;
  if (!role || !contaId || !['ADMIN', 'FINANCEIRO'].includes(role.toUpperCase())) {
    redirect('/admin/configuracoes/integracoes');
  }

  return <AsaasIntegrationPageContent />;
}
