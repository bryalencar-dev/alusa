export default function PortalDashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Portal do Aluno</h1>
        <p className="text-gray-600">Área destinada a pais, responsáveis e alunos</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {['Notas', 'Frequência', 'Mensalidades', 'Eventos'].map((item) => (
          <div key={item} className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-sm font-medium text-gray-500">{item}</h3>
            <p className="text-2xl font-bold text-gray-900 mt-2">--</p>
          </div>
        ))}
      </div>
      
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Portal do Aluno/Responsável</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
          <div>• Acompanhamento acadêmico</div>
          <div>• Comunicados da escola</div>
          <div>• Financeiro e mensalidades</div>
          <div>• Calendário de eventos</div>
        </div>
      </div>
    </div>
  );
}