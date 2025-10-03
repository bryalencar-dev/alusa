'use client';

import { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { MatriculaCreatedPayload } from '@/features/cadastro/matriculas/services/matriculas-service';
import { toast } from 'sonner';
import { CustomToast } from '@/components/CustomToast';

interface MatriculaWizardSuccessProps {
  payload: MatriculaCreatedPayload;
  onCreateAnother: () => void;
  onGoToList: () => void;
}

export function MatriculaWizardSuccess({
  payload,
  onCreateAnother,
  onGoToList,
}: MatriculaWizardSuccessProps) {
  const checkoutUrl = useMemo(() => {
    if (!payload.checkoutLink) return null;
    if (typeof window !== 'undefined') {
      return `${window.location.origin}/checkout/${payload.checkoutLink.token}`;
    }
    return `/checkout/${payload.checkoutLink.token}`;
  }, [payload.checkoutLink]);

  const formatter = useMemo(
    () => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }),
    [],
  );

  const handleCopy = async () => {
    if (!checkoutUrl) return;
    try {
      await navigator.clipboard.writeText(checkoutUrl);
      toast.custom((t) => (
        <CustomToast
          variant="success"
          title="Link copiado"
          description="O link de checkout foi copiado para a área de transferência."
          onClose={() => toast.dismiss(t)}
        />
      ));
    } catch (error) {
      const message = (error as Error).message || 'Não foi possível copiar o link.';
      toast.custom((t) => (
        <CustomToast
          variant="error"
          title="Falha ao copiar"
          description={message}
          onClose={() => toast.dismiss(t)}
        />
      ));
    }
  };

  return (
    <Card className="border border-emerald-200 bg-emerald-50/50">
      <CardHeader>
        <CardTitle className="text-2xl font-semibold text-emerald-800">
          Matrícula criada com sucesso!
        </CardTitle>
        <p className="text-sm text-emerald-700">
          Envie o link de checkout para o responsável confirmar o pagamento da taxa em até 24 horas.
        </p>
      </CardHeader>
      <CardContent className="space-y-6 text-sm text-emerald-900">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-lg border border-emerald-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wide text-emerald-500">
              Identificação da matrícula
            </p>
            <div className="mt-2 space-y-2 text-sm">
              <p>Matrícula #{payload.matricula.id}</p>
              <p>
                Aluno ID: <span className="font-semibold">{payload.matricula.alunoId}</span>
              </p>
              {payload.responsavelFinanceiro && (
                <p>
                  Responsável:{' '}
                  <span className="font-semibold">{payload.responsavelFinanceiro.nome}</span>
                </p>
              )}
              <p className="text-xs text-emerald-600">
                Plano vinculado: {payload.matricula.planoId}
              </p>
            </div>
          </div>
          <div className="rounded-lg border border-emerald-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wide text-emerald-500">
              Cobranças geradas
            </p>
            <div className="mt-2 space-y-1 text-sm">
              <p>
                Taxa de matrícula:{' '}
                <span className="font-semibold">{formatter.format(payload.preco.taxa)}</span>
              </p>
              <p>
                Mensalidade inicial:{' '}
                <span className="font-semibold">
                  {formatter.format(payload.preco.planoLiquido)}
                </span>
              </p>
              <p className="text-xs text-emerald-600">
                Primeiro vencimento:{' '}
                {new Date(payload.primeiroVencimento).toLocaleDateString('pt-BR')}
              </p>
            </div>
          </div>
        </div>

        {payload.checkoutLink ? (
          <div className="rounded-xl border border-emerald-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wide text-emerald-500">
              Link de checkout
            </p>
            <div className="mt-2 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div className="flex-1">
                <p className="font-mono text-sm text-emerald-800 break-all">{checkoutUrl}</p>
                <p className="text-xs text-emerald-600">
                  Expira em {new Date(payload.checkoutLink.expiresAt).toLocaleString('pt-BR')}.
                </p>
              </div>
              <Button type="button" variant="outline" onClick={handleCopy} className="mt-2 md:mt-0">
                Copiar link
              </Button>
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-emerald-200 bg-white p-4 shadow-sm">
            <p className="text-sm text-emerald-700">
              Esta matrícula foi marcada como isenta de taxa. Nenhum link de checkout foi gerado.
            </p>
          </div>
        )}

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
          <Button
            type="button"
            variant="outline"
            className="border-emerald-300 text-emerald-700 hover:bg-emerald-50"
            onClick={onCreateAnother}
          >
            Registrar outra matrícula
          </Button>
          <Button
            type="button"
            className="bg-emerald-600 text-white hover:bg-emerald-700"
            onClick={onGoToList}
          >
            Ir para a lista de matrículas
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
