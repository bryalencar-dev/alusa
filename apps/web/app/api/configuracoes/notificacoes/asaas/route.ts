import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { authOptions } from '@/lib/auth-options';
import {
  applyPreferencesToAllCustomers,
  getAsaasNotificationPreferences,
  saveAsaasNotificationPreferences,
  type NotificationPreferenceInput,
} from '@alusa/lib';
import { AsaasNotificationEvent } from '@prisma/client';

const allowedRoles = new Set(['ADMIN', 'FINANCEIRO']);

function json(status: number, body: unknown) {
  return NextResponse.json(body, { status, headers: { 'cache-control': 'no-store' } });
}

type SessionUser = { id?: string; role?: string; contaId?: string };
async function resolveAuth(): Promise<SessionUser | null> {
  const session = await getServerSession(authOptions).catch(() => null);
  return (session as { user?: SessionUser } | null)?.user ?? null;
}

export async function GET() {
  try {
    const user = await resolveAuth();
    if (!user?.id || !user?.contaId) return json(401, { error: 'NAO_AUTENTICADO' });
    if (!user.role || !allowedRoles.has(user.role.toUpperCase()))
      return json(403, { error: 'SEM_PERMISSAO' });

    const preferences = await getAsaasNotificationPreferences(user.contaId);
    return json(200, { preferences });
  } catch (error) {
    console.error('[Config Notificacoes Asaas][GET]', error);
    return json(500, { error: 'ERRO_INTERNO', message: (error as Error).message });
  }
}

const preferenceSchema = z.object({
  event: z.nativeEnum(AsaasNotificationEvent),
  scheduleOffset: z.number().int().min(0).max(60).default(0),
  enabled: z.boolean(),
  emailEnabledForProvider: z.boolean(),
  smsEnabledForProvider: z.boolean(),
  emailEnabledForCustomer: z.boolean(),
  smsEnabledForCustomer: z.boolean(),
  whatsappEnabledForCustomer: z.boolean(),
  phoneCallEnabledForCustomer: z.boolean(),
});

const payloadSchema = z.object({
  preferences: z.array(preferenceSchema).min(1),
  applyToExistingCustomers: z.boolean().optional(),
});

export async function PUT(request: Request) {
  try {
    const user = await resolveAuth();
    if (!user?.id || !user?.contaId) return json(401, { error: 'NAO_AUTENTICADO' });
    if (!user.role || !allowedRoles.has(user.role.toUpperCase()))
      return json(403, { error: 'SEM_PERMISSAO' });

    const parsed = payloadSchema.safeParse(await request.json());
    if (!parsed.success) {
      return json(422, { error: 'PAYLOAD_INVALIDO', details: parsed.error.flatten() });
    }

    const preferencesPayload = parsed.data.preferences as NotificationPreferenceInput[];
    const preferences = await saveAsaasNotificationPreferences(user.contaId, preferencesPayload);

    let resync: { processed: number; successes: number; failures: number } | undefined;
    if (parsed.data.applyToExistingCustomers) {
      const result = await applyPreferencesToAllCustomers(user.contaId);
      resync = {
        processed: result.processed,
        successes: result.successes,
        failures: result.failures,
      };
    }

    return json(200, { preferences, resync });
  } catch (error) {
    console.error('[Config Notificacoes Asaas][PUT]', error);
    return json(500, { error: 'ERRO_INTERNO', message: (error as Error).message });
  }
}

export const dynamic = 'force-dynamic';
export const revalidate = 0;
