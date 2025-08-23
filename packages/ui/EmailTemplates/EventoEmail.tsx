export function EventoEmail({ titulo, data, local, link }: { titulo: string; data: string; local: string; link: string }) {
  return `<div style="font-family:Arial,sans-serif;font-size:14px;color:#222">
  <h2>Evento: ${titulo}</h2>
  <p><strong>Data:</strong> ${data}<br/><strong>Local:</strong> ${local}</p>
  <p>Detalhes e inscrição: <a href="${link}" target="_blank">${link}</a></p>
  <p style="font-size:12px;color:#666">Você recebeu este e-mail porque está cadastrado em nossa plataforma.</p>
</div>`;
}
