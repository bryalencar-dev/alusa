import nextDynamic from 'next/dynamic';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { redirect } from 'next/navigation';

const AsaasCredentialsForm = nextDynamic(
  () =>
    import('../../../../../features/integracoes/asaas/AsaasCredentialsForm').then(
      (m) => m.AsaasCredentialsForm,
    ),
  { ssr: false },
);

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function ConfigIntegracoesPage() {
  const session = await getServerSession(authOptions).catch(() => null);
  type SessUser = { role?: string; contaId?: string };
  const role = (session as { user?: SessUser } | null)?.user?.role;
  const contaId = (session as { user?: SessUser } | null)?.user?.contaId;
  if (!role || !contaId || !['ADMIN', 'FINANCEIRO'].includes(role.toUpperCase())) {
    redirect('/admin/configuracoes');
  }
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-base font-semibold text-gray-900">Integrações</h2>
        <p className="mt-1 text-sm text-gray-600 max-w-prose">
          Configure credenciais de serviços externos utilizados nos fluxos financeiros.
        </p>
      </div>
      <section className="space-y-4">
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <h3 className="font-medium mb-2">Asaas</h3>
          <p className="text-xs text-gray-500 mb-4">Armazene o Token da API do Asaas por conta. O valor é mascarado após salvar.</p>
          <AsaasCredentialsForm />
        </div>
      </section>
    </div>
  );
}
