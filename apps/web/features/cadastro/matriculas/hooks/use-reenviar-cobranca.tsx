import { useState } from 'react';
import { toast } from 'sonner';
import { CustomToast } from '@/components/CustomToast';
import { reenviarCobrancaMatricula } from '../services/matriculas-actions-service';

export function useReenviarCobranca() {
  const [loading, setLoading] = useState(false);

  const reenviar = async (matriculaId: string) => {
    setLoading(true);
    try {
      const result = await reenviarCobrancaMatricula(matriculaId);

      // Copia o link para a área de transferência
      try {
        await navigator.clipboard.writeText(result.checkoutUrl);
        
        const expiraEm = new Date(result.expiresAt).toLocaleDateString('pt-BR');
        toast.custom((t) => (
          <CustomToast
            variant="success"
            title="Link copiado com sucesso!"
            description={`Link de checkout válido até ${expiraEm}`}
            onClose={() => toast.dismiss(t)}
          />
        ), { duration: 5000 });
      } catch (clipboardError) {
        console.warn('[useReenviarCobranca] Erro ao copiar:', clipboardError);
        toast.custom((t) => (
          <CustomToast
            variant="warning"
            title="Link gerado, mas não copiado"
            description="Por favor, copie manualmente da listagem"
            onClose={() => toast.dismiss(t)}
          />
        ), { duration: 5000 });
      }

      return result;
    } catch (error) {
      console.error('[useReenviarCobranca] Erro:', error);
      toast.custom((t) => (
        <CustomToast
          variant="error"
          title="Erro ao gerar link"
          description={(error as Error).message || 'Não foi possível gerar o link de checkout.'}
          onClose={() => toast.dismiss(t)}
        />
      ), { duration: 6000 });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return {
    reenviar,
    loading,
  };
}
