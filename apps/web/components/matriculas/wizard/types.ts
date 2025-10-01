export type StepId = 'aluno' | 'turmasCombo' | 'plano' | 'financeiro' | 'resumo';

export interface WizardAluno {
  id: string;
  nome: string;
  dataNasc?: string;
  responsavel?: { id: string; nome: string } | null;
  ativo?: boolean;
}

export interface WizardState {
  contaId: string;
  aluno?: WizardAluno;
  modoTurmas: 'COMBO' | 'TURMAS';
  comboId?: string;
  turmaIds: string[];
  turmaLabel?: string; // label amigável da turma selecionada (MVP 1 turma)
  comboLabel?: string; // label amigável do combo selecionado
  planoId?: string;
  planoLabel?: string;
  planoValor?: number; // valor base do plano
  vencimentoDia?: number;
  descontoTipo?: 'FIXO' | 'PERCENTUAL';
  descontoValor?: number;
  taxaMatricula?: number;
  formaPagamento?: 'DINHEIRO' | 'PIX' | 'CARTAO' | 'BOLETO';
  criarCobranca: boolean;
  dataInicio?: string; // ISO ou yyyy-mm-dd
  confirmacaoRevisao: boolean;
}

export interface WizardContextValue {
  state: WizardState;
  step: StepId;
  steps: StepId[];
  canGoBack: boolean;
  goNext: () => void;
  goBack: () => void;
  update: (patch: Partial<WizardState>) => void;
  reset: (opts?: Partial<WizardState>) => void;
}
