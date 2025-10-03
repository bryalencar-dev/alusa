'use client';
import { useState, useEffect } from 'react';
import { z } from 'zod';
import { useSession } from 'next-auth/react';

const schema = z.object({
  token: z.string().min(10, 'Informe o token da API'),
});

type FormState = {
  token: string;
};

interface FetchState {
  loading: boolean;
  saving: boolean;
  error: string | null;
  updatedAt: string | null;
  maskedToken: string | null;
  success: string | null;
}

export function AsaasCredentialsForm() {
  const { data: session } = useSession();
  const [form, setForm] = useState<FormState>({ token: '' });
  const [state, setState] = useState<FetchState>({
    loading: true,
    saving: false,
    error: null,
    updatedAt: null,
    maskedToken: null,
    success: null,
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
        maskedToken: json.credentials?.apiKeyMasked ?? null,
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
        body: JSON.stringify({ token: parse.data.token }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Falha ao salvar');
      setForm({ token: '' });
      setState((s) => ({
        ...s,
        saving: false,
        maskedToken: json.credentials?.apiKeyMasked ?? null,
        updatedAt: json.credentials?.updatedAt ?? null,
        success: 'Token salvo com sucesso',
      }));
    } catch {
      setState((s) => ({ ...s, saving: false, error: 'Erro ao salvar token' }));
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
      {state.success && (
        <div className="rounded bg-green-50 border border-green-200 p-2 text-sm text-green-700">
          {state.success}
        </div>
      )}
      <div className="text-sm text-gray-600">
        <p>Status: {state.loading ? 'Carregando...' : 'Pronto'}</p>
        {state.maskedToken && (
          <p>
            Token atual: <code>{state.maskedToken}</code>
          </p>
        )}
        {state.updatedAt && <p>Atualizado em: {new Date(state.updatedAt).toLocaleString()}</p>}
      </div>
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium" htmlFor="token">
            Token da API do Asaas
          </label>
          <input
            id="token"
            name="token"
            type="password"
            value={form.token}
            onChange={onChange}
            placeholder="cole aqui seu token..."
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
          {/* Opcional: Testar conexão */}
          <button
            type="button"
            onClick={async () => {
              setState((s) => ({ ...s, error: null, success: null }));
              try {
                const res = await fetch('/api/integracoes/asaas/testar', { method: 'POST' });
                if (!res.ok) throw new Error('Falha ao testar conexão');
                setState((s) => ({ ...s, success: 'Conexão ok com Asaas' }));
              } catch {
                setState((s) => ({ ...s, error: 'Falha ao testar conexão' }));
              }
            }}
            className="text-sm px-3 py-2 rounded border"
            disabled={state.loading}
          >
            Testar conexão
          </button>
        </div>
      </form>
      <p className="text-xs text-gray-500 leading-relaxed">
        Ao salvar, o token é armazenado de forma ofuscada e pode ser rotacionado a qualquer momento.
        A implementação de criptografia forte será adicionada (TODO) antes de ir para produção.
      </p>
    </div>
  );
}

export default AsaasCredentialsForm;
