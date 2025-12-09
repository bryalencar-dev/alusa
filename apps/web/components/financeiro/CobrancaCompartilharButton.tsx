'use client';

import { useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Share2 } from '@/components/icons/icons';
import { pushToast } from '@/components/ui/toast';
import {
  ChatBubbleLeftRightIcon,
  DocumentDuplicateIcon,
  EnvelopeIcon,
} from '@heroicons/react/24/outline';

type CobrancaCompartilharButtonProps = {
  cobranca: {
    id: string;
    asaasPaymentId?: string | null;
    matricula: {
      aluno: {
        nome: string;
        telefone?: string;
        email?: string;
      };
    };
  };
  invoiceUrl?: string;
};

export function CobrancaCompartilharButton({
  cobranca,
  invoiceUrl,
}: CobrancaCompartilharButtonProps) {
  const [loading, setLoading] = useState(false);

  // Construir link da fatura
  const faturaUrl = invoiceUrl || `${window.location.origin}/fatura/${cobranca.asaasPaymentId}`;

  const handleCopiarLink = async () => {
    try {
      await navigator.clipboard.writeText(faturaUrl);
      pushToast({
        title: 'Link copiado',
        description: 'O link da fatura foi copiado para a área de transferência',
        variant: 'success',
      });
    } catch {
      pushToast({
        title: 'Erro',
        description: 'Não foi possível copiar o link',
        variant: 'error',
      });
    }
  };

  const handleCompartilharWhatsApp = () => {
    const alunoNome = cobranca.matricula.aluno.nome;
    const telefone = cobranca.matricula.aluno.telefone?.replace(/\D/g, '') || '';

    if (!telefone) {
      pushToast({
        title: 'Telefone não cadastrado',
        description: 'O aluno não possui telefone cadastrado',
        variant: 'warning',
      });
      return;
    }

    const mensagem = `Olá ${alunoNome}! 👋\n\nSegue o link para visualizar e pagar sua cobrança:\n\n${faturaUrl}\n\nQualquer dúvida, estamos à disposição!`;
    const whatsappUrl = `https://wa.me/55${telefone}?text=${encodeURIComponent(mensagem)}`;

    window.open(whatsappUrl, '_blank');

    pushToast({
      title: 'WhatsApp aberto',
      description: 'A conversa foi aberta em uma nova aba',
      variant: 'success',
    });
  };

  const handleEnviarEmail = async () => {
    const email = cobranca.matricula.aluno.email;

    if (!email) {
      pushToast({
        title: 'E-mail não cadastrado',
        description: 'O aluno não possui e-mail cadastrado',
        variant: 'warning',
      });
      return;
    }

    setLoading(true);

    try {
      // TODO: Implementar API de envio de e-mail
      // const res = await fetch(`/api/cobrancas/${cobranca.id}/enviar-email`, {
      //   method: 'POST',
      // });

      // Simulação temporária
      await new Promise((resolve) => setTimeout(resolve, 1000));

      pushToast({
        title: 'E-mail enviado',
        description: `Cobrança enviada para ${email}`,
        variant: 'success',
      });
    } catch {
      pushToast({
        title: 'Erro',
        description: 'Não foi possível enviar o e-mail',
        variant: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          disabled={loading}
          className="h-10 px-4 border-gray-300 text-gray-700 hover:bg-gray-50"
        >
          <Share2 className="h-4 w-4 mr-2" />
          Compartilhar
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem onClick={handleCompartilharWhatsApp}>
          <ChatBubbleLeftRightIcon className="h-4 w-4 mr-2" />
          Compartilhar por WhatsApp
        </DropdownMenuItem>

        <DropdownMenuItem onClick={handleEnviarEmail}>
          <EnvelopeIcon className="h-4 w-4 mr-2" />
          Enviar por e-mail
        </DropdownMenuItem>

        <DropdownMenuItem onClick={handleCopiarLink}>
          <DocumentDuplicateIcon className="h-4 w-4 mr-2" />
          Copiar link da fatura
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
