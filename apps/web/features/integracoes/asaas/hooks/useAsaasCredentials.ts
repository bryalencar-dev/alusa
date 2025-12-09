"use client";

import { useCallback, useEffect, useState } from "react";

interface CredentialsData {
  maskedToken: string | null;
  updatedAt: string | null;
}

type SaveTokenHandler = (_token: string) => Promise<boolean>;

interface UseAsaasCredentialsReturn {
  data: CredentialsData;
  loading: boolean;
  saving: boolean;
  testing: boolean;
  error: string | null;
  success: string | null;
  refresh: () => Promise<void>;
  saveToken: SaveTokenHandler;
  testConnection: () => Promise<boolean>;
  clearFeedback: () => void;
}

function extractMessage(err: unknown, fallback: string): string {
  if (err instanceof Error && err.message) return err.message;
  if (typeof err === "string" && err) return err;
  return fallback;
}

export function useAsaasCredentials(): UseAsaasCredentialsReturn {
  const [data, setData] = useState<CredentialsData>({ maskedToken: null, updatedAt: null });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/integracoes/asaas", { cache: "no-store" });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json?.error || "Falha ao carregar credenciais");
      }
      setData({
        maskedToken: json.credentials?.apiKeyMasked ?? null,
        updatedAt: json.credentials?.updatedAt ?? null,
      });
    } catch (err) {
      setError(extractMessage(err, "Erro ao carregar credenciais"));
    } finally {
      setLoading(false);
    }
  }, []);

  const saveToken = useCallback(async (token: string) => {
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch("/api/integracoes/asaas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json?.error || "Falha ao salvar token");
      }
      setData({
        maskedToken: json.credentials?.apiKeyMasked ?? null,
        updatedAt: json.credentials?.updatedAt ?? null,
      });
      setSuccess("Token salvo com sucesso.");
      return true;
    } catch (err) {
      setError(extractMessage(err, "Erro ao salvar token"));
      return false;
    } finally {
      setSaving(false);
    }
  }, []);

  const testConnection = useCallback(async () => {
    setTesting(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch("/api/integracoes/asaas/testar", { method: "POST" });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json?.error || "Falha ao testar conexão");
      }
      setSuccess("Conexão validada com o Asaas.");
      return true;
    } catch (err) {
      setError(extractMessage(err, "Erro ao testar conexão"));
      return false;
    } finally {
      setTesting(false);
    }
  }, []);

  const clearFeedback = useCallback(() => {
    setError(null);
    setSuccess(null);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { data, loading, saving, testing, error, success, refresh, saveToken, testConnection, clearFeedback };
}

export default useAsaasCredentials;
