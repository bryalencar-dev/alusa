import { getServerSession } from 'next-auth';
import { authConfig } from '../../../auth.config';
import Link from 'next/link';

export default async function FinanceiroPage(){
  const session = await getServerSession(authConfig);
  if(!session){
    return <div className="p-6"><p className="text-red-600">Acesso restrito. <Link className="underline" href="/login">Entre</Link>.</p></div>;
  }
  type SessionRoleUser = { id?: string; role?: string | { name?: string } };
  const su = session.user as SessionRoleUser;
  const role = (typeof su.role === 'string' ? su.role : su.role?.name) || 'USER';
  if(role?.toUpperCase() === 'PROFESSOR'){
    return <div className="p-6 space-y-4"><h1 className="text-xl font-semibold">Financeiro</h1><p className="text-amber-600">Seu perfil de Professor não possui acesso ao módulo Financeiro.</p><p>Se você acredita que isto é um engano, contate um administrador.</p></div>;
  }
  return (
    <div className="p-6 space-y-4">
      <h1 className="text-xl font-semibold">Financeiro (Mock)</h1>
      <p className="text-sm text-gray-500">Esta página é um mock inicial. Exibirá visão resumida de cobranças, pagamentos e indicadores.</p>
      <ul className="list-disc ml-6 text-sm space-y-1">
        <li>Total de cobranças pendentes: <strong>12</strong></li>
        <li>Valor em aberto: <strong>R$ 4.560,00</strong></li>
        <li>Pagamentos hoje: <strong>R$ 820,00</strong></li>
      </ul>
      <div className="border rounded p-4 bg-white/40 dark:bg-black/20">
        <p className="font-medium mb-2">Próximos passos</p>
        <ol className="list-decimal ml-6 text-sm space-y-1">
          <li>Integrar listagem real de cobranças (tabela cobranca).</li>
          <li>Adicionar filtros por status e período.</li>
          <li>Dashboard de métricas (receita mensal, inadimplência).</li>
        </ol>
      </div>
    </div>
  );
}
