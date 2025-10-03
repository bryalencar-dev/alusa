export type StepId = 'aluno' | 'turmasCombo' | 'taxa' | 'plano' | 'financeiro' | 'resumo';

export interface WizardAluno {
  id: string;
  nome: string;
  dataNasc?: string;
  responsavel?: { id: string; nome: string } | null;
  ativo?: boolean;
  cpf?: string;
  foto?: string;
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
  taxaIsenta?: boolean;
  taxaJustificativa?: string;
  pagarTaxaAgora?: boolean; // Flag para pagar taxa imediatamente
  gerarCobrancaTaxa?: boolean;
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
  update: (_patch: Partial<WizardState>) => void;
  reset: (_opts?: Partial<WizardState>) => void;
}
