export function CobrancaEmail({ link, valor, vencimento }: { link: string; valor: string; vencimento: string }) {
  return `<div style="font-family:Arial,sans-serif;font-size:14px;color:#222">
  <h2>Cobrança Disponível</h2>
  <p>Uma nova cobrança foi gerada.</p>
  <p><strong>Valor:</strong> ${valor}<br/><strong>Vencimento:</strong> ${vencimento}</p>
  <p>Pague em: <a href="${link}" target="_blank">${link}</a></p>
  <p style="font-size:12px;color:#666">Desconsidere se já tiver pago.</p>
</div>`;
}
