import SettingsCardNav from '@/components/settings/SettingsCardNav';

export default function ConfiguracoesLayout({ children }: { children: React.ReactNode }) {
  return (
    <div data-testid="settings-card-layout" className="space-y-6">
      {/* Título fixo */}
      <h1 className="text-2xl font-semibold text-gray-900">Configurações</h1>

      <div className="grid grid-cols-12 gap-8">
        {/* Sidebar interna */}
        <aside className="col-span-12 md:col-span-2">
          <SettingsCardNav />
        </aside>

        {/* Conteúdo mais largo */}
        <main className="col-span-12 md:col-span-10">
          <div className="w-full rounded-2xl border border-gray-200 bg-white p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
