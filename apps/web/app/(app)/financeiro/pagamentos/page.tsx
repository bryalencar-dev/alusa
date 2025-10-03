import PaymentsTable from '@/features/financeiro/pagamentos/PaymentsTable';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function FinanceiroPagamentosPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Pagamentos</h1>
        <p className="text-sm text-gray-600 max-w-prose">
          Registros de pagamentos efetuados associados às cobranças. Utilize os filtros para
          refinar.
        </p>
      </div>
      <PaymentsTable />
    </div>
  );
}
