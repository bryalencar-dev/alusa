/**
 * Serviço para ações sobre matrículas (ver detalhes, cancelar, reenviar cobrança)
 */

export interface CheckoutLinkResponse {
  checkoutUrl: string;
  token: string;
  expiresAt: string;
}

/**
 * Reenvia cobrança e gera link de checkout
 */
export async function reenviarCobrancaMatricula(
  matriculaId: string,
): Promise<CheckoutLinkResponse> {
  const res = await fetch(`/api/matriculas/${matriculaId}/reenviar-cobranca`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Erro ao reenviar cobrança' }));
    throw new Error(err.error || 'Falha ao reenviar cobrança');
  }

  return res.json();
}

/**
 * Obtém detalhes completos da matrícula
 */
export async function getMatriculaDetalhes(matriculaId: string): Promise<unknown> {
  const res = await fetch(`/api/matriculas/${matriculaId}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Erro ao buscar detalhes' }));
    throw new Error(err.error || 'Falha ao buscar detalhes');
  }

  return res.json();
}
