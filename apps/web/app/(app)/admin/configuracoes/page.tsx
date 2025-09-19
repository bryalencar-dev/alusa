import { Wrench } from '@/components/icons/icons';

export default function ConfiguracoesPage() {
  return (
    <div className="flex flex-col items-center justify-center h-full py-24">
      <Wrench className="w-16 h-16 text-[#A94DFF] mb-6" aria-label="Manutenção" />
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Página em desenvolvimento</h1>
      <p className="text-gray-500">Em breve você poderá gerenciar usuários, integrações e configurações gerais.</p>
    </div>
  );
}