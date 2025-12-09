import { z } from 'zod';

import {
  PROFILE_LOCALE_VALUES,
  PROFILE_THEME_VALUES,
  type ProfileLocale,
  type ProfileTheme,
} from '@/lib/profile-preferences';
import { userProfileWithSchoolSchema } from '../types';

const notificationSchema = z.object({
  emailProduct: z.boolean(),
  emailSecurity: z.boolean(),
  emailMarketing: z.boolean(),
  whatsapp: z.boolean(),
  sms: z.boolean(),
});

const profileSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  role: z.string(),
  telefone: z.string().nullable().optional(),
  foto: z.string().nullable().optional(),
  bio: z.string().nullable().optional(),
  locale: z.enum(PROFILE_LOCALE_VALUES),
  theme: z.enum(PROFILE_THEME_VALUES),
  notifications: notificationSchema,
});

export type UserProfile = z.infer<typeof profileSchema>;
export type NotificationPreferences = z.infer<typeof notificationSchema>;

const updatePayloadSchema = z.object({
  name: z.string().min(2).max(120),
  telefone: z.string().max(20).optional(),
  bio: z.string().max(280).optional(),
  locale: z.enum(PROFILE_LOCALE_VALUES),
  theme: z.enum(PROFILE_THEME_VALUES),
  foto: z.union([z.string().url(), z.literal(null)]).optional(),
});

export type UpdateProfilePayload = {
  name: string;
  telefone?: string | null;
  bio?: string | null;
  locale: ProfileLocale;
  theme: ProfileTheme;
  foto?: string | null;
};

export class ProfileUpdateError extends Error {
  fieldErrors?: Record<string, string[]>;
  formErrors?: string[];
  status: number;

  constructor(
    message: string,
    options: { fieldErrors?: Record<string, string[]>; formErrors?: string[]; status: number },
  ) {
    super(message);
    this.name = 'ProfileUpdateError';
    this.fieldErrors = options.fieldErrors;
    this.formErrors = options.formErrors;
    this.status = options.status;
  }
}

function sanitizePhone(value: string | null | undefined) {
  if (typeof value !== 'string') return '';
  const digits = value.replace(/\D/g, '');
  return digits;
}

function normalizeBio(value: string | null | undefined) {
  if (typeof value !== 'string') return '';
  return value.trim();
}

function normalizeAvatar(value: string | null | undefined) {
  if (value === null) return null;
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed;
}

export async function fetchCurrentProfile({ signal }: { signal?: AbortSignal } = {}) {
  const res = await fetch('/api/users/me', { cache: 'no-store', signal });
  const json = await res.json().catch(() => null);

  if (!res.ok) {
    const message =
      typeof json?.error === 'string'
        ? json.error
        : res.status === 401
          ? 'Sessao expirada'
          : 'Falha ao carregar perfil';
    throw new Error(message);
  }

  const parsed = userProfileWithSchoolSchema.safeParse(json);
  if (!parsed.success) {
    throw new Error('Resposta inesperada do servidor');
  }

  return parsed.data;
}

export async function updateCurrentProfile(payload: UpdateProfilePayload) {
  const parsed = updatePayloadSchema.safeParse({
    name: payload.name.trim(),
    telefone: payload.telefone ?? '',
    bio: payload.bio ?? '',
    locale: payload.locale,
    theme: payload.theme,
    foto: payload.foto ?? undefined,
  });

  if (!parsed.success) {
    throw new ProfileUpdateError('Dados invalidos', {
      status: 400,
      fieldErrors: parsed.error.flatten().fieldErrors,
      formErrors: parsed.error.flatten().formErrors,
    });
  }

  const body: Record<string, unknown> = {
    name: parsed.data.name.trim(),
    telefone: sanitizePhone(payload.telefone),
    bio: normalizeBio(payload.bio),
    locale: payload.locale,
    theme: payload.theme,
  };

  if (Object.prototype.hasOwnProperty.call(parsed.data, 'foto')) {
    body.foto = normalizeAvatar(payload.foto);
  }

  const res = await fetch('/api/users/me', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const json = await res.json().catch(() => null);

  if (!res.ok) {
    const errorPayload = (json?.error ?? null) as {
      fieldErrors?: Record<string, string[]>;
      formErrors?: string[];
    } | null;
    const message =
      typeof json?.error === 'string'
        ? json.error
        : res.status === 401
          ? 'Sessao expirada'
          : 'Falha ao salvar perfil';
    throw new ProfileUpdateError(message, {
      status: res.status,
      fieldErrors: errorPayload?.fieldErrors,
      formErrors: errorPayload?.formErrors,
    });
  }

  const parsedResponse = profileSchema.safeParse(json);
  if (!parsedResponse.success) {
    throw new Error('Resposta inesperada do servidor');
  }

  return parsedResponse.data;
}

export async function updateNotificationPreferences(preferences: NotificationPreferences) {
  const res = await fetch('/api/users/me/notifications', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(preferences),
  });

  const json = await res.json().catch(() => null);

  if (!res.ok) {
    const message = typeof json?.error === 'string' ? json.error : 'Falha ao salvar preferencias';
    throw new ProfileUpdateError(message, {
      status: res.status,
      fieldErrors: (json?.error as { fieldErrors?: Record<string, string[]> } | null)?.fieldErrors,
      formErrors: (json?.error as { formErrors?: string[] } | null)?.formErrors,
    });
  }

  const parsed = notificationSchema.safeParse(json?.notifications ?? json);
  if (!parsed.success) {
    throw new Error('Resposta inesperada do servidor');
  }

  return parsed.data;
}

// ---- School (Conta) services ----

const schoolUpdateSchema = z
  .object({
    name: z.string().min(2).max(120).optional(),
    cpfCnpj: z.string().min(11).max(18).optional(),
  })
  .strict();

export async function updateSchool(payload: { name?: string; cpfCnpj?: string }) {
  const parsed = schoolUpdateSchema.safeParse(payload);
  if (!parsed.success) {
    throw new ProfileUpdateError('Dados invalidos', {
      status: 400,
      fieldErrors: parsed.error.flatten().fieldErrors,
      formErrors: parsed.error.flatten().formErrors,
    });
  }

  const res = await fetch('/api/users/me/school', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(parsed.data),
  });
  const json = await res.json().catch(() => null);
  if (!res.ok) {
    const message = typeof json?.error === 'string' ? json.error : 'Falha ao salvar dados da escola';
    throw new ProfileUpdateError(message, { status: res.status });
  }
  return json as { id: string; name: string; cpfCnpj: string; status: string; ownerUserId: string | null };
}

export type SchoolAddress = {
  street?: string;
  number?: string;
  district?: string;
  city?: string;
  state?: string;
  cep?: string;
};

export async function fetchSchoolAddress(): Promise<SchoolAddress> {
  const res = await fetch('/api/users/me/school/address', { cache: 'no-store' });
  const json = await res.json().catch(() => null);
  if (!res.ok) {
    const message = typeof json?.error === 'string' ? json.error : 'Falha ao carregar endereço';
    throw new Error(message);
  }
  return json as SchoolAddress;
}

export async function updateSchoolAddress(payload: SchoolAddress): Promise<SchoolAddress> {
  const res = await fetch('/api/users/me/school/address', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const json = await res.json().catch(() => null);
  if (!res.ok) {
    const message = typeof json?.error === 'string' ? json.error : 'Falha ao salvar endereço';
    throw new ProfileUpdateError(message, { status: res.status });
  }
  return json as SchoolAddress;
}
