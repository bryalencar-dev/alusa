import type {
  AsaasNotificationEvent,
  AsaasNotificationPreference,
} from '@prisma/client';
import { prisma } from '../../prisma';
import { loadDecryptedAsaasCredentials } from '../../asaas/credentials';
import { getAsaasBaseUrl } from '../../asaas/env';

export type NotificationChannels = {
  emailEnabledForProvider: boolean;
  smsEnabledForProvider: boolean;
  emailEnabledForCustomer: boolean;
  smsEnabledForCustomer: boolean;
  whatsappEnabledForCustomer: boolean;
  phoneCallEnabledForCustomer: boolean;
};

export type NotificationPreferenceDTO = NotificationChannels & {
  id: string;
  contaId: string;
  event: AsaasNotificationEvent;
  scheduleOffset: number;
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type NotificationPreferenceInput = Partial<NotificationChannels> & {
  event: AsaasNotificationEvent;
  scheduleOffset?: number;
  enabled?: boolean;
};

const DEFAULT_NOTIFICATION_PRESETS: NotificationPreferenceInput[] = [
  {
    event: 'PAYMENT_CREATED',
    scheduleOffset: 0,
    enabled: true,
    emailEnabledForProvider: false,
    smsEnabledForProvider: false,
    emailEnabledForCustomer: true,
    smsEnabledForCustomer: true,
    whatsappEnabledForCustomer: false,
    phoneCallEnabledForCustomer: false,
  },
  {
    event: 'PAYMENT_UPDATED',
    scheduleOffset: 0,
    enabled: true,
    emailEnabledForProvider: false,
    smsEnabledForProvider: false,
    emailEnabledForCustomer: true,
    smsEnabledForCustomer: true,
    whatsappEnabledForCustomer: false,
    phoneCallEnabledForCustomer: false,
  },
  {
    event: 'PAYMENT_DUEDATE_WARNING',
    scheduleOffset: 10,
    enabled: true,
    emailEnabledForProvider: false,
    smsEnabledForProvider: false,
    emailEnabledForCustomer: true,
    smsEnabledForCustomer: true,
    whatsappEnabledForCustomer: false,
    phoneCallEnabledForCustomer: false,
  },
  {
    event: 'PAYMENT_DUEDATE_WARNING',
    scheduleOffset: 0,
    enabled: true,
    emailEnabledForProvider: false,
    smsEnabledForProvider: false,
    emailEnabledForCustomer: true,
    smsEnabledForCustomer: true,
    whatsappEnabledForCustomer: false,
    phoneCallEnabledForCustomer: false,
  },
  {
    event: 'SEND_LINHA_DIGITAVEL',
    scheduleOffset: 0,
    enabled: true,
    emailEnabledForProvider: false,
    smsEnabledForProvider: false,
    emailEnabledForCustomer: true,
    smsEnabledForCustomer: true,
    whatsappEnabledForCustomer: false,
    phoneCallEnabledForCustomer: false,
  },
  {
    event: 'PAYMENT_OVERDUE',
    scheduleOffset: 0,
    enabled: true,
    emailEnabledForProvider: true,
    smsEnabledForProvider: false,
    emailEnabledForCustomer: true,
    smsEnabledForCustomer: true,
    whatsappEnabledForCustomer: false,
    phoneCallEnabledForCustomer: true,
  },
  {
    event: 'PAYMENT_OVERDUE',
    scheduleOffset: 7,
    enabled: true,
    emailEnabledForProvider: false,
    smsEnabledForProvider: false,
    emailEnabledForCustomer: true,
    smsEnabledForCustomer: true,
    whatsappEnabledForCustomer: false,
    phoneCallEnabledForCustomer: true,
  },
  {
    event: 'PAYMENT_RECEIVED',
    scheduleOffset: 0,
    enabled: true,
    emailEnabledForProvider: true,
    smsEnabledForProvider: false,
    emailEnabledForCustomer: true,
    smsEnabledForCustomer: true,
    whatsappEnabledForCustomer: false,
    phoneCallEnabledForCustomer: false,
  },
];

function toDTO(pref: AsaasNotificationPreference): NotificationPreferenceDTO {
  return {
    id: pref.id,
    contaId: pref.contaId,
    event: pref.event,
    scheduleOffset: pref.scheduleOffset,
    enabled: pref.enabled,
    emailEnabledForProvider: pref.emailEnabledForProvider,
    smsEnabledForProvider: pref.smsEnabledForProvider,
    emailEnabledForCustomer: pref.emailEnabledForCustomer,
    smsEnabledForCustomer: pref.smsEnabledForCustomer,
    whatsappEnabledForCustomer: pref.whatsappEnabledForCustomer,
    phoneCallEnabledForCustomer: pref.phoneCallEnabledForCustomer,
    createdAt: pref.createdAt,
    updatedAt: pref.updatedAt,
  };
}

type SanitizedPreference = NotificationChannels & {
  event: AsaasNotificationEvent;
  scheduleOffset: number;
  enabled: boolean;
};

function sanitizeInput(input: NotificationPreferenceInput): SanitizedPreference {
  return {
    event: input.event,
    scheduleOffset: input.scheduleOffset ?? 0,
    enabled: input.enabled ?? true,
    emailEnabledForProvider: input.emailEnabledForProvider ?? false,
    smsEnabledForProvider: input.smsEnabledForProvider ?? false,
    emailEnabledForCustomer: input.emailEnabledForCustomer ?? true,
    smsEnabledForCustomer: input.smsEnabledForCustomer ?? true,
    whatsappEnabledForCustomer: input.whatsappEnabledForCustomer ?? false,
    phoneCallEnabledForCustomer: input.phoneCallEnabledForCustomer ?? false,
  };
}

export async function ensureAsaasNotificationPreferences(
  contaId: string,
): Promise<NotificationPreferenceDTO[]> {
  const existing = await prisma.asaasNotificationPreference.findMany({ where: { contaId } });
  if (existing.length > 0) return existing.map(toDTO);

  await prisma.asaasNotificationPreference.createMany({
    data: DEFAULT_NOTIFICATION_PRESETS.map((preset) => ({
      contaId,
      ...sanitizeInput(preset),
    })),
  });

  const seeded = await prisma.asaasNotificationPreference.findMany({ where: { contaId } });
  return seeded.map(toDTO);
}

export async function getAsaasNotificationPreferences(
  contaId: string,
): Promise<NotificationPreferenceDTO[]> {
  const prefs = await prisma.asaasNotificationPreference.findMany({ where: { contaId } });
  if (prefs.length === 0) {
    return ensureAsaasNotificationPreferences(contaId);
  }
  return prefs.map(toDTO);
}

export async function saveAsaasNotificationPreferences(
  contaId: string,
  payload: NotificationPreferenceInput[],
): Promise<NotificationPreferenceDTO[]> {
  if (!Array.isArray(payload) || payload.length === 0) {
    throw new Error('Nenhuma preferência enviada');
  }

  const sanitized = payload.map((pref) => ({
    contaId,
    ...sanitizeInput(pref),
  }));

  await prisma.$transaction(async (tx) => {
    await tx.asaasNotificationPreference.deleteMany({ where: { contaId } });
    await tx.asaasNotificationPreference.createMany({ data: sanitized });
  });

  const updated = await prisma.asaasNotificationPreference.findMany({ where: { contaId } });
  return updated.map(toDTO);
}

interface RemoteNotification {
  id: string;
  event: AsaasNotificationEvent;
  scheduleOffset: number;
}

async function fetchCustomerNotifications(
  contaId: string,
  asaasCustomerId: string,
) {
  const credentials = await loadDecryptedAsaasCredentials(contaId);
  if (!credentials?.apiKey) throw new Error('Conta sem credenciais Asaas configuradas');

  const baseUrl = getAsaasBaseUrl(credentials.apiKey);
  const response = await fetch(`${baseUrl}/customers/${asaasCustomerId}/notifications`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      access_token: credentials.apiKey,
      'User-Agent': 'Alusa-Platform/1.0',
    },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Falha ao consultar notificações do cliente (${response.status}): ${body}`);
  }

  const json = await response.json();
  const data = Array.isArray(json?.data) ? (json.data as RemoteNotification[]) : [];
  return { data, credentials, baseUrl };
}

/**
 * Agrupa preferências por evento.
 * Para eventos com scheduleOffset > 0, há duas notificações (ex: PAYMENT_DUEDATE_WARNING com offset 0 e 10).
 * O Asaas mantém os IDs fixos para cada combinação event+offset, então precisamos mapear:
 * - Preferência local com offset > 0 → Notificação remota com offset > 0
 * - Preferência local com offset = 0 → Notificação remota com offset = 0
 */
function buildNotificationUpdates(
  prefs: NotificationPreferenceDTO[],
  remote: RemoteNotification[],
) {
  // Agrupa notificações remotas por evento
  const remoteByEvent = new Map<string, RemoteNotification[]>();
  for (const item of remote) {
    const list = remoteByEvent.get(item.event) || [];
    list.push(item);
    remoteByEvent.set(item.event, list);
  }

  const updates: Array<{
    notificationId: string;
    payload: Record<string, unknown>;
  }> = [];

  for (const pref of prefs) {
    const remoteList = remoteByEvent.get(pref.event) || [];
    
    // Para eventos com múltiplas notificações (diferentes offsets), 
    // precisamos encontrar a correta baseada em offset > 0 ou offset = 0
    let targetRemote: RemoteNotification | undefined;
    
    if (pref.scheduleOffset > 0) {
      // Preferência com offset > 0 → busca notificação remota com offset > 0
      targetRemote = remoteList.find(r => r.scheduleOffset > 0);
    } else {
      // Preferência com offset = 0 → busca notificação remota com offset = 0
      targetRemote = remoteList.find(r => r.scheduleOffset === 0);
    }

    if (!targetRemote) continue;

    // Monta payload base com canais
    const payload: Record<string, unknown> = {
      enabled: pref.enabled,
      emailEnabledForProvider: pref.emailEnabledForProvider,
      smsEnabledForProvider: pref.smsEnabledForProvider,
      emailEnabledForCustomer: pref.emailEnabledForCustomer,
      smsEnabledForCustomer: pref.smsEnabledForCustomer,
      whatsappEnabledForCustomer: pref.whatsappEnabledForCustomer,
      phoneCallEnabledForCustomer: pref.phoneCallEnabledForCustomer,
    };

    // scheduleOffset só é válido para PAYMENT_DUEDATE_WARNING e PAYMENT_OVERDUE
    const eventsWithScheduleOffset = ['PAYMENT_DUEDATE_WARNING', 'PAYMENT_OVERDUE'];
    if (eventsWithScheduleOffset.includes(pref.event)) {
      payload.scheduleOffset = pref.scheduleOffset;
    }

    updates.push({
      notificationId: targetRemote.id,
      payload,
    });
  }

  return updates;
}

export async function applyAsaasNotificationPreferencesToCustomer(
  contaId: string,
  asaasCustomerId: string,
): Promise<{ updated: boolean; total?: number }> {
  const prefs = await getAsaasNotificationPreferences(contaId);
  const { data, credentials, baseUrl } = await fetchCustomerNotifications(contaId, asaasCustomerId);

  if (!credentials.apiKey) {
    throw new Error('Conta sem credenciais Asaas configuradas');
  }

  const updates = buildNotificationUpdates(prefs, data);
  if (updates.length === 0) return { updated: false };

  // Usa POST /v3/notifications/{id} para cada notificação
  // Isso permite atualizar o scheduleOffset junto com os canais
  const apiKey = credentials.apiKey;
  let successCount = 0;
  for (const update of updates) {
    const response = await fetch(`${baseUrl}/notifications/${update.notificationId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        access_token: apiKey,
        'User-Agent': 'Alusa-Platform/1.0',
      },
      body: JSON.stringify(update.payload),
    });

    if (response.ok) {
      successCount++;
    } else {
      const body = await response.text();
      console.error(`[Asaas Notifications] Falha ao atualizar ${update.notificationId}: ${body}`);
    }
  }

  return { updated: successCount > 0, total: successCount };
}

export async function listCustomerIdsWithAsaas(contaId: string): Promise<string[]> {
  // Busca alunos com asaasCustomerId da conta
  const alunos = await prisma.aluno.findMany({
    where: { contaId, asaasCustomerId: { not: null } },
    select: { asaasCustomerId: true },
  });

  // Busca responsáveis financeiros das matrículas de alunos da conta
  const matriculas = await prisma.matricula.findMany({
    where: {
      aluno: { contaId },
      responsavelFinanceiroId: { not: null },
    },
    select: {
      responsavelFinanceiro: {
        select: { asaasCustomerId: true },
      },
    },
  });

  const ids = new Set<string>();
  alunos.forEach((a) => a.asaasCustomerId && ids.add(a.asaasCustomerId));
  matriculas.forEach((m) => m.responsavelFinanceiro?.asaasCustomerId && ids.add(m.responsavelFinanceiro.asaasCustomerId));
  return Array.from(ids);
}

export async function applyPreferencesToAllCustomers(contaId: string) {
  const customerIds = await listCustomerIdsWithAsaas(contaId);
  const results = { processed: customerIds.length, successes: 0, failures: 0 };
  const errors: Array<{ customerId: string; message: string }> = [];

  for (const customerId of customerIds) {
    try {
      await applyAsaasNotificationPreferencesToCustomer(contaId, customerId);
      results.successes += 1;
    } catch (error) {
      results.failures += 1;
      errors.push({
        customerId,
        message: error instanceof Error ? error.message : 'Erro desconhecido',
      });
    }
  }

  return { ...results, errors };
}
