import { useCallback, useMemo, useState } from 'react';
import type { StepId, WizardState, WizardContextValue } from '../types';

const STEPS: StepId[] = ['aluno', 'turmasCombo', 'taxa', 'plano', 'financeiro', 'resumo'];

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

  const update = useCallback((patch: Partial<WizardState>) => {
    setState((prev) => ({ ...prev, ...patch }));
  }, []);

  const goNext = useCallback(() => {
    setStepIndex((i) => Math.min(i + 1, STEPS.length - 1));
  }, []);

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

  return useMemo(
    () => ({
      state,
      step: STEPS[stepIndex],
      steps: STEPS,
      canGoBack: stepIndex > 0,
      goNext,
      goBack,
      update,
      reset,
    }),
    [state, stepIndex, goNext, goBack, update, reset],
  );
}
