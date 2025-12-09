"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AsaasCredentialsForm } from "./AsaasCredentialsForm";
import { useAsaasCredentials } from "./hooks/useAsaasCredentials";

export function AsaasIntegrationPanel() {
  const { data, loading, saving, testing, error, success, saveToken, testConnection, clearFeedback } = useAsaasCredentials();

  const badge = loading
    ? { label: "Carregando…", className: "bg-gray-100 text-gray-700 border-gray-200" }
    : data.maskedToken
      ? { label: "Token configurado", className: "bg-emerald-100 text-emerald-800 border-emerald-200" }
      : { label: "Token ausente", className: "bg-amber-100 text-amber-900 border-amber-200" };

  return (
    <Card className="border-gray-200 shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-3 text-xl text-gray-900">
          Sincronização Asaas
          <Badge className={badge.className}>{badge.label}</Badge>
        </CardTitle>
        <CardDescription className="text-sm text-gray-600">
          Cole o token da API e valide a conexão antes de ativar cobranças e webhooks.
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <AsaasCredentialsForm
          maskedToken={data.maskedToken}
          updatedAt={data.updatedAt}
          loading={loading}
          saving={saving}
          testing={testing}
          error={error}
          success={success}
          onSubmit={saveToken}
          onTest={testConnection}
          onClearFeedback={clearFeedback}
        />
      </CardContent>
    </Card>
  );
}

export default AsaasIntegrationPanel;
