"use client";
import { useState, useEffect } from 'react';
import { z } from 'zod';
import { useSession } from 'next-auth/react';

const schema = z.object({
  apiKey: z.string().min(10, 'Informe a API Key'),
  webhookSecret: z.string().min(10, 'Informe o Webhook Secret'),
});

type FormState = {
  apiKey: string;
  webhookSecret: string;
};

interface FetchState {
  loading: boolean;
  saving: boolean;
  error: string | null;
  updatedAt: string | null;
  maskedApiKey: string | null;
  maskedWebhookSecret: string | null;
}

export function AsaasCredentialsForm() {
  const { data: session } = useSession();
  const [form, setForm] = useState<FormState>({ apiKey: '', webhookSecret: '' });
  const [state, setState] = useState<FetchState>({
    loading: true,
    saving: false,
    error: null,
    updatedAt: null,
    maskedApiKey: null,
    maskedWebhookSecret: null,
  });

  const load = async () => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const res = await fetch('/api/integracoes/asaas', { cache: 'no-store' });
      if (!res.ok) throw new Error(`Erro ${res.status}`);
      const json = await res.json();
      setState((s) => ({
        ...s,
        loading: false,
        maskedApiKey: json.credentials?.apiKeyMasked ?? null,
        maskedWebhookSecret: json.credentials?.webhookSecretMasked ?? null,
        updatedAt: json.credentials?.updatedAt ?? null,
      }));
    } catch (e) {
      setState((s) => ({ ...s, loading: false, error: (e as Error).message }));
    }
  };

  useEffect(() => {
    load();
  }, []);

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parse = schema.safeParse(form);
    if (!parse.success) {
      setState((s) => ({ ...s, error: parse.error.issues[0].message }));
      return;
    }
    setState((s) => ({ ...s, saving: true, error: null }));
    try {
      const res = await fetch('/api/integracoes/asaas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parse.data),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Falha ao salvar');
      setForm({ apiKey: '', webhookSecret: '' });
      setState((s) => ({
        ...s,
        saving: false,
        maskedApiKey: json.credentials?.apiKeyMasked ?? null,
        maskedWebhookSecret: json.credentials?.webhookSecretMasked ?? null,
        updatedAt: json.credentials?.updatedAt ?? null,
      }));
    } catch (e) {
      setState((s) => ({ ...s, saving: false, error: (e as Error).message }));
    }
  };

  if (!session?.user) {
    return <div className="p-4 text-sm text-red-600">Necessita autenticação.</div>;
  }

  return (
    <div className="space-y-4 max-w-xl">
      <h2 className="text-lg font-semibold">Credenciais Asaas</h2>
      {state.error && (
        <div className="rounded bg-red-50 border border-red-200 p-2 text-sm text-red-700">
          {state.error}
        </div>
      )}
      <div className="text-sm text-gray-600">
        <p>Status: {state.loading ? 'Carregando...' : 'Pronto'}</p>
        {state.maskedApiKey && (
          <p>
            API Key atual: <code>{state.maskedApiKey}</code>
          </p>
        )}
        {state.maskedWebhookSecret && (
          <p>
            Webhook Secret atual: <code>{state.maskedWebhookSecret}</code>
          </p>
        )}
        {state.updatedAt && <p>Atualizado em: {new Date(state.updatedAt).toLocaleString()}</p>}
      </div>
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium" htmlFor="apiKey">
            Nova API Key
          </label>
            <input
              id="apiKey"
              name="apiKey"
              value={form.apiKey}
              onChange={onChange}
              placeholder="sk_prod_..."
              className="rounded border px-3 py-2 text-sm"
              autoComplete="off"
            />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium" htmlFor="webhookSecret">
            Novo Webhook Secret
          </label>
            <input
              id="webhookSecret"
              name="webhookSecret"
              value={form.webhookSecret}
              onChange={onChange}
              placeholder="whsec_..."
              className="rounded border px-3 py-2 text-sm"
              autoComplete="off"
            />
        </div>
        <div className="flex gap-2">
          <button
            disabled={state.saving}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm px-4 py-2 rounded"
            type="submit"
          >
            {state.saving ? 'Salvando...' : 'Salvar'}
          </button>
          <button
            type="button"
            onClick={load}
            className="text-sm px-3 py-2 rounded border"
            disabled={state.loading}
          >
            Recarregar
          </button>
        </div>
      </form>
      <p className="text-xs text-gray-500 leading-relaxed">
        Ao salvar, as credenciais são armazenadas de forma ofuscada e podem ser rotacionadas a
        qualquer momento. A implementação de criptografia forte será adicionada (TODO) antes de ir
        para produção.
      </p>
    </div>
  );
}

export default AsaasCredentialsForm;