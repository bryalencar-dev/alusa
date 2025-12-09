/**
 * Service central para operações financeiras com Asaas
 *
 * Este módulo centraliza todas as operações financeiras relacionadas
 * a cobranças, assinaturas e pagamentos no Asaas.
 *
 * @module financeiroService
 */

import { z } from 'zod';
import { getAsaasClient, getAsaasClientForConta } from './client';
import type { AsaasPayment } from './payment';

// ============================================================================
// SCHEMAS DE VALIDAÇÃO
// ============================================================================

/**
 * Schema para deletar cobrança
 */
export const deleteCobrancaSchema = z.object({
  paymentId: z.string().min(1, 'ID do pagamento é obrigatório'),
  contaId: z.string().optional(),
});

export type DeleteCobrancaInput = z.infer<typeof deleteCobrancaSchema>;

/**
 * Schema para pausar assinatura
 */
export const pauseAssinaturaSchema = z.object({
  subscriptionId: z.string().min(1, 'ID da assinatura é obrigatório'),
  contaId: z.string().optional(),
});

export type PauseAssinaturaInput = z.infer<typeof pauseAssinaturaSchema>;

/**
 * Schema para reenviar cobrança
 */
export const reenviarCobrancaSchema = z.object({
  paymentId: z.string().min(1, 'ID do pagamento é obrigatório'),
  tipo: z.enum(['EMAIL', 'SMS', 'WHATSAPP'], {
    errorMap: () => ({ message: 'Tipo deve ser EMAIL, SMS ou WHATSAPP' }),
  }),
  contaId: z.string().optional(),
});

export type ReenviarCobrancaInput = z.infer<typeof reenviarCobrancaSchema>;

/**
 * Schema para gerar segunda via
 */
export const gerarSegundaViaSchema = z.object({
  paymentId: z.string().min(1, 'ID do pagamento é obrigatório'),
  contaId: z.string().optional(),
});

export type GerarSegundaViaInput = z.infer<typeof gerarSegundaViaSchema>;

/**
 * Schema para estornar cobrança
 */
export const refundCobrancaSchema = z.object({
  paymentId: z.string().min(1, 'ID do pagamento é obrigatório'),
  value: z.number().positive('Valor deve ser maior que zero').optional(),
  description: z.string().optional(),
  contaId: z.string().optional(),
});

export type RefundCobrancaInput = z.infer<typeof refundCobrancaSchema>;

/**
 * Schema para confirmar pagamento manual
 */
export const confirmarPagamentoManualSchema = z.object({
  paymentId: z.string().min(1, 'ID do pagamento é obrigatório'),
  paymentDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data deve estar no formato YYYY-MM-DD'),
  value: z.number().positive('Valor deve ser maior que zero'),
  notifyCustomer: z.boolean().optional(),
  contaId: z.string().optional(),
});

export type ConfirmarPagamentoManualInput = z.infer<typeof confirmarPagamentoManualSchema>;

/**
 * Schema para reativar assinatura
 */
export const reativarAssinaturaSchema = z.object({
  customer: z.string().min(1, 'ID do cliente é obrigatório'),
  billingType: z.enum(['BOLETO', 'CREDIT_CARD', 'PIX', 'UNDEFINED']),
  nextDueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data deve estar no formato YYYY-MM-DD'),
  value: z.number().positive('Valor deve ser maior que zero'),
  cycle: z.enum([
    'WEEKLY',
    'BIWEEKLY',
    'MONTHLY',
    'BIMONTHLY',
    'QUARTERLY',
    'SEMIANNUALLY',
    'YEARLY',
  ]),
  description: z.string().optional(),
  contaId: z.string().optional(),
});

export type ReativarAssinaturaInput = z.infer<typeof reativarAssinaturaSchema>;

// ============================================================================
// TIPOS DE RESPOSTA
// ============================================================================

export interface FinanceiroActionResponse {
  success: boolean;
  message: string;
  data?: unknown;
}

export interface SegundaViaResponse {
  bankSlipUrl?: string;
  invoiceUrl?: string;
  pixQrCodeUrl?: string;
  pixCopyPaste?: string;
}

// ============================================================================
// FUNÇÕES DO SERVICE
// ============================================================================

/**
 * Deleta uma cobrança no Asaas
 *
 * @see https://docs.asaas.com/reference/deletar-cobranca
 *
 * @param input - Dados para deletar cobrança
 * @returns Resposta da operação
 *
 * @example
 * ```ts
 * const result = await deleteCobranca({
 *   paymentId: 'pay_123456',
 *   contaId: 'conta-uuid',
 * });
 *
 * if (result.success) {
 *   console.log('Cobrança deletada com sucesso');
 * }
 * ```
 */
export async function deleteCobranca(
  input: DeleteCobrancaInput,
): Promise<FinanceiroActionResponse> {
  try {
    const validated = deleteCobrancaSchema.parse(input);
    const client = validated.contaId
      ? await getAsaasClientForConta(validated.contaId)
      : getAsaasClient();

    await client.delete(`/payments/${validated.paymentId}`);

    return {
      success: true,
      message: 'Cobrança deletada com sucesso',
    };
  } catch (error) {
    console.error('[financeiroService] Erro ao deletar cobrança:', error);

    if (error instanceof z.ZodError) {
      return {
        success: false,
        message: error.errors[0]?.message || 'Dados inválidos',
      };
    }

    return {
      success: false,
      message: 'Erro ao deletar cobrança. Por favor, tente novamente.',
    };
  }
}

/**
 * Pausa (inativa) uma assinatura no Asaas
 *
 * @see https://docs.asaas.com/reference/atualizar-assinatura-existente
 *
 * @remarks
 * - Usa PUT /subscriptions/{id} com status: INACTIVE
 * - A assinatura para de gerar novas cobranças enquanto estiver INACTIVE
 * - Cobranças já geradas não são afetadas
 * - Para reativar, use reativarAssinatura com uma nova nextDueDate
 *
 * @param input - Dados para pausar assinatura
 * @returns Resposta da operação
 *
 * @example
 * ```ts
 * const result = await pauseAssinatura({
 *   subscriptionId: 'sub_123456',
 *   contaId: 'conta-uuid',
 * });
 *
 * if (result.success) {
 *   console.log('Assinatura pausada com sucesso');
 * }
 * ```
 */
export async function pauseAssinatura(
  input: PauseAssinaturaInput,
): Promise<FinanceiroActionResponse> {
  try {
    const validated = pauseAssinaturaSchema.parse(input);
    const client = validated.contaId
      ? await getAsaasClientForConta(validated.contaId)
      : getAsaasClient();

    // PUT com status INACTIVE para pausar (não DELETE que remove a assinatura)
    await client.put(`/subscriptions/${validated.subscriptionId}`, {
      status: 'INACTIVE',
    });

    return {
      success: true,
      message: 'Assinatura pausada com sucesso. Novas cobranças não serão geradas até a reativação.',
    };
  } catch (error) {
    console.error('[financeiroService] Erro ao pausar assinatura:', error);

    if (error instanceof z.ZodError) {
      return {
        success: false,
        message: error.errors[0]?.message || 'Dados inválidos',
      };
    }

    return {
      success: false,
      message: 'Erro ao pausar assinatura. Por favor, tente novamente.',
    };
  }
}

/**
 * Reenvia notificação de cobrança (Email, SMS ou WhatsApp)
 *
 * @see https://docs.asaas.com/reference/enviar-notificacao-de-cobranca
 *
 * @param input - Dados para reenvio
 * @returns Resposta da operação
 *
 * @example
 * ```ts
 * const result = await reenviarCobranca({
 *   paymentId: 'pay_123456',
 *   tipo: 'WHATSAPP',
 *   contaId: 'conta-uuid',
 * });
 *
 * if (result.success) {
 *   console.log('Cobrança reenviada via WhatsApp');
 * }
 * ```
 */
export async function reenviarCobranca(
  input: ReenviarCobrancaInput,
): Promise<FinanceiroActionResponse> {
  try {
    const validated = reenviarCobrancaSchema.parse(input);
    const client = validated.contaId
      ? await getAsaasClientForConta(validated.contaId)
      : getAsaasClient();

    // Determina o endpoint baseado no tipo
    const endpointMap = {
      EMAIL: `/payments/${validated.paymentId}/sendEmail`,
      SMS: `/payments/${validated.paymentId}/sendSms`,
      WHATSAPP: `/payments/${validated.paymentId}/sendWhatsApp`,
    };

    const endpoint = endpointMap[validated.tipo];

    await client.post(endpoint, {});

    const mensagemMap = {
      EMAIL: 'Cobrança reenviada por e-mail com sucesso',
      SMS: 'Cobrança reenviada por SMS com sucesso',
      WHATSAPP: 'Cobrança reenviada por WhatsApp com sucesso',
    };

    return {
      success: true,
      message: mensagemMap[validated.tipo],
    };
  } catch (error) {
    console.error('[financeiroService] Erro ao reenviar cobrança:', error);

    if (error instanceof z.ZodError) {
      return {
        success: false,
        message: error.errors[0]?.message || 'Dados inválidos',
      };
    }

    return {
      success: false,
      message: 'Erro ao reenviar cobrança. Por favor, tente novamente.',
    };
  }
}

/**
 * Gera segunda via (busca URLs de boleto, PIX ou invoice)
 *
 * @see https://docs.asaas.com/reference/recuperar-uma-unica-cobranca
 *
 * @param input - Dados para gerar segunda via
 * @returns URLs disponíveis para pagamento
 *
 * @example
 * ```ts
 * const result = await gerarSegundaVia({
 *   paymentId: 'pay_123456',
 *   contaId: 'conta-uuid',
 * });
 *
 * if (result.success && result.data) {
 *   const { bankSlipUrl, pixCopyPaste } = result.data as SegundaViaResponse;
 *   console.log('URL do boleto:', bankSlipUrl);
 *   console.log('PIX copia e cola:', pixCopyPaste);
 * }
 * ```
 */
export async function gerarSegundaVia(
  input: GerarSegundaViaInput,
): Promise<FinanceiroActionResponse> {
  try {
    const validated = gerarSegundaViaSchema.parse(input);
    const client = validated.contaId
      ? await getAsaasClientForConta(validated.contaId)
      : getAsaasClient();

    // Busca os dados do pagamento
    const paymentResponse = await client.get<AsaasPayment>(`/payments/${validated.paymentId}`);
    const payment = paymentResponse.data;

    const result: SegundaViaResponse = {};

    // Se for boleto
    if (payment.billingType === 'BOLETO' && payment.bankSlipUrl) {
      result.bankSlipUrl = payment.bankSlipUrl;
    }

    // Se for PIX, busca QR Code
    if (payment.billingType === 'PIX') {
      try {
        const pixResponse = await client.get<{
          encodedImage?: string;
          payload?: string;
        }>(`/payments/${validated.paymentId}/pixQrCode`);

        if (pixResponse.data.encodedImage) {
          result.pixQrCodeUrl = `data:image/png;base64,${pixResponse.data.encodedImage}`;
        }
        if (pixResponse.data.payload) {
          result.pixCopyPaste = pixResponse.data.payload;
        }
      } catch (pixError) {
        console.warn('[financeiroService] Erro ao buscar QR Code PIX:', pixError);
      }
    }

    // Invoice URL sempre disponível
    if (payment.invoiceUrl) {
      result.invoiceUrl = payment.invoiceUrl;
    }

    return {
      success: true,
      message: 'Segunda via gerada com sucesso',
      data: result,
    };
  } catch (error) {
    console.error('[financeiroService] Erro ao gerar segunda via:', error);

    if (error instanceof z.ZodError) {
      return {
        success: false,
        message: error.errors[0]?.message || 'Dados inválidos',
      };
    }

    return {
      success: false,
      message: 'Erro ao gerar segunda via. Por favor, tente novamente.',
    };
  }
}

/**
 * Estorna (refund) uma cobrança no Asaas
 *
 * @see https://docs.asaas.com/reference/estornar-cobranca
 *
 * @param input - Dados para estorno
 * @returns Resposta da operação
 *
 * @example
 * ```ts
 * const result = await refundCobranca({
 *   paymentId: 'pay_123456',
 *   value: 50.00, // opcional, estorna valor parcial
 *   description: 'Cancelamento solicitado pelo cliente',
 *   contaId: 'conta-uuid',
 * });
 *
 * if (result.success) {
 *   console.log('Cobrança estornada com sucesso');
 * }
 * ```
 */
export async function refundCobranca(
  input: RefundCobrancaInput,
): Promise<FinanceiroActionResponse> {
  try {
    const validated = refundCobrancaSchema.parse(input);
    const client = validated.contaId
      ? await getAsaasClientForConta(validated.contaId)
      : getAsaasClient();

    const payload: Record<string, unknown> = {};

    if (validated.value) {
      payload.value = validated.value;
    }

    if (validated.description) {
      payload.description = validated.description;
    }

    await client.post(`/payments/${validated.paymentId}/refund`, payload);

    return {
      success: true,
      message: 'Cobrança estornada com sucesso',
    };
  } catch (error) {
    console.error('[financeiroService] Erro ao estornar cobrança:', error);

    if (error instanceof z.ZodError) {
      return {
        success: false,
        message: error.errors[0]?.message || 'Dados inválidos',
      };
    }

    return {
      success: false,
      message: 'Erro ao estornar cobrança. Por favor, tente novamente.',
    };
  }
}

/**
 * Confirma pagamento manualmente (para dinheiro, depósito, etc)
 *
 * @see https://docs.asaas.com/reference/confirmar-recebimento-em-dinheiro
 *
 * @param input - Dados do pagamento manual
 * @returns Resposta da operação
 *
 * @example
 * ```ts
 * const result = await confirmarPagamentoManual({
 *   paymentId: 'pay_123456',
 *   paymentDate: '2025-10-07',
 *   value: 100.00,
 *   notifyCustomer: true,
 *   contaId: 'conta-uuid',
 * });
 *
 * if (result.success) {
 *   console.log('Pagamento confirmado manualmente');
 * }
 * ```
 */
export async function confirmarPagamentoManual(
  input: ConfirmarPagamentoManualInput,
): Promise<FinanceiroActionResponse> {
  try {
    const validated = confirmarPagamentoManualSchema.parse(input);

    const today = new Date();
    const paymentDate = new Date(`${validated.paymentDate}T00:00:00`);

    if (paymentDate > today) {
      return {
        success: false,
        message: 'A data de pagamento não pode ser futura.',
      };
    }
    const client = validated.contaId
      ? await getAsaasClientForConta(validated.contaId)
      : getAsaasClient();

    const payload = {
      paymentDate: validated.paymentDate,
      value: validated.value,
      notifyCustomer: validated.notifyCustomer ?? false,
    };

    await client.post(`/payments/${validated.paymentId}/receiveInCash`, payload);

    return {
      success: true,
      message: 'Pagamento confirmado como recebido em dinheiro',
    };
  } catch (error) {
    console.error('[financeiroService] Erro ao confirmar pagamento manual:', error);

    if (error instanceof z.ZodError) {
      return {
        success: false,
        message: error.errors[0]?.message || 'Dados inválidos',
      };
    }

    return {
      success: false,
      message: 'Erro ao confirmar pagamento. Por favor, tente novamente.',
    };
  }
}

/**
 * Reativa uma assinatura previamente pausada criando uma nova assinatura
 *
 * Nota: No Asaas, não há endpoint para "reativar" diretamente.
 * É necessário criar uma nova assinatura com os mesmos dados.
 *
 * @see https://docs.asaas.com/reference/criar-assinatura
 *
 * @param input - Dados da assinatura a ser reativada
 * @returns Resposta da operação com ID da nova assinatura
 *
 * @example
 * ```ts
 * const result = await reativarAssinatura({
 *   customer: 'cus_123456',
 *   billingType: 'BOLETO',
 *   nextDueDate: '2025-11-07',
 *   value: 100.00,
 *   cycle: 'MONTHLY',
 *   description: 'Mensalidade Plano Premium',
 *   contaId: 'conta-uuid',
 * });
 *
 * if (result.success) {
 *   console.log('Assinatura reativada:', result.data);
 * }
 * ```
 */
export async function reativarAssinatura(
  input: ReativarAssinaturaInput,
): Promise<FinanceiroActionResponse> {
  try {
    const validated = reativarAssinaturaSchema.parse(input);
    const client = validated.contaId
      ? await getAsaasClientForConta(validated.contaId)
      : getAsaasClient();

    const payload = {
      customer: validated.customer,
      billingType: validated.billingType,
      nextDueDate: validated.nextDueDate,
      value: validated.value,
      cycle: validated.cycle,
      description: validated.description || 'Assinatura reativada',
    };

    const response = await client.post('/subscriptions', payload);

    return {
      success: true,
      message: 'Assinatura reativada com sucesso',
      data: response.data,
    };
  } catch (error) {
    console.error('[financeiroService] Erro ao reativar assinatura:', error);

    if (error instanceof z.ZodError) {
      return {
        success: false,
        message: error.errors[0]?.message || 'Dados inválidos',
      };
    }

    return {
      success: false,
      message: 'Erro ao reativar assinatura. Por favor, tente novamente.',
    };
  }
}
