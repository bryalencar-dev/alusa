export function ConviteEmail({ link }: { link: string }) {
  return `<div style="font-family:Arial,sans-serif;font-size:14px;color:#222">
  <h2>Você foi convidado para a plataforma Alusa</h2>
  <p>Clique no link abaixo para concluir seu cadastro:</p>
  <p><a href="${link}" target="_blank">Concluir cadastro</a></p>
  <p style="font-size:12px;color:#666">Se você não esperava este convite, ignore este e-mail.</p>
</div>`;
}
