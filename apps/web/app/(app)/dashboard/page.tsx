// Server Component (padrão do App Router)
export default function DashboardPage() {
  return (
    <section
      aria-label="Conteúdo do Dashboard"
      className="flex flex-col gap-2"
    >
      {/* Título e subtítulo no padrão do Figma */}
      <h1 className="text-[32px] font-medium leading-tight text-black">
        Dashboard
      </h1>
      <p className="text-[15px] font-normal text-[#484848]">
        Visão geral e atalhos para módulos do sistema.
      </p>

      {/* Conteúdo placeholder — substitua por cards/reports depois */}
      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-xl border border-gray-200 p-6">
          <h2 className="text-base font-medium text-[#2A004A]">Bem-vindo 👋</h2>
          <p className="mt-1 text-sm text-gray-600">
            Esta é uma página base para evitar erro de export. Substitua por
            widgets reais quando desejar.
          </p>
        </div>
      </div>
    </section>
  );
}
