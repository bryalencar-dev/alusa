import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { reenviarCobranca } from '@alusa/lib';
import { z } from 'zod';

const notifySchema = z.object({
  tipo: z.enum(['EMAIL', 'SMS', 'WHATSAPP']),
  paymentId: z.string(),
});

/**
 * POST /api/cobrancas/[id]/asaas-notify
 * 
 * Envia notificação de cobrança usando o sistema nativo do Asaas
 * (Email, SMS ou WhatsApp com templates gerenciados pelo Asaas)
 */
export async function POST(
  _req: NextRequest,
  _ctx: { params: { id: string } },
) {
  try {
    const session = await getServerSession(authOptions);
    const user = session?.user as { id?: string; contaId?: string } | undefined;

    if (!user?.id || !user?.contaId) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const body = await req.json();
    const parsed = notifySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: parsed.error },
        { status: 400 },
      );
    }

    const { tipo, paymentId } = parsed.data;

    console.log(`[Asaas Notify] Enviando ${tipo} para payment: ${paymentId}`);

    // Envia notificação via Asaas (nativo)
    const result = await reenviarCobranca({
      paymentId,
      tipo,
      contaId: user.contaId,
    });

    if (!result.success) {
      console.error(`[Asaas Notify] Erro ao enviar ${tipo}:`, result.message);
      return NextResponse.json(
        { success: false, error: result.message },
        { status: 500 },
      );
    }

    console.log(`[Asaas Notify] ${tipo} enviado com sucesso`);

    return NextResponse.json({
      success: true,
      message: result.message,
      tipo,
    });
  } catch (error) {
    console.error('[POST /api/cobrancas/[id]/asaas-notify] Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro ao enviar notificação' 
      },
      { status: 500 },
    );
  }
}


