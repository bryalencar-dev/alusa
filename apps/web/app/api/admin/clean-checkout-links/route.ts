/**
 * API temporária para limpar CheckoutLinks inválidos
 * DELETE /api/admin/clean-checkout-links
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/src/prisma';

export const dynamic = 'force-dynamic';

export async function DELETE() {
  try {
    const session = await getServerSession(authOptions);
    const user = (session as { user?: { role?: string } })?.user;

    // Apenas ADMIN pode usar esta API
    if (user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
    }

    // Buscar todos os links
    const allLinks = await prisma.checkoutLink.findMany({
      select: {
        id: true,
        token: true,
        expiresAt: true,
      },
    });

    // Identificar tokens UUID (não começam com "eyJ" que é JWT)
    const invalidLinks = allLinks.filter((link) => !link.token.startsWith('eyJ'));

    if (invalidLinks.length === 0) {
      return NextResponse.json({
        message: 'Nenhum link inválido encontrado',
        total: allLinks.length,
        invalid: 0,
        valid: allLinks.length,
      });
    }

    // Deletar links inválidos
    const result = await prisma.checkoutLink.deleteMany({
      where: {
        id: { in: invalidLinks.map((l) => l.id) },
      },
    });

    return NextResponse.json({
      message: 'Links inválidos deletados com sucesso',
      total: allLinks.length,
      invalid: invalidLinks.length,
      deleted: result.count,
      valid: allLinks.length - invalidLinks.length,
    });
  } catch (error) {
    console.error('[API] Erro ao limpar CheckoutLinks:', error);
    return NextResponse.json({ error: 'Erro ao limpar links' }, { status: 500 });
  }
}
