import ChargesTable from '@/features/financeiro/cobrancas/ChargesTable';
import { FinanceSummary } from '@/features/financeiro/components/FinanceSummary';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function FinanceiroCobrancasPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Cobranças</h1>
        <p className="text-sm text-gray-600 max-w-prose">
          Acompanhe o status das cobranças geradas (mensalidades, taxa de matrícula, extras).
        </p>
      </div>
      <FinanceSummary />
      <ChargesTable />
    </div>
  );
}
