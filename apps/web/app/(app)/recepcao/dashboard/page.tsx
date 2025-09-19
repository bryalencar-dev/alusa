export default function RecepcaoDashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard Recepção</h1>
        <p className="text-gray-600">Visão geral das atividades da recepção</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {['Atendimentos Hoje', 'Agendamentos', 'Ligações', 'Visitantes'].map((item) => (
          <div key={item} className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-sm font-medium text-gray-500">{item}</h3>
            <p className="text-2xl font-bold text-gray-900 mt-2">--</p>
          </div>
        ))}
      </div>
      
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Funcionalidades da Recepção</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
          <div>• Atendimento ao público</div>
          <div>• Agendamento de visitas</div>
          <div>• Cadastro de visitantes</div>
          <div>• Controle de acesso</div>
        </div>
      </div>
    </div>
  );
}