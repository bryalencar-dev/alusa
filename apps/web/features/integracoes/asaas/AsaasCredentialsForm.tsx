'use client';

import { useState } from 'react';
import { z } from 'zod';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';

const tokenSchema = z.object({
  token: z.string().min(10, 'Informe o token completo gerado no painel do Asaas.'),
});

interface AsaasCredentialsFormProps {
  maskedToken: string | null;
  updatedAt: string | null;
  loading: boolean;
  saving: boolean;
  testing: boolean;
  error: string | null;
  success: string | null;
  onSubmit: (token: string) => Promise<boolean>;
  onTest: () => Promise<boolean>;
  onClearFeedback: () => void;
}

function formatTimestamp(value: string | null): string {
  if (!value) return 'Nunca sincronizado';
  try {
    return new Intl.DateTimeFormat('pt-BR', {
      dateStyle: 'short',
      timeStyle: 'short',
    }).format(new Date(value));
  } catch {
    return value;
  }
}

export function AsaasCredentialsForm({
  maskedToken,
  updatedAt,
  loading,
  saving,
  testing,
  error,
  success,
  onSubmit,
  onTest,
  onClearFeedback,
}: AsaasCredentialsFormProps) {
  const [token, setToken] = useState('');
  const [showToken, setShowToken] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onClearFeedback();
    const parsed = tokenSchema.safeParse({ token });
    if (!parsed.success) {
      setValidationError(parsed.error.issues[0]?.message ?? 'Token inválido');
      return;
    }
    setValidationError(null);
    const saved = await onSubmit(parsed.data.token);
    if (saved) {
      setToken('');
      setShowToken(false);
    }
  };

  const handleTest = async () => {
    onClearFeedback();
    await onTest();
  };

  const statusText = loading ? 'Carregando…' : maskedToken ? 'Token configurado' : 'Token ausente';

  return (
    <div className="space-y-5">
      {error ? (
        <Alert variant="warning">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}
      {success ? (
        <Alert variant="success">
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      ) : null}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="asaas-token" className="text-sm font-semibold text-gray-900">
            Token da API do Asaas
          </Label>
          <div>
            <Input
              id="asaas-token"
              name="token"
              type="password"
              value={token}
              onChange={(event) => {
                if (validationError) setValidationError(null);
                onClearFeedback();
                setToken(event.target.value);
              }}
              placeholder={maskedToken ? '••••••' + maskedToken.slice(-4) : 'Cole aqui o token disponível no painel do Asaas'}
              autoComplete="off"
            />
          </div>
          {validationError ? (
            <p className="text-xs text-rose-600">{validationError}</p>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-3">
          <Button type="submit" disabled={saving} className="bg-brand-accent hover:bg-brand-accent/90">
            {saving ? 'Salvando…' : 'Salvar token'}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={handleTest}
            disabled={testing || loading || !maskedToken}
          >
            {testing ? 'Testando…' : 'Testar conexão'}
          </Button>
        </div>
        <div className="text-xs text-gray-500">
          <span className="font-semibold text-gray-700">Última atualização:</span> {formatTimestamp(updatedAt)}
        </div>
      </form>

      <p className="text-xs leading-relaxed text-gray-500">
        Armazenamos o token de forma ofuscada, criptografada e com auditoria de alterações. Evite reutilizar chaves
        anteriores e revogue tokens que não forem mais necessários.
      </p>
    </div>
  );
}

export default AsaasCredentialsForm;
