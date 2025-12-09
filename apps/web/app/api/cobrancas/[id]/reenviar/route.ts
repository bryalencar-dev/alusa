import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const reenviarSchema = z.object({
  canal: z.enum(['whatsapp', 'email', 'sms']),
  destinatario: z.string().optional(),
});

/**
 * POST /api/cobrancas/[id]/reenviar
 * Reenvia notificação de cobrança por WhatsApp, Email ou SMS
 * 
 * ⚠️ NOTA: Este endpoint usa Twilio/SendGrid customizado.
 * Para notificações nativas do Asaas, use: /api/cobrancas/[id]/asaas-notify
 * 
 * Este endpoint é mantido para outros casos de uso futuros.
 */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const { id } = params;

    // Buscar cobrança com dados do aluno e responsável
    const cobranca = await prisma.cobranca.findFirst({
      where: {
        id,
        matricula: {
          aluno: {
            contaId: session.user.contaId ?? undefined,
          },
        },
      },
      include: {
        matricula: {
          include: {
            aluno: {
              include: {
                responsaveis: {
                  where: {
                    OR: [{ tipoVinculo: 'FINANCEIRO' }, { tipoVinculo: 'PRINCIPAL' }],
                  },
                  include: {
                    responsavel: true,
                  },
                  take: 1,
                },
              },
            },
            plano: true,
          },
        },
      },
    });

    if (!cobranca) {
      return NextResponse.json({ error: 'Cobrança não encontrada' }, { status: 404 });
    }

    // Parse do body
    const body = await req.json();
    const parsed = reenviarSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: parsed.error },
        { status: 400 },
      );
    }

    const { canal, destinatario } = parsed.data;

    // Obter dados do responsável
    const responsavel = cobranca.matricula.aluno.responsaveis[0]?.responsavel;
    if (!responsavel) {
      return NextResponse.json(
        { error: 'Responsável financeiro não encontrado para este aluno' },
        { status: 400 },
      );
    }

    // Montar mensagem
    const valor = new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(Number(cobranca.valor));

    const vencimento = new Date(cobranca.vencimento).toLocaleDateString('pt-BR');

    const mensagem = `
Olá ${responsavel.nome || 'Responsável'}!

Lembramos que há uma cobrança pendente para ${cobranca.matricula.aluno.nome}:

💰 Valor: ${valor}
📅 Vencimento: ${vencimento}
📝 Descrição: ${cobranca.descricao || cobranca.tipo}
📋 Plano: ${cobranca.matricula.plano?.nome ?? 'N/A'}

${cobranca.asaasPaymentId ? `🔗 Link de pagamento: ${process.env.NEXT_PUBLIC_APP_URL || 'https://alusa.com.br'}/fatura/${cobranca.asaasPaymentId}` : ''}

Em caso de dúvidas, entre em contato conosco.

Atenciosamente,
Equipe Alusa
    `.trim();

    let resultado = null;

    // Enviar notificação conforme o canal
    switch (canal) {
      case 'whatsapp': {
        const telefone = destinatario || responsavel.telefone;
        if (!telefone) {
          return NextResponse.json(
            { error: 'Telefone não encontrado para WhatsApp' },
            { status: 400 },
          );
        }

        // Chamar API do Twilio
        try {
          const twilioRes = await fetch(`${req.nextUrl.origin}/api/twilio/send`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              cookie: req.headers.get('cookie') || '',
            },
            body: JSON.stringify({
              numero: telefone,
              mensagem,
            }),
          });

          if (!twilioRes.ok) {
            const errorData = await twilioRes.json();
            throw new Error(errorData.error || 'Erro ao enviar WhatsApp');
          }

          resultado = await twilioRes.json();
        } catch (error) {
          console.error('[POST /api/cobrancas/[id]/reenviar] WhatsApp error:', error);
          return NextResponse.json(
            {
              error: 'Erro ao enviar WhatsApp',
              details: error instanceof Error ? error.message : 'Erro desconhecido',
            },
            { status: 500 },
          );
        }
        break;
      }

      case 'email': {
        const email = destinatario || responsavel.email;
        if (!email) {
          return NextResponse.json({ error: 'Email não encontrado' }, { status: 400 });
        }

        // TODO: Integrar com SendGrid ou serviço de email
        // Por enquanto, simular envio
        resultado = {
          success: true,
          provider: 'email',
          to: email,
          message: 'Email enviado (simulado)',
        };
        break;
      }

      case 'sms': {
        const telefone = destinatario || responsavel.telefone;
        if (!telefone) {
          return NextResponse.json({ error: 'Telefone não encontrado para SMS' }, { status: 400 });
        }

        // TODO: Integrar com Twilio SMS
        // Por enquanto, simular envio
        resultado = {
          success: true,
          provider: 'sms',
          to: telefone,
          message: 'SMS enviado (simulado)',
        };
        break;
      }

      default:
        return NextResponse.json({ error: 'Canal inválido' }, { status: 400 });
    }

    // Registrar log financeiro
    await prisma.logFinanceiro.create({
      data: {
        contaId: session.user.contaId!,
        cobrancaId: cobranca.id,
        acao: `REENVIO_${canal.toUpperCase()}`,
        detalhes: {
          canal,
          destinatario:
            destinatario || (canal === 'email' ? responsavel.email : responsavel.telefone),
          resultado,
        },
        usuarioId: session.user.id,
      },
    });

    return NextResponse.json(
      {
        success: true,
        canal,
        destinatario:
          destinatario || (canal === 'email' ? responsavel.email : responsavel.telefone),
        resultado,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error('[POST /api/cobrancas/[id]/reenviar] Error:', error);
    return NextResponse.json({ error: 'Erro ao reenviar notificação' }, { status: 500 });
  }
}
