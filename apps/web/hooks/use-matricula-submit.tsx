import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { CustomToast } from '@/components/CustomToast';
import type { WizardState } from '@/components/matriculas/wizard/types';
import { prepararPayloadMatricula } from '@/lib/validations/resumo.schema';

export interface MatriculaResponse {
  matricula: {
    id: string;
    alunoId: string;
    status: string;
    statusFinanceiro: string;
    dataInicio: string;
    taxaMatricula: number;
    taxaIsenta: boolean;
    taxaJustificativa?: string | null;
    vencimentoDia: number;
  };
  cobrancas: {
    taxa: {
      id: string;
      valor: number;
      vencimento: string;
      status: string;
    } | null;
    mensalidade: {
      id: string;
      valor: number;
      vencimento: string;
      status: string;
    } | null;
  };
  checkoutLink: {
    id: string;
    token: string;
    expiresAt: string;
  } | null;
  checkoutToken: string | null;
  preco: {
    plano: number;
    taxa: number;
    desconto: number;
    total: number;
  };
  responsavelFinanceiro: {
    id: string;
    nome: string;
  };
  primeiroVencimento: string;
}

interface UseMatriculaSubmitOptions {
  onSuccess?: (_data: MatriculaResponse) => void;
  onError?: (_error: Error) => void;
  redirectOnSuccess?: boolean;
}

export function useMatriculaSubmit(options: UseMatriculaSubmitOptions = {}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [data, setData] = useState<MatriculaResponse | null>(null);

  const submit = async (wizardState: WizardState) => {
    setLoading(true);
    setError(null);
    setData(null);

    try {
      // Validar e preparar payload usando schema do resumo
      const validationResult = prepararPayloadMatricula(
        wizardState as unknown as Record<string, unknown>,
      );

      if (!validationResult.valido) {
        throw new Error(`Validação falhou: ${validationResult.erros.join(', ')}`);
      }

      const payload = validationResult.payload;

      // Enviar para API
      const response = await fetch('/api/matriculas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('[useMatriculaSubmit] Erro na resposta da API de matrículas', {
          status: response.status,
          payload: payload,
          apiError: errorData,
        });
        const messageParts = [errorData.error?.message || `Erro HTTP ${response.status}`];
        if (Array.isArray(errorData.error?.details)) {
          messageParts.push(errorData.error.details.join(', '));
        } else if (typeof errorData.error?.details === 'string') {
          messageParts.push(errorData.error.details);
        }
        throw new Error(messageParts.filter(Boolean).join(' - '));
      }

      const result: MatriculaResponse = await response.json();
      setData(result);

      // Copiar link de checkout para área de transferência se for cartão
      if (result.checkoutToken && payload?.formaPagamento === 'CARTAO') {
        const checkoutUrl = `${window.location.origin}/checkout/${result.checkoutToken}`;
        try {
          await navigator.clipboard.writeText(checkoutUrl);
          toast.custom(
            (t) => (
              <CustomToast
                variant="success"
                title="Link de checkout copiado!"
                description={`Link copiado para área de transferência: ${checkoutUrl}`}
                onClose={() => toast.dismiss(t)}
              />
            ),
            { duration: 8000 },
          );
        } catch (clipboardError) {
          console.warn('[useMatriculaSubmit] Erro ao copiar para clipboard:', clipboardError);
          // Toast alternativo mostrando o link para copiar manualmente
          toast.custom(
            (t) => (
              <CustomToast
                variant="warning"
                title="Link de checkout gerado"
                description={`Copie manualmente: ${checkoutUrl}`}
                onClose={() => toast.dismiss(t)}
              />
            ),
            { duration: 10000 },
          );
        }
      }

      // Toast de sucesso
      toast.custom(
        (t) => (
          <CustomToast
            variant="success"
            title="Matrícula criada com sucesso!"
            description={`ID: ${result.matricula.id}`}
            onClose={() => toast.dismiss(t)}
          />
        ),
        { duration: 5000 },
      );

      // Callback de sucesso
      options.onSuccess?.(result);

      // Redirecionar se configurado
      if (options.redirectOnSuccess !== false) {
        router.push(`/matriculas/${result.matricula.id}`);
      }

      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Erro desconhecido');
      setError(error);

      console.error('[useMatriculaSubmit] Falha ao submeter matrícula', {
        message: error.message,
        stack: error instanceof Error ? error.stack : undefined,
      });

      // Toast de erro
      toast.custom(
        (t) => (
          <CustomToast
            variant="error"
            title="Erro ao criar matrícula"
            description={error.message}
            onClose={() => toast.dismiss(t)}
          />
        ),
        { duration: 7000 },
      );

      // Callback de erro
      options.onError?.(error);

      throw error;
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setLoading(false);
    setError(null);
    setData(null);
  };

  return {
    submit,
    loading,
    error,
    data,
    reset,
  };
}
