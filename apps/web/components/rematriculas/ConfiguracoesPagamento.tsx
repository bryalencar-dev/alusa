'use client';

import { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PencilIcon } from '@heroicons/react/24/outline';
import { pushToast } from '@/components/ui/toast';
import useCurrentUser from '@/hooks/use-current-user';

interface ConfiguracoesPagamentoProps {
  matriculaId: string;
  asaasSubscriptionId?: string | null;
  vencimentoDia: number;
  formaPagamentoAtual?: string;
  jurosAtual?: number;
  jurosTipoAtual?: 'FIXED' | 'PERCENTAGE';
  multaAtual?: number;
  multaTipoAtual?: 'FIXED' | 'PERCENTAGE';
  descontoAtual?: number;
  descontoTipoAtual?: 'FIXED' | 'PERCENTAGE';
  prazoDescontoAtual?: number;
  onRefresh: () => void;
}

// Função para formatar valores percentuais
function formatPercentInput(value: string): string {
  const digits = value.replace(/\D/g, '');
  if (!digits) return '0,00';
  
  const num = parseInt(digits, 10);
  const intPart = Math.floor(num / 100);
  const decPart = (num % 100).toString().padStart(2, '0');
  
  return `${intPart},${decPart}`;
}

// Função para converter string formatada para número
function parsePercent(formatted: string): number {
  const normalized = formatted.replace(/\./g, '').replace(',', '.');
  const num = parseFloat(normalized);
  return isNaN(num) ? 0 : num;
}

// Função para formatar número para display
function numberToPercent(value?: number): string {
  if (!value) return '0,00';
  const intPart = Math.floor(value);
  const decPart = Math.round((value - intPart) * 100).toString().padStart(2, '0');
  return `${intPart},${decPart}`;
}

const FORMA_PAGAMENTO_LABELS: Record<string, string> = {
  BOLETO: 'Boleto Bancário',
  PIX: 'PIX',
  CREDIT_CARD: 'Cartão de Crédito',
  CARTAO_CREDITO: 'Cartão de Crédito',
  UNDEFINED: 'Pergunte ao cliente',
  INDEFINIDO: 'Pergunte ao cliente',
};

const sectionClass = 'space-y-4 rounded-xl border border-slate-200 bg-slate-50 px-5 py-4';
const labelClass = 'text-xs font-medium text-slate-600';
const controlClass =
  'flex h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 shadow-sm transition focus:border-[#A94DFF] focus:outline-none focus:ring-2 focus:ring-[#A94DFF]/30 disabled:bg-slate-50 disabled:text-slate-700 disabled:cursor-not-allowed';

export function ConfiguracoesPagamento({
  matriculaId,
  asaasSubscriptionId,
  vencimentoDia,
  formaPagamentoAtual,
  jurosAtual,
  jurosTipoAtual,
  multaAtual,
  multaTipoAtual,
  descontoAtual,
  descontoTipoAtual,
  prazoDescontoAtual,
  onRefresh,
}: ConfiguracoesPagamentoProps) {
  const { user } = useCurrentUser();
  const contaId = user?.contaId ?? null;

  const [editandoFormaPagamento, setEditandoFormaPagamento] = useState(false);
  const [editandoJurosMulta, setEditandoJurosMulta] = useState(false);
  const [salvando, setSalvando] = useState(false);

  // Estados para forma de pagamento
  const [novaFormaPagamento, setNovaFormaPagamento] = useState<string>('BOLETO');
  const [formaPagamentoDisplay, setFormaPagamentoDisplay] = useState<string>('Boleto Bancário');

  // Estados para juros, multa e desconto (padrão Asaas API)
  const [jurosPercentual, setJurosPercentual] = useState('2,00');
  const [jurosTipo, setJurosTipo] = useState<'FIXED' | 'PERCENTAGE'>('PERCENTAGE');
  const [multaPercentual, setMultaPercentual] = useState('2,00');
  const [multaTipo, setMultaTipo] = useState<'FIXED' | 'PERCENTAGE'>('PERCENTAGE');
  const [descontoPercentual, setDescontoPercentual] = useState('0,00');
  const [descontoTipo, setDescontoTipo] = useState<'FIXED' | 'PERCENTAGE'>('PERCENTAGE');
  const [prazoDesconto, setPrazoDesconto] = useState(0);
  
  // Limites segundo documentação Asaas
  const LIMITE_JUROS_MAX = 10; // 10% ao mês (máximo Asaas)
  const LIMITE_MULTA_RECOMENDADO = 2; // 2% (recomendação legal)
  const LIMITE_MULTA_MAX = 10; // 10% (máximo técnico)
  
  // Validações
  const jurosValor = parsePercent(jurosPercentual);
  const multaValor = parsePercent(multaPercentual);
  const jurosExcedeLimite = jurosValor > LIMITE_JUROS_MAX;
  const multaExcedeRecomendado = multaValor > LIMITE_MULTA_RECOMENDADO;
  const multaExcedeMaximo = multaValor > LIMITE_MULTA_MAX;

  // Inicializar valores ao carregar (apenas quando não está editando)
  useEffect(() => {
    if (formaPagamentoAtual) {
      setNovaFormaPagamento(formaPagamentoAtual);
      setFormaPagamentoDisplay(FORMA_PAGAMENTO_LABELS[formaPagamentoAtual] || formaPagamentoAtual);
    }
    
    // Só atualiza os valores de juros/multa/desconto se não estiver editando
    if (!editandoJurosMulta) {
      console.log('🔵 [FRONTEND] useEffect atualizando valores do servidor:', {
        jurosAtual,
        jurosTipoAtual,
        multaAtual,
        multaTipoAtual,
        descontoAtual,
        descontoTipoAtual,
        prazoDescontoAtual,
      });
      
      if (jurosAtual !== undefined) {
        setJurosPercentual(numberToPercent(jurosAtual));
      }
      if (jurosTipoAtual) {
        setJurosTipo(jurosTipoAtual);
      }
      if (multaAtual !== undefined) {
        setMultaPercentual(numberToPercent(multaAtual));
      }
      if (multaTipoAtual) {
        setMultaTipo(multaTipoAtual);
      }
      if (descontoAtual !== undefined) {
        setDescontoPercentual(numberToPercent(descontoAtual));
      }
      if (descontoTipoAtual) {
        setDescontoTipo(descontoTipoAtual);
      }
      if (prazoDescontoAtual !== undefined) {
        setPrazoDesconto(prazoDescontoAtual);
      }
    } else {
      console.log('🟡 [FRONTEND] useEffect pulou atualização (editando)');
    }
  }, [formaPagamentoAtual, jurosAtual, jurosTipoAtual, multaAtual, multaTipoAtual, descontoAtual, descontoTipoAtual, prazoDescontoAtual, editandoJurosMulta]);

  const handleCancelarFormaPagamento = useCallback(() => {
    if (formaPagamentoAtual) {
      setNovaFormaPagamento(formaPagamentoAtual);
    }
    setEditandoFormaPagamento(false);
  }, [formaPagamentoAtual]);

  const handleCancelarJurosMulta = useCallback(() => {
    if (jurosAtual !== undefined) {
      setJurosPercentual(numberToPercent(jurosAtual));
    }
    if (jurosTipoAtual) {
      setJurosTipo(jurosTipoAtual);
    } else {
      setJurosTipo('PERCENTAGE');
    }
    if (multaAtual !== undefined) {
      setMultaPercentual(numberToPercent(multaAtual));
    }
    if (multaTipoAtual) {
      setMultaTipo(multaTipoAtual);
    } else {
      setMultaTipo('PERCENTAGE');
    }
    if (descontoAtual !== undefined) {
      setDescontoPercentual(numberToPercent(descontoAtual));
    } else {
      setDescontoPercentual('0,00');
    }
    if (descontoTipoAtual) {
      setDescontoTipo(descontoTipoAtual);
    } else {
      setDescontoTipo('PERCENTAGE');
    }
    if (prazoDescontoAtual !== undefined) {
      setPrazoDesconto(prazoDescontoAtual);
    } else {
      setPrazoDesconto(0);
    }
    setEditandoJurosMulta(false);
  }, [jurosAtual, jurosTipoAtual, multaAtual, multaTipoAtual, descontoAtual, descontoTipoAtual, prazoDescontoAtual]);

  const handleSalvarFormaPagamento = useCallback(async () => {
    if (!asaasSubscriptionId) {
      pushToast({
        title: 'Erro',
        description: 'Esta matrícula não possui assinatura no Asaas.',
        variant: 'error',
      });
      return;
    }

    if (!contaId) {
      pushToast({
        title: 'Erro',
        description: 'Usuário não autenticado.',
        variant: 'error',
      });
      return;
    }

    try {
      setSalvando(true);

      const res = await fetch(`/api/matriculas/${matriculaId}/forma-pagamento`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          billingType: novaFormaPagamento,
          contaId,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error?.message || 'Erro ao atualizar forma de pagamento');
      }

      pushToast({
        title: 'Sucesso',
        description: 'Forma de pagamento atualizada no Asaas. Próximas cobranças usarão esta forma.',
        variant: 'success',
      });

      setFormaPagamentoDisplay(FORMA_PAGAMENTO_LABELS[novaFormaPagamento] || novaFormaPagamento);
      setEditandoFormaPagamento(false);
      onRefresh();
    } catch (error) {
      pushToast({
        title: 'Erro ao atualizar',
        description: (error as Error).message || 'Não foi possível atualizar a forma de pagamento.',
        variant: 'error',
      });
    } finally {
      setSalvando(false);
    }
  }, [asaasSubscriptionId, matriculaId, novaFormaPagamento, contaId, onRefresh]);

  const handleSalvarJurosMulta = useCallback(async () => {
    if (!asaasSubscriptionId) {
      pushToast({
        title: 'Erro',
        description: 'Esta matrícula não possui assinatura no Asaas.',
        variant: 'error',
      });
      return;
    }

    if (!contaId) {
      pushToast({
        title: 'Erro',
        description: 'Usuário não autenticado.',
        variant: 'error',
      });
      return;
    }

    const juros = parsePercent(jurosPercentual);
    const multa = parsePercent(multaPercentual);
    const desconto = parsePercent(descontoPercentual);
    
    console.log('🔵 [FRONTEND] Iniciando salvamento de juros/multa/desconto:', {
      jurosPercentual,
      jurosTipo,
      multaPercentual,
      multaTipo,
      descontoPercentual,
      descontoTipo,
      prazoDesconto,
      jurosValor: juros,
      multaValor: multa,
      descontoValor: desconto,
      matriculaId,
      asaasSubscriptionId,
    });
    
    // Validar limites (apenas para PERCENTAGE)
    if (jurosTipo === 'PERCENTAGE' && juros > LIMITE_JUROS_MAX) {
      pushToast({
        title: 'Juros acima do limite',
        description: `O Asaas permite juros de até ${LIMITE_JUROS_MAX}% ao mês. Por favor, ajuste o valor.`,
        variant: 'error',
      });
      return;
    }
    
    if (multaTipo === 'PERCENTAGE' && multa > LIMITE_MULTA_MAX) {
      pushToast({
        title: 'Multa acima do limite',
        description: `O Asaas permite multa de até ${LIMITE_MULTA_MAX}%. Por favor, ajuste o valor.`,
        variant: 'error',
      });
      return;
    }

    try {
      setSalvando(true);

      const payload: {
        interest: { value: number; type: 'FIXED' | 'PERCENTAGE' };
        fine: { value: number; type: 'FIXED' | 'PERCENTAGE' };
        discount?: { value: number; type: 'FIXED' | 'PERCENTAGE'; dueDateLimitDays: number };
        contaId: string;
      } = {
        interest: {
          value: juros,
          type: jurosTipo,
        },
        fine: {
          value: multa,
          type: multaTipo,
        },
        contaId,
      };

      // Adicionar desconto apenas se houver valor
      if (desconto > 0) {
        payload.discount = {
          value: desconto,
          type: descontoTipo,
          dueDateLimitDays: prazoDesconto,
        };
      }

      console.log('🔵 [FRONTEND] Payload a ser enviado:', JSON.stringify(payload, null, 2));
      console.log('🔵 [FRONTEND] URL:', `/api/matriculas/${matriculaId}/juros-multa`);

      const res = await fetch(`/api/matriculas/${matriculaId}/juros-multa`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      console.log('🔵 [FRONTEND] Resposta do servidor:', {
        status: res.status,
        statusText: res.statusText,
        ok: res.ok,
      });

      if (!res.ok) {
        const errorData = await res.json();
        console.error('🔴 [FRONTEND] Erro na resposta:', errorData);
        throw new Error(errorData.error?.message || 'Erro ao atualizar juros e multa');
      }

      const responseData = await res.json();
      console.log('🟢 [FRONTEND] Resposta de sucesso:', responseData);

      pushToast({
        title: 'Sucesso',
        description: desconto > 0 
          ? 'Juros, multa e desconto atualizados no Asaas. Próximas cobranças usarão estes valores.'
          : 'Juros e multa atualizados no Asaas. Próximas cobranças usarão estes valores.',
        variant: 'success',
      });

      console.log('🔵 [FRONTEND] Chamando onRefresh para recarregar dados...');
      
      // Primeiro chama onRefresh para buscar dados atualizados do servidor
      await onRefresh();
      
      // Depois desabilita o modo de edição
      setEditandoJurosMulta(false);
      console.log('🟢 [FRONTEND] onRefresh chamado com sucesso');
    } catch (error) {
      pushToast({
        title: 'Erro ao atualizar',
        description: (error as Error).message || 'Não foi possível atualizar juros e multa.',
        variant: 'error',
      });
    } finally {
      setSalvando(false);
    }
  }, [asaasSubscriptionId, matriculaId, jurosPercentual, multaPercentual, contaId, onRefresh, LIMITE_JUROS_MAX, LIMITE_MULTA_MAX]);

  return (
    <div className={sectionClass}>
      <span className="text-sm font-semibold text-slate-700">Configurações de Pagamento</span>
      <p className="text-xs text-slate-600 mb-4">
        Configure forma de pagamento, juros, multas e descontos da assinatura no Asaas
      </p>

      <div className="space-y-6">
        {/* Informações Gerais */}
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className={labelClass}>Dia de Vencimento</label>
              <Input
                value={`Dia ${vencimentoDia}`}
                disabled
                className={controlClass}
                readOnly
              />
            </div>
            <div className="space-y-1">
              <label className={labelClass}>Forma de Pagamento Atual</label>
              <Input
                value={formaPagamentoDisplay}
                disabled
                className={controlClass}
                readOnly
              />
            </div>
          </div>
        </div>

        {/* Forma de Pagamento */}
        <div className="space-y-3 pt-4 border-t border-slate-200">
          <div className="flex items-start justify-between">
            <div>
              <label className="text-sm font-semibold text-slate-700">
                Alterar Forma de Pagamento
              </label>
              <p className="text-xs text-slate-600 mt-1">
                Altera a forma de pagamento das próximas cobranças
              </p>
            </div>
            {!editandoFormaPagamento ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setEditandoFormaPagamento(true)}
                disabled={!asaasSubscriptionId}
                className="text-[#A94DFF] hover:text-[#A94DFF]/90"
              >
                <PencilIcon className="h-4 w-4 mr-2" />
                Editar
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCancelarFormaPagamento}
                  disabled={salvando}
                  className="border-slate-200 bg-white text-slate-600 hover:bg-slate-100"
                >
                  Cancelar
                </Button>
                <Button
                  size="sm"
                  onClick={handleSalvarFormaPagamento}
                  disabled={salvando}
                  className="bg-[#A94DFF] text-white shadow-none hover:bg-[#A94DFF]/90"
                >
                  {salvando ? 'Salvando...' : 'Salvar'}
                </Button>
              </div>
            )}
          </div>

          <div className="space-y-1">
            <label htmlFor="formaPagamento" className={labelClass}>
              Selecione a forma de pagamento
            </label>
            <Select
              value={novaFormaPagamento}
              onValueChange={setNovaFormaPagamento}
              disabled={!editandoFormaPagamento}
            >
              <SelectTrigger className="h-10 w-full rounded-lg border border-slate-200 bg-white text-sm text-slate-900 shadow-sm focus:border-[#A94DFF] focus:outline-none focus:ring-2 focus:ring-[#A94DFF]/30 disabled:bg-slate-50 disabled:text-slate-700 disabled:cursor-not-allowed">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="BOLETO">Boleto Bancário</SelectItem>
                <SelectItem value="PIX">PIX</SelectItem>
                <SelectItem value="CREDIT_CARD">Cartão de Crédito</SelectItem>
                <SelectItem value="UNDEFINED">Pergunte ao cliente</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {editandoFormaPagamento && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-xs text-blue-800">
                <strong>Importante:</strong> Esta alteração afeta apenas as próximas cobranças. Cobranças já geradas não serão alteradas.
              </p>
            </div>
          )}
        </div>

        {/* Juros, Multa e Desconto */}
        <div className="space-y-3 pt-4 border-t border-slate-200">
          <div className="flex items-start justify-between">
            <div>
              <label className="text-sm font-semibold text-slate-700">
                Juros, Multa e Desconto
              </label>
              <p className="text-xs text-slate-600 mt-1">
                Configure valores percentuais para cobranças
              </p>
            </div>
            {!editandoJurosMulta ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  console.log('🔵 [FRONTEND] Ativando modo de edição');
                  console.log('🔵 [FRONTEND] Valores atuais antes de editar:', {
                    jurosPercentual,
                    multaPercentual,
                    descontoPercentual,
                  });
                  setEditandoJurosMulta(true);
                }}
                disabled={!asaasSubscriptionId}
                className="text-[#A94DFF] hover:text-[#A94DFF]/90"
              >
                <PencilIcon className="h-4 w-4 mr-2" />
                Editar
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCancelarJurosMulta}
                  disabled={salvando}
                  className="border-slate-200 bg-white text-slate-600 hover:bg-slate-100"
                >
                  Cancelar
                </Button>
                <Button
                  size="sm"
                  onClick={handleSalvarJurosMulta}
                  disabled={salvando}
                  className="bg-[#A94DFF] text-white shadow-none hover:bg-[#A94DFF]/90"
                >
                  {salvando ? 'Salvando...' : 'Salvar'}
                </Button>
              </div>
            )}
          </div>

          {/* Juros - Valor e Tipo */}
          <div className="space-y-3 p-4 bg-slate-50/50 rounded-lg border border-slate-100">
            <label className="text-xs font-semibold text-slate-700">Juros ao Mês</label>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label htmlFor="jurosPercentual" className={labelClass}>
                  Valor
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-500">
                    {jurosTipo === 'PERCENTAGE' ? '%' : 'R$'}
                  </span>
                  <Input
                    id="jurosPercentual"
                    type="text"
                    value={jurosPercentual}
                    onChange={(e) => {
                      if (!editandoJurosMulta) return;
                      const rawValue = e.target.value;
                      if (rawValue === '' && jurosPercentual !== '0,00') return;
                      setJurosPercentual(formatPercentInput(rawValue));
                    }}
                    disabled={!editandoJurosMulta}
                    className={`pl-8 text-right h-10 rounded-lg border px-3 text-sm shadow-sm transition focus:outline-none focus:ring-2 ${
                      jurosTipo === 'PERCENTAGE' && jurosExcedeLimite && editandoJurosMulta
                        ? 'border-red-300 bg-red-50 text-red-900 focus:border-red-400 focus:ring-red-400/30'
                        : 'border-slate-200 bg-white text-slate-900 focus:border-[#A94DFF] focus:ring-[#A94DFF]/30'
                    } disabled:bg-slate-50 disabled:text-slate-700 disabled:cursor-not-allowed`}
                    placeholder="2,00"
                  />
                </div>
                {editandoJurosMulta && jurosTipo === 'PERCENTAGE' && jurosExcedeLimite && (
                  <p className="text-xs text-red-600 mt-1">
                    Limite máximo: {LIMITE_JUROS_MAX}% ao mês
                  </p>
                )}
              </div>
              <div className="space-y-1">
                <label htmlFor="jurosTipo" className={labelClass}>
                  Tipo
                </label>
                <Select
                  value={jurosTipo}
                  onValueChange={(v) => setJurosTipo(v as 'FIXED' | 'PERCENTAGE')}
                  disabled={!editandoJurosMulta}
                >
                  <SelectTrigger className={controlClass}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PERCENTAGE">Percentual (%)</SelectItem>
                    <SelectItem value="FIXED">Valor Fixo (R$)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Multa - Valor e Tipo */}
          <div className="space-y-3 p-4 bg-slate-50/50 rounded-lg border border-slate-100">
            <label className="text-xs font-semibold text-slate-700">Multa por Atraso</label>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label htmlFor="multaPercentual" className={labelClass}>
                  Valor
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-500">
                    {multaTipo === 'PERCENTAGE' ? '%' : 'R$'}
                  </span>
                  <Input
                    id="multaPercentual"
                    type="text"
                    value={multaPercentual}
                    onChange={(e) => {
                      if (!editandoJurosMulta) return;
                      const rawValue = e.target.value;
                      if (rawValue === '' && multaPercentual !== '0,00') return;
                      setMultaPercentual(formatPercentInput(rawValue));
                    }}
                    disabled={!editandoJurosMulta}
                    className={`pl-8 text-right h-10 rounded-lg border px-3 text-sm shadow-sm transition focus:outline-none focus:ring-2 ${
                      multaTipo === 'PERCENTAGE' && multaExcedeMaximo && editandoJurosMulta
                        ? 'border-red-300 bg-red-50 text-red-900 focus:border-red-400 focus:ring-red-400/30'
                        : multaTipo === 'PERCENTAGE' && multaExcedeRecomendado && editandoJurosMulta
                        ? 'border-amber-300 bg-amber-50 text-amber-900 focus:border-amber-400 focus:ring-amber-400/30'
                        : 'border-slate-200 bg-white text-slate-900 focus:border-[#A94DFF] focus:ring-[#A94DFF]/30'
                    } disabled:bg-slate-50 disabled:text-slate-700 disabled:cursor-not-allowed`}
                    placeholder="2,00"
                  />
                </div>
                {editandoJurosMulta && multaTipo === 'PERCENTAGE' && multaExcedeMaximo && (
                  <p className="text-xs text-red-600 mt-1">
                    Limite máximo: {LIMITE_MULTA_MAX}%
                  </p>
                )}
                {editandoJurosMulta && multaTipo === 'PERCENTAGE' && !multaExcedeMaximo && multaExcedeRecomendado && (
                  <p className="text-xs text-amber-600 mt-1">
                    Atenção: Recomendado até {LIMITE_MULTA_RECOMENDADO}%
                  </p>
                )}
              </div>
              <div className="space-y-1">
                <label htmlFor="multaTipo" className={labelClass}>
                  Tipo
                </label>
                <Select
                  value={multaTipo}
                  onValueChange={(v) => setMultaTipo(v as 'FIXED' | 'PERCENTAGE')}
                  disabled={!editandoJurosMulta}
                >
                  <SelectTrigger className={controlClass}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PERCENTAGE">Percentual (%)</SelectItem>
                    <SelectItem value="FIXED">Valor Fixo (R$)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Desconto - Valor, Tipo e Prazo */}
          <div className="space-y-3 p-4 bg-slate-50/50 rounded-lg border border-slate-100">
            <label className="text-xs font-semibold text-slate-700">Desconto Antecipado</label>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <label htmlFor="descontoPercentual" className={labelClass}>
                  Valor
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-500">
                    {descontoTipo === 'PERCENTAGE' ? '%' : 'R$'}
                  </span>
                  <Input
                    id="descontoPercentual"
                    type="text"
                    value={descontoPercentual}
                    onChange={(e) => {
                      if (!editandoJurosMulta) return;
                      setDescontoPercentual(formatPercentInput(e.target.value));
                    }}
                    disabled={!editandoJurosMulta}
                    className="pl-8 text-right h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 shadow-sm transition focus:border-[#A94DFF] focus:outline-none focus:ring-2 focus:ring-[#A94DFF]/30 disabled:bg-slate-50 disabled:text-slate-700 disabled:cursor-not-allowed"
                    placeholder="0,00"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label htmlFor="descontoTipo" className={labelClass}>
                  Tipo
                </label>
                <Select
                  value={descontoTipo}
                  onValueChange={(v) => setDescontoTipo(v as 'FIXED' | 'PERCENTAGE')}
                  disabled={!editandoJurosMulta}
                >
                  <SelectTrigger className={controlClass}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PERCENTAGE">Percentual (%)</SelectItem>
                    <SelectItem value="FIXED">Valor Fixo (R$)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <label htmlFor="prazoDesconto" className={labelClass}>
                  Prazo (dias)
                </label>
                <Input
                  id="prazoDesconto"
                  type="number"
                  min={0}
                  max={30}
                  value={prazoDesconto}
                  onChange={(e) => setPrazoDesconto(parseInt(e.target.value) || 0)}
                  disabled={!editandoJurosMulta}
                  className={controlClass}
                  placeholder="0"
                />
              </div>
            </div>
            <p className="text-xs text-slate-500">
              {prazoDesconto === 0 
                ? 'Desconto válido até o vencimento' 
                : `Desconto válido até ${prazoDesconto} dias antes do vencimento`}
            </p>
          </div>

          {editandoJurosMulta && (
            <>
              {/* Preview de Cálculo */}
              <div className="p-4 bg-gradient-to-br from-purple-50 to-blue-50 border border-purple-200 rounded-lg">
                <h4 className="text-xs font-semibold text-slate-700 mb-3">
                  Exemplo de Cálculo (cobrança de R$ 150,00)
                </h4>
                <div className="grid grid-cols-3 gap-4 text-xs">
                  {/* Juros */}
                  <div className="space-y-1">
                    <p className="font-medium text-slate-600">Juros (10 dias)</p>
                    <p className="text-slate-700">
                      R$ {(150 * (jurosValor / 100 / 30) * 10).toFixed(2)}
                    </p>
                    <p className="text-slate-500 text-[10px]">
                      {jurosValor}% ÷ 30 × 10 dias
                    </p>
                  </div>
                  
                  {/* Multa */}
                  <div className="space-y-1">
                    <p className="font-medium text-slate-600">Multa (única)</p>
                    <p className="text-slate-700">
                      R$ {(150 * (multaValor / 100)).toFixed(2)}
                    </p>
                    <p className="text-slate-500 text-[10px]">
                      {multaValor}% do valor
                    </p>
                  </div>
                  
                  {/* Desconto */}
                  <div className="space-y-1">
                    <p className="font-medium text-slate-600">Desconto (antecipado)</p>
                    <p className="text-green-700">
                      - R$ {(150 * (parsePercent(descontoPercentual) / 100)).toFixed(2)}
                    </p>
                    <p className="text-slate-500 text-[10px]">
                      {parsePercent(descontoPercentual)}% desconto
                    </p>
                  </div>
                </div>
                
                <div className="mt-3 pt-3 border-t border-purple-200">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-medium text-slate-600">Total com 10 dias de atraso:</span>
                    <span className="text-sm font-bold text-slate-800">
                      R$ {(150 + (150 * (jurosValor / 100 / 30) * 10) + (150 * (multaValor / 100))).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-xs font-medium text-slate-600">Total com desconto (antecipado):</span>
                    <span className="text-sm font-bold text-green-700">
                      R$ {(150 - (150 * (parsePercent(descontoPercentual) / 100))).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {!asaasSubscriptionId && (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-xs text-amber-800">
              <strong>Atenção:</strong> Esta matrícula não possui assinatura no Asaas. As configurações de pagamento não podem ser editadas.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
