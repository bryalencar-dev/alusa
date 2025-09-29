'use client';
import { useFormContext } from 'react-hook-form';
import { SectionCard, StepHeader } from '../../alunos/wizard/ui';
import { useLookups } from './lookups-context';

interface WizardValues {
  nome: string;
  modalidadeId: string;
  salaId: string;
  diasSemana: string[];
  horaInicio: string;
  horaFim: string;
  capacidade: number;
  professoresIds?: string[];
  observacao?: string;
}

export default function StepResumo() {
  const { getValues } = useFormContext<WizardValues>();
  const v = getValues();
  const { modalidades, salas } = useLookups();
  const modalidadeNome =
    modalidades.find((m) => m.id === v.modalidadeId)?.nome || v.modalidadeId || '-';
  const salaNome = salas.find((s) => s.id === v.salaId)?.nome || v.salaId || '-';
  function calcDuracao(hIni?: string, hFim?: string): string | null {
    if (!hIni || !hFim) return null;
    if (!/^\d{2}:\d{2}$/.test(hIni) || !/^\d{2}:\d{2}$/.test(hFim)) return null;
    const [hi, mi] = hIni.split(':').map(Number);
    const [hf, mf] = hFim.split(':').map(Number);
    const start = hi * 60 + mi;
    const end = hf * 60 + mf;
    if (end <= start) return null;
    const diff = end - start;
    const h = Math.floor(diff / 60);
    const m = diff % 60;
    if (h === 0) return `${m}m`;
    if (m === 0) return `${h}h`;
    return `${h}h${m}m`;
  }
  const duracao = calcDuracao(v.horaInicio, v.horaFim);
  return (
    <SectionCard>
      <StepHeader title="Resumo" />
      <div className="space-y-3 text-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <div>
            <strong>Nome:</strong> {v.nome}
          </div>
          <div>
            <strong>Modalidade:</strong> {modalidadeNome}
          </div>
          <div>
            <strong>Sala:</strong> {salaNome}
          </div>
          <div>
            <strong>Dias:</strong> {(v.diasSemana || []).join(', ') || '-'}
          </div>
          <div>
            <strong>Horário:</strong> {v.horaInicio} - {v.horaFim}
            {duracao && (
              <span className="ml-2 inline-block rounded bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                {duracao}
              </span>
            )}
          </div>
          <div>
            <strong>Capacidade:</strong> {v.capacidade}
          </div>
          <div className="md:col-span-2">
            <strong>Professores:</strong> {(v.professoresIds || []).length}
          </div>
          <div className="md:col-span-2">
            <strong>Observação:</strong> {v.observacao || '-'}
          </div>
        </div>
      </div>
    </SectionCard>
  );
}
