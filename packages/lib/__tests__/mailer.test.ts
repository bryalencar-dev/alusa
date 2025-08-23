import { describe, it, expect, vi, beforeEach } from 'vitest';
import { sendMail } from '../mailer';

// Mock nodemailer transport indirectly by setting env so transporter is disabled

describe('sendMail util', () => {
  const OLD_ENV = { ...process.env };
  beforeEach(() => {
    vi.restoreAllMocks();
    process.env = { ...OLD_ENV };
  });
  it('skips when SMTP_HOST ausente', async () => {
    delete process.env.SMTP_HOST;
    const r = await sendMail('x@x.com', 'Teste', '<b>Oi</b>');
    expect(r).toHaveProperty('skipped');
  });
});
