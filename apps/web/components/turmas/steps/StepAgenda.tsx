'use client';
import { useFormContext } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { SectionCard, StepHeader } from '../../alunos/wizard/ui';
// Ícone inline para evitar dependência externa se lucide-react não estiver instalado
const ClockIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

const DIAS = ['SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB', 'DOM'] as const;
interface WizardValues {
  diasSemana: string[];
  horaInicio: string;
  horaFim: string;
}

export default function StepAgenda() {
  const {
    setValue,
    watch,
    formState: { errors },
  } = useFormContext<WizardValues>();

  const dias = watch('diasSemana');
  const horaInicio = watch('horaInicio');
  const horaFim = watch('horaFim');

  function parseToMinutes(hhmm: string | undefined): number | null {
    if (!hhmm || !/^\d{2}:\d{2}$/.test(hhmm)) return null;
    const [h, m] = hhmm.split(':').map(Number);
    return h * 60 + m;
  }

  const minutosInicio = parseToMinutes(horaInicio);
  const minutosFim = parseToMinutes(horaFim);
  const intervaloValido =
    minutosInicio !== null && minutosFim !== null && minutosFim > minutosInicio;
  let duracaoLabel: string | null = null;
  if (intervaloValido) {
    const diff = minutosFim! - minutosInicio!;
    const h = Math.floor(diff / 60);
    const m = diff % 60;
    duracaoLabel =
      `Duração: ${h > 0 ? `${h}h` : ''}${m > 0 ? `${m}m` : h === 0 ? '0m' : ''}`.trim();
  }

  function maskTime(raw: string): string {
    const digits = raw.replace(/\D/g, '').slice(0, 4);
    if (!digits) return '';
    let h = digits.slice(0, 2);
    let m = digits.slice(2);
    if (h.length === 2) {
      let hi = parseInt(h, 10);
      if (hi > 23) hi = 23;
      h = hi.toString().padStart(2, '0');
    }
    if (m.length === 2) {
      let mi = parseInt(m, 10);
      if (mi > 59) mi = 59;
      m = mi.toString().padStart(2, '0');
    }
    if (digits.length <= 2) return h;
    return `${h}:${m}`;
  }

  function handleMaskedTime(value: string, field: keyof WizardValues) {
    const masked = maskTime(value);
    setValue(field, masked, { shouldValidate: true, shouldDirty: true });
  }

  function validateHorario(field: keyof WizardValues) {
    // Apenas valida para campos de hora
    if (field !== 'horaInicio' && field !== 'horaFim') return;
    const v = watch(field);
    if (typeof v !== 'string') return;
    if (v && /^\d{2}:\d{2}$/.test(v)) return;
    if (v && /^\d{4}$/.test(v)) {
      const norm = maskTime(v);
      setValue(field, norm, { shouldValidate: true });
    }
  }
  return (
    <SectionCard>
      <StepHeader title="Agenda & Horário" />
      <div className="space-y-4">
        <div className="space-y-1">
          <label className="text-xs text-slate-600">Dias da semana</label>
          <div className="flex flex-wrap gap-2">
            {DIAS.map((d) => {
              const ativo = dias?.includes(d);
              return (
                <button
                  key={d}
                  type="button"
                  onClick={() => {
                    const cur = Array.isArray(dias) ? dias : [];
                    setValue('diasSemana', ativo ? cur.filter((x) => x !== d) : [...cur, d]);
                  }}
                  className={`px-2 py-1 rounded border text-xs ${ativo ? 'bg-violet-600 text-white border-violet-700' : 'bg-white text-slate-700 border-slate-300'}`}
                >
                  {d}
                </button>
              );
            })}
          </div>
          {errors.diasSemana && <p className="text-xs text-red-600">Selecione ao menos um dia</p>}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-sm font-medium">Horário Início</label>
            <div className="relative">
              <ClockIcon
                className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
                aria-hidden="true"
              />
              <Input
                aria-label="Horário de início"
                placeholder="08:00"
                id="horaInicio"
                name="horaInicio"
                value={horaInicio || ''}
                onChange={(e) => handleMaskedTime(e.target.value, 'horaInicio')}
                onBlur={() => validateHorario('horaInicio')}
                inputMode="numeric"
                maxLength={5}
                className={`pl-8 transition-colors ${errors.horaInicio ? 'border-red-500 focus-visible:ring-red-500 animate-[pulse_1.4s_ease-in-out_infinite]' : ''}`}
              />
            </div>
            {errors.horaInicio && (
              <p className="text-xs text-red-600">{String(errors.horaInicio.message)}</p>
            )}
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Horário Fim</label>
            <div className="relative">
              <ClockIcon
                className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
                aria-hidden="true"
              />
              <Input
                aria-label="Horário de término"
                placeholder="09:30"
                id="horaFim"
                name="horaFim"
                value={horaFim || ''}
                onChange={(e) => handleMaskedTime(e.target.value, 'horaFim')}
                onBlur={() => validateHorario('horaFim')}
                inputMode="numeric"
                maxLength={5}
                className={`pl-8 transition-colors ${errors.horaFim ? 'border-red-500 focus-visible:ring-red-500 animate-[pulse_1.4s_ease-in-out_infinite]' : ''}`}
              />
            </div>
            {errors.horaFim && (
              <p className="text-xs text-red-600">{String(errors.horaFim.message)}</p>
            )}
          </div>
        </div>
        <div className="min-h-[22px]">
          {horaInicio && horaFim && !intervaloValido && (
            <p className="text-xs text-amber-600">
              Horário final deve ser maior que o horário inicial.
            </p>
          )}
          {intervaloValido && duracaoLabel && (
            <p className="text-xs text-slate-600 font-medium">{duracaoLabel}</p>
          )}
        </div>
      </div>
    </SectionCard>
  );
}
