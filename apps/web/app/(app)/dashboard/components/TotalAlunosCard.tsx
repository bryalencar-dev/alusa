"use client";

type RecentStudent = {
  id: string;
  name: string;
  avatarUrl: string | null;
  initials: string;
};

type TotalAlunosCardProps = {
  total: number;
  recentStudents: RecentStudent[];
  onAddAluno: () => void;
};

export function TotalAlunosCard({ total, recentStudents, onAddAluno }: TotalAlunosCardProps) {
  const avatarSlots: Array<RecentStudent | null> = [...recentStudents.slice(0, 3)];
  while (avatarSlots.length < 3) {
    avatarSlots.push(null);
  }
  const gradientFallback = 'bg-gradient-to-br from-purple-500 to-pink-500';

  return (
    <div
      className="flex flex-col min-h-[200px] rounded-2xl bg-[#c4b5fd] px-5 py-4"
      data-testid="total-alunos-card"
    >
      <div className="flex items-center justify-between">
        <span className="text-[13px] font-normal tracking-wide text-[#2D004A]">Total de alunos</span>
        <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-medium text-[#2D004A]">
          <span className="h-2 w-2 rounded-full bg-emerald-300" aria-hidden />
          Atualizado
        </span>
      </div>
      <div className="flex flex-1 flex-col justify-center">
        <span className="text-5xl font-medium text-[#2D004A] leading-none">{total}</span>
      </div>
      <div className="mt-6 flex items-center justify-between">
        <div className="flex items-center -space-x-2">
          {avatarSlots.map((student, index) => {
            const avatarUrl = student?.avatarUrl?.trim() ?? null;
            const hasAvatar = Boolean(avatarUrl);
            const displayName = student?.name ?? 'Aluno recente';
            const displayInitials = student?.initials ?? 'AL';
            
            return (
              <div
                key={student?.id ?? `placeholder-${index}`}
                className={`flex h-9 w-9 items-center justify-center rounded-full outline outline-4 outline-[#c4b5fd] ${hasAvatar ? 'bg-transparent' : gradientFallback} text-xs font-semibold text-white pointer-events-none select-none overflow-hidden`}
                title={displayName}
                data-testid="student-avatar"
              >
                {hasAvatar ? (
                  <img
                    src={avatarUrl!}
                    alt={displayName}
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      const parent = e.currentTarget.parentElement;
                      if (parent) {
                        parent.classList.add('bg-gradient-to-br', 'from-purple-500', 'to-pink-500');
                      }
                    }}
                  />
                ) : null}
                {!hasAvatar && <span>{displayInitials}</span>}
              </div>
            );
          })}
        </div>
        <button
          type="button"
          onClick={onAddAluno}
          className="inline-flex h-10 w-10 items-center justify-center rounded-full border-2 border-white text-xl font-semibold text-white transition hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          aria-label="Cadastrar novo aluno"
          data-testid="add-student-btn"
        >
          +
        </button>
      </div>
    </div>
  );
}
