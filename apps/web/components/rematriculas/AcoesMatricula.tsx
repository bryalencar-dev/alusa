'use client';

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { pushToast } from '@/components/ui/toast';
import { ActionDialog } from './ActionDialog';
import { DangerActionDialog } from './DangerActionDialog';
import { StatusMatricula } from '@prisma/client';
import { PlayIcon, PauseIcon, XMarkIcon, TrashIcon } from '@heroicons/react/24/outline';

interface AcoesMatriculaProps {
  matricula: {
    id: string;
    status: StatusMatricula;
    aluno: {
      nome: string;
    };
  };
  onRefresh: () => void;
  onNavigateToList: () => void;
}

const sectionClass = 'space-y-4 rounded-xl border border-slate-200 bg-slate-50 px-5 py-4';

export function AcoesMatricula({ matricula, onRefresh, onNavigateToList }: AcoesMatriculaProps) {
    const handleExcluir = useCallback(async (motivo: string) => {
      try {
        const res = await fetch(`/api/matriculas/${matricula.id}`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ motivo }),
        });

        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error?.message || 'Erro ao excluir matrícula');
        }

        pushToast({
          title: 'Matrícula excluída com sucesso',
          description: 'A matrícula foi removida do sistema.',
          variant: 'success',
        });
        onNavigateToList();
      } catch (error) {
        pushToast({
          title: 'Erro ao excluir matrícula',
          description: (error as Error).message || 'Não foi possível excluir a matrícula.',
          variant: 'error',
        });
        throw error;
      }
    }, [matricula.id, onNavigateToList]);
  const [pausarDialogOpen, setPausarDialogOpen] = useState(false);
  const [retomarDialogOpen, setRetomarDialogOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const isAtiva = matricula.status === 'ATIVA';
  const isPausada = matricula.status === 'PAUSADA';
  const podeSerCancelada = isAtiva || isPausada;

  const handlePausar = useCallback(async (motivo: string) => {
    try {
      const res = await fetch(`/api/matriculas/${matricula.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'PAUSADA',
          motivo: motivo || undefined,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        
        console.error('[PAUSAR_MATRICULA] Resposta de erro da API:', {
          status: res.status,
          errorData,
        });

        // Mensagem específica para erro de assinatura não encontrada
        if (errorData.error === 'ASSINATURA_NAO_ENCONTRADA') {
          throw new Error('Esta matrícula não possui assinatura no Asaas. Não é possível pausar.');
        }

        // Mensagem específica para erros do Asaas
        if (errorData.error === 'ASAAS_ERROR') {
          const asaasError = errorData.details?.asaasError;
          const asaasMessage = errorData.details?.error;
          
          if (asaasError?.errors && Array.isArray(asaasError.errors)) {
            const errorMessages = asaasError.errors.map((e: any) => e.description || e.message).join(', ');
            throw new Error(`Erro do Asaas: ${errorMessages}`);
          }
          
          if (asaasMessage) {
            throw new Error(`Erro: ${asaasMessage}`);
          }
          
          throw new Error(`Erro do Asaas: ${errorData.message || 'Falha ao comunicar com Asaas'}`);
        }

        throw new Error(errorData.message || errorData.error || 'Erro ao pausar matrícula');
      }

      const result = await res.json();

      // Verificar se foi apenas local (assinatura não encontrada no Asaas)
      if (result.warning) {
        pushToast({
          title: 'Matrícula pausada (apenas localmente)',
          description: 'A assinatura não foi encontrada no Asaas. O status foi atualizado apenas no sistema local.',
          variant: 'warning',
        });
      } else {
        pushToast({
          title: 'Matrícula pausada com sucesso',
          description: 'A matrícula foi pausada no Asaas. O responsável será notificado sobre a suspensão das cobranças.',
          variant: 'success',
        });
      }

      onRefresh();
    } catch (error) {
      console.error('[PAUSAR_MATRICULA] Erro:', error);
      pushToast({
        title: 'Erro ao pausar',
        description: (error as Error).message || 'Não foi possível pausar a matrícula.',
        variant: 'error',
      });
      throw error;
    }
  }, [matricula.id, onRefresh]);

  const handleRetomar = useCallback(async (motivo: string) => {
    try {
      const res = await fetch(`/api/matriculas/${matricula.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'ATIVA',
          motivo: motivo || undefined,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error?.message || 'Erro ao retomar matrícula');
      }

      const result = await res.json();

      // Verificar se foi apenas local (assinatura não encontrada no Asaas)
      if (result.warning) {
        pushToast({
          title: 'Matrícula retomada (apenas localmente)',
          description: 'A assinatura não foi encontrada no Asaas. O status foi atualizado apenas no sistema local.',
          variant: 'warning',
        });
      } else {
        pushToast({
          title: 'Matrícula retomada com sucesso',
          description: 'A matrícula foi reativada no Asaas. Uma nova cobrança será gerada e o responsável será notificado automaticamente.',
          variant: 'success',
        });
      }

      onRefresh();
    } catch (error) {
      pushToast({
        title: 'Erro ao retomar',
        description: (error as Error).message || 'Não foi possível retomar a matrícula.',
        variant: 'error',
      });
      throw error;
    }
  }, [matricula.id, onRefresh]);

  const handleCancelar = useCallback(async (motivo: string) => {
    try {
      const res = await fetch(`/api/matriculas/${matricula.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'CANCELADA',
          motivo: motivo || undefined,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error?.message || 'Erro ao cancelar matrícula');
      }

      const result = await res.json();

      if (result.warning) {
        pushToast({
          title: 'Matrícula cancelada (apenas localmente)',
          description: 'A assinatura não foi encontrada no Asaas. O status foi atualizado apenas no sistema local.',
          variant: 'warning',
        });
      } else {
        pushToast({
          title: 'Matrícula cancelada com sucesso',
          description: 'A matrícula foi cancelada no Asaas. O responsável será notificado automaticamente.',
          variant: 'success',
        });
      }

      onRefresh();
    } catch (error) {
      pushToast({
        title: 'Erro ao cancelar matrícula',
        description: (error as Error).message || 'Não foi possível cancelar a matrícula.',
        variant: 'error',
      });
      throw error;
    }
  }, [matricula.id, onNavigateToList]);

  return (
    <>
      <div className={sectionClass}>
        <span className="text-sm font-semibold text-slate-700">Ações da Matrícula</span>
        <p className="text-xs text-slate-600 mb-3">
          Gerencie o ciclo de vida da matrícula
        </p>

        {/* Ações - todos na mesma linha */}
        <div className="flex flex-wrap gap-2 mb-3">
          {isAtiva && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPausarDialogOpen(true)}
              className="border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100 hover:border-amber-400 px-3 py-1.5"
            >
              <PauseIcon className="h-4 w-4 mr-1.5" />
              Pausar Temporariamente
            </Button>
          )}

          {isPausada && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setRetomarDialogOpen(true)}
              className="border-green-300 bg-green-50 text-green-700 hover:bg-green-100 hover:border-green-400 px-3 py-1.5"
            >
              <PlayIcon className="h-4 w-4 mr-1.5" />
              Retomar Matrícula
            </Button>
          )}

          {podeSerCancelada && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCancelDialogOpen(true)}
              className="border-orange-300 bg-orange-50 text-orange-700 hover:bg-orange-100 hover:border-orange-400 px-3 py-1.5"
            >
              <XMarkIcon className="h-4 w-4 mr-1.5" />
              Cancelar Matrícula
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={() => setDeleteDialogOpen(true)}
            className="border-red-400 bg-red-50 text-red-700 hover:bg-red-100 hover:border-red-500 px-3 py-1.5"
          >
            <TrashIcon className="h-4 w-4 mr-1.5" />
            Excluir Permanentemente
          </Button>
        </div>

        <p className="text-xs text-amber-700 mb-3">
          Atenção: Esta ação remove todos os dados e não pode ser desfeita
        </p>

        {/* Card informativo simplificado */}
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-xs font-semibold text-blue-900 mb-2">Importante:</p>
          <div className="text-xs text-blue-800 space-y-1.5">
            <p>
              <span className="font-semibold text-amber-700">Pausar:</span> Suspende novas cobranças no Asaas. Cobranças existentes permanecem ativas. Pode ser retomada.
            </p>
            <p>
              <span className="font-semibold text-orange-700">Cancelar:</span> Encerra a matrícula e remove a assinatura no Asaas. Mantém histórico. <strong>Irreversível.</strong>
            </p>
            <p>
              <span className="font-semibold text-red-700">Excluir:</span> Remove completamente do sistema. Use apenas para erros ou duplicatas. <strong>Requer cobranças finalizadas.</strong>
            </p>
            <p>
              <span className="font-semibold text-slate-700">Controle:</span> Sempre informe o motivo ao cancelar para análises e melhorias.
            </p>
          </div>
        </div>
      </div>

      {/* Dialog de pausar */}
      <ActionDialog
        open={pausarDialogOpen}
        onOpenChange={setPausarDialogOpen}
        title="Pausar matrícula"
        description={`Deseja pausar a matrícula de ${matricula.aluno.nome}? Novas cobranças não serão geradas até que seja retomada. Cobranças já emitidas permanecem ativas.`}
        confirmLabel="Pausar matrícula"
        cancelLabel="Cancelar"
        loadingLabel="Pausando..."
        onConfirm={handlePausar}
        motivoRequired={false}
        motivoLabel="Motivo (opcional)"
        motivoPlaceholder="Ex: Problema de saúde, viagem, questões financeiras..."
        variant="warning"
      />

      {/* Dialog de retomar */}
      <ActionDialog
        open={retomarDialogOpen}
        onOpenChange={setRetomarDialogOpen}
        title="Retomar matrícula"
        description={`Deseja retomar a matrícula de ${matricula.aluno.nome}? As cobranças serão reativadas no Asaas.`}
        confirmLabel="Retomar matrícula"
        cancelLabel="Cancelar"
        loadingLabel="Retomando..."
        onConfirm={handleRetomar}
        motivoRequired={false}
        motivoLabel="Observação (opcional)"
        motivoPlaceholder="Ex: Retorno após tratamento, retorno de viagem..."
        variant="default"
      />

      {/* Dialog de cancelar */}
      <ActionDialog
        open={cancelDialogOpen}
        onOpenChange={setCancelDialogOpen}
        title="Cancelar matrícula"
        description={`Deseja cancelar a matrícula de ${matricula.aluno.nome}? A assinatura será removida do Asaas e cobranças pendentes/vencidas também serão removidas. Esta ação não pode ser desfeita.`}
        confirmLabel="Cancelar matrícula"
        cancelLabel="Manter ativa"
        loadingLabel="Cancelando..."
        onConfirm={handleCancelar}
        motivoRequired={true}
        motivoLabel="Motivo do cancelamento"
        motivoPlaceholder="Ex: Mudança de cidade, não se adaptou, questões financeiras, troca de escola..."
        variant="warning"
      />

      {/* Dialog de excluir com confirmação dupla */}
      <DangerActionDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Excluir matrícula permanentemente"
        description={`Você está prestes a excluir permanentemente a matrícula de ${matricula.aluno.nome}. Esta ação é irreversível e removerá todos os dados do sistema, incluindo histórico de cobranças e logs. Só é possível excluir se não houver cobranças pendentes, atrasadas, em processamento ou pagas.`}
        confirmLabel="Confirmar exclusão"
        cancelLabel="Cancelar"
        loadingLabel="Excluindo..."
        onConfirm={handleExcluir}
        motivoRequired={true}
        motivoLabel="Motivo da exclusão"
        motivoPlaceholder="Ex: Cadastro duplicado, erro administrativo, matrícula de teste..."
        confirmationText="EXCLUIR"
        confirmationLabel="Digite EXCLUIR para confirmar"
      />
    </>
  );
}
