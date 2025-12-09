'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { NotificationPreference } from '../types';

interface FetchResponse {
  preferences: NotificationPreference[];
}

interface SaveResponse {
  preferences: NotificationPreference[];
  resync?: {
    processed: number;
    successes: number;
    failures: number;
  };
}

function normalizePreference(pref: NotificationPreference): NotificationPreference {
  return {
    ...pref,
    scheduleOffset: pref.scheduleOffset ?? 0,
    enabled: pref.enabled ?? true,
    emailEnabledForProvider: Boolean(pref.emailEnabledForProvider),
    smsEnabledForProvider: Boolean(pref.smsEnabledForProvider),
    emailEnabledForCustomer: Boolean(pref.emailEnabledForCustomer),
    smsEnabledForCustomer: Boolean(pref.smsEnabledForCustomer),
    whatsappEnabledForCustomer: Boolean(pref.whatsappEnabledForCustomer),
    phoneCallEnabledForCustomer: Boolean(pref.phoneCallEnabledForCustomer),
  };
}

function serializePreferences(prefs: NotificationPreference[]): string {
  return JSON.stringify(
    [...prefs]
      .sort((a, b) =>
        a.event === b.event
          ? a.scheduleOffset - b.scheduleOffset
          : a.event.localeCompare(b.event),
      )
      .map((pref) => ({
        event: pref.event,
        scheduleOffset: pref.scheduleOffset,
        enabled: pref.enabled,
        emailEnabledForProvider: pref.emailEnabledForProvider,
        smsEnabledForProvider: pref.smsEnabledForProvider,
        emailEnabledForCustomer: pref.emailEnabledForCustomer,
        smsEnabledForCustomer: pref.smsEnabledForCustomer,
        whatsappEnabledForCustomer: pref.whatsappEnabledForCustomer,
        phoneCallEnabledForCustomer: pref.phoneCallEnabledForCustomer,
      })),
  );
}

const AUTO_SAVE_DELAY = 800;

export function useAsaasNotificationSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [resyncSummary, setResyncSummary] = useState<SaveResponse['resync']>();
  const [originalPrefs, setOriginalPrefs] = useState<NotificationPreference[]>([]);
  const [preferences, setPreferences] = useState<NotificationPreference[]>([]);
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMountedRef = useRef(true);

  const fetchPreferences = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/configuracoes/notificacoes/asaas', {
        cache: 'no-store',
      });
      const json = (await response.json()) as FetchResponse & { error?: string };
      if (!response.ok) {
        throw new Error(json.error || 'Erro ao carregar preferências');
      }
      const normalized = (json.preferences ?? []).map(normalizePreference);
      setOriginalPrefs(normalized);
      setPreferences(normalized);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao carregar preferências');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    void fetchPreferences();
    return () => {
      isMountedRef.current = false;
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [fetchPreferences]);

  const hasChanges = useMemo(() => {
    if (preferences.length !== originalPrefs.length) return true;
    return serializePreferences(preferences) !== serializePreferences(originalPrefs);
  }, [preferences, originalPrefs]);

  const savePreferencesInternal = useCallback(
    async (prefsToSave: NotificationPreference[], applyToExisting = false) => {
      setSaving(true);
      setError(null);
      try {
        const response = await fetch('/api/configuracoes/notificacoes/asaas', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            preferences: prefsToSave,
            applyToExistingCustomers: applyToExisting,
          }),
        });
        const json = (await response.json()) as SaveResponse & { error?: string };
        if (!response.ok) {
          throw new Error(json.error || 'Erro ao salvar preferências');
        }
        if (isMountedRef.current) {
          const normalized = (json.preferences ?? []).map(normalizePreference);
          setOriginalPrefs(normalized);
          setPreferences(normalized);
          setResyncSummary(json.resync);
          setSuccess('Salvo');
          setTimeout(() => {
            if (isMountedRef.current) setSuccess(null);
          }, 2000);
        }
      } catch (err) {
        if (isMountedRef.current) {
          setError(err instanceof Error ? err.message : 'Falha ao salvar');
        }
        throw err;
      } finally {
        if (isMountedRef.current) {
          setSaving(false);
        }
      }
    },
    [],
  );

  const updatePreference = useCallback(
    (event: NotificationPreference['event'], currentOffset: number, patch: Partial<NotificationPreference>) => {
      setPreferences((prev) => {
        const updated = prev.map((pref) =>
          pref.event === event && pref.scheduleOffset === currentOffset
            ? { ...pref, ...patch }
            : pref,
        );
        
        // Auto-save with debounce
        if (autoSaveTimerRef.current) {
          clearTimeout(autoSaveTimerRef.current);
        }
        autoSaveTimerRef.current = setTimeout(() => {
          void savePreferencesInternal(updated);
        }, AUTO_SAVE_DELAY);
        
        return updated;
      });
    },
    [savePreferencesInternal],
  );

  const syncToExistingCustomers = useCallback(async () => {
    await savePreferencesInternal(preferences, true);
  }, [preferences, savePreferencesInternal]);

  const reset = useCallback(() => {
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }
    setPreferences(originalPrefs);
    setSuccess(null);
    setError(null);
  }, [originalPrefs]);

  return {
    loading,
    saving,
    error,
    success,
    resyncSummary,
    preferences,
    hasChanges,
    fetchPreferences,
    updatePreference,
    reset,
    syncToExistingCustomers,
    setSuccess,
  };
}
