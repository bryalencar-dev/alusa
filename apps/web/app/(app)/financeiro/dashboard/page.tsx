export default function FinanceiroDashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard Financeiro</h1>
        <p className="text-gray-600">Visão geral das finanças da escola</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {['Receita Mensal', 'Inadimplência', 'Cobranças Pendentes', 'Pagamentos Hoje'].map((item) => (
          <div key={item} className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-sm font-medium text-gray-500">{item}</h3>
            <p className="text-2xl font-bold text-gray-900 mt-2">--</p>
          </div>
        ))}
      </div>
      
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Módulo Financeiro</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
          <div>• Controle de mensalidades</div>
          <div>• Gestão de inadimplência</div>
          <div>• Relatórios financeiros</div>
          <div>• Integração bancária</div>
        </div>
      </div>
    </div>
  );
}