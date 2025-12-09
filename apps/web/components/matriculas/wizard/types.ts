export type StepId =
  | 'aluno'
  | 'turmasCombo'
  | 'taxa'
  | 'plano'
  | 'jurosMulta'
  | 'financeiro'
  | 'resumo';

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
  comboValor?: number; // valor do combo (R$)
  comboPeriodicidade?: string; // periodicidade do combo
  planoId?: string;
  planoLabel?: string;
  planoValor?: number; // valor base do plano
  vencimentoDia?: number;
  taxaMatricula?: number;
  taxaIsenta?: boolean;
  taxaJustificativa?: string;
  formaPagamentoTaxa?: 'DINHEIRO' | 'PIX' | 'CARTAO' | 'BOLETO';
  pagarTaxaAgora?: boolean; // Flag para pagar taxa imediatamente
  gerarCobrancaTaxa?: boolean;
  formaPagamento?: 'DINHEIRO' | 'PIX' | 'CARTAO' | 'BOLETO';
  criarCobranca: boolean;
  dataInicio?: string; // ISO ou yyyy-mm-dd
  dataFimContrato?: string; // ISO ou yyyy-mm-dd (data de fim do contrato - obrigatório)
  // Campos de juros, multa e desconto (conforme Asaas API)
  multaPercentual?: number; // fine.value - percentual da multa
  jurosMensal?: number; // interest.value - percentual de juros ao mês
  descontoAntecipado?: number; // discount.value - valor do desconto
  descontoTipo?: 'FIXED' | 'PERCENTAGE'; // discount.type - tipo do desconto
  prazoDesconto?: number; // discount.dueDateLimitDays - dias antes do vencimento
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
