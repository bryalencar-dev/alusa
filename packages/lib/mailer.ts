import nodemailer from 'nodemailer';

type TransportLike = { sendMail: (opts: Record<string, unknown>) => Promise<unknown> };
let transporter: TransportLike | null = null;

function enabled() {
  return !!process.env.SMTP_HOST && process.env.FEATURE_NOTIFICACOES !== 'false';
}

function getTransport() {
  if (!enabled()) return null;
  if (!transporter) {
    const auth = process.env.SMTP_USER && process.env.SMTP_PASS ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined;
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: false,
      auth
    });
  }
  return transporter;
}

export async function sendMail(to: string, subject: string, html: string) {
  const t = getTransport();
  if (!t) return { skipped: true };
  const from = process.env.MAIL_FROM || 'Alusa <noreply@alusa.com>';
  await t.sendMail({ from, to, subject, html });
  return { ok: true };
}