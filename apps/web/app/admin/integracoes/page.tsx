import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import nextDynamic from 'next/dynamic';

const AsaasCredentialsForm = nextDynamic(
  () =>
    import('../../../features/integracoes/asaas/AsaasCredentialsForm').then(
      (m) => m.AsaasCredentialsForm,
    ),
  { ssr: false },
);

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function IntegracoesPage() {
  const session = await getServerSession(authOptions).catch(() => null);
  type SessUser = { role?: string; contaId?: string };
  const role = (session as { user?: SessUser } | null)?.user?.role;
  const contaId = (session as { user?: SessUser } | null)?.user?.contaId;
  if (!role || !contaId || !['ADMIN', 'FINANCEIRO'].includes(role.toUpperCase())) {
    redirect('/');
  }
  return (
    <main className="p-6 space-y-8">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Integrações</h1>
        <p className="text-sm text-gray-600 mt-1 max-w-2xl">
          Gerencie credenciais de provedores externos utilizados para cobrança e automação
          financeira.
        </p>
      </header>
      <section className="space-y-4">
        <div className="border rounded-lg p-4 bg-white dark:bg-neutral-900">
          <h2 className="font-semibold mb-2">Asaas</h2>
          <p className="text-xs text-gray-500 mb-4 max-w-prose">
            Cadastre ou rotacione a API Key e o Webhook Secret usados para criar clientes,
            assinaturas e processar notificações. Para ambiente de sandbox utilize chaves de teste.
          </p>
          <AsaasCredentialsForm />
        </div>
      </section>
    </main>
  );
}
