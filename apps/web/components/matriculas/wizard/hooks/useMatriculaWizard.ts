import { useCallback, useMemo, useState } from 'react';
import type { StepId, WizardState, WizardContextValue } from '../types';

const ALL_STEPS: StepId[] = [
  'aluno',
  'turmasCombo',
  'taxa',
  'plano',
  'jurosMulta',
  'financeiro',
  'resumo',
];

// Steps quando Combo é selecionado (sem 'plano' - combo define valor/periodicidade)
function getSteps(modoTurmas: 'TURMAS' | 'COMBO'): StepId[] {
  if (modoTurmas === 'COMBO') {
    return ALL_STEPS.filter((step) => step !== 'plano');
  }
  return ALL_STEPS;
}

const initialState: WizardState = {
  contaId: '',
  modoTurmas: 'TURMAS',
  turmaIds: [],
  criarCobranca: true,
  confirmacaoRevisao: false,
  taxaIsenta: false,
  pagarTaxaAgora: false,
  gerarCobrancaTaxa: false,
};

export function useMatriculaWizard(contaId?: string): WizardContextValue {
  const [state, setState] = useState<WizardState>({ ...initialState, contaId: contaId ?? '' });
  const [stepIndex, setStepIndex] = useState(0);

  // Steps dinâmicos baseados no modo selecionado
  const steps = useMemo(() => getSteps(state.modoTurmas ?? 'TURMAS'), [state.modoTurmas]);

  const update = useCallback((patch: Partial<WizardState>) => {
    setState((prev) => ({ ...prev, ...patch }));
  }, []);

  const goNext = useCallback(() => {
    setStepIndex((i) => Math.min(i + 1, steps.length - 1));
  }, [steps.length]);

  const goBack = useCallback(() => {
    setStepIndex((i) => Math.max(i - 1, 0));
  }, []);

  const reset = useCallback(
    (patch?: Partial<WizardState>) => {
      setState({ ...initialState, contaId: contaId ?? '', ...patch });
      setStepIndex(0);
    },
    [contaId],
  );

  // Garantir que stepIndex não exceda o tamanho do array de steps
  const safeStepIndex = Math.min(stepIndex, steps.length - 1);

  return useMemo(
    () => ({
      state,
      step: steps[safeStepIndex],
      steps,
      canGoBack: safeStepIndex > 0,
      goNext,
      goBack,
      update,
      reset,
    }),
    [state, safeStepIndex, steps, goNext, goBack, update, reset],
  );
}
