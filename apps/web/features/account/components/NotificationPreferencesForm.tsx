'use client';

import { useCallback, useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import type { Control } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';

import { CustomToast } from '@/components/CustomToast';
// Removido Alert: erro exibido como texto simples para evitar boxes aninhados
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import type { NotificationPreferences } from '@/features/account/services/profile-service';
import {
  ProfileUpdateError,
  fetchCurrentProfile,
  updateNotificationPreferences,
} from '@/features/account/services/profile-service';

const schema = z.object({
  emailProduct: z.boolean(),
  emailSecurity: z.boolean(),
  emailMarketing: z.boolean(),
  whatsapp: z.boolean(),
  sms: z.boolean(),
});

type FormValues = z.infer<typeof schema>;

export function NotificationPreferencesForm() {
  const [loading, setLoading] = useState(true);
  const [initialError, setInitialError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    reset,
    formState: { isDirty, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      emailProduct: true,
      emailSecurity: true,
      emailMarketing: false,
      whatsapp: true,
      sms: false,
    },
  });

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setInitialError(null);
      const profile = await fetchCurrentProfile();
      reset(profile.notifications, { keepDirty: false });
    } catch (error) {
      // Ignora aborts do fetch para evitar mensagens ruidosas
      if (
        (error as { name?: string })?.name === 'AbortError' ||
        (error instanceof Error && /abort/i.test(error.message))
      ) {
        return;
      }
      const message = error instanceof Error ? error.message : 'Falha ao carregar preferencias';
      setInitialError(message);
    } finally {
      setLoading(false);
    }
  }, [reset]);

  useEffect(() => {
    void load();
  }, [load]);

  const onSubmit = useCallback(
    async (values: FormValues) => {
      try {
        const prefs: NotificationPreferences = values;
        await updateNotificationPreferences(prefs);
        reset(prefs, { keepDirty: false });
        toast.custom((t) => (
          <CustomToast
            variant="success"
            title="Preferencias atualizadas"
            description="Suas notificacoes foram atualizadas."
            onClose={() => toast.dismiss(t)}
          />
        ));
      } catch (error) {
        if (error instanceof ProfileUpdateError) {
          toast.custom((t) => (
            <CustomToast
              variant="error"
              title="Falha ao atualizar preferencias"
              description={error.formErrors?.[0] ?? error.message}
              onClose={() => toast.dismiss(t)}
            />
          ));
          return;
        }
        const message = error instanceof Error ? error.message : 'Falha ao atualizar preferencias';
        toast.custom((t) => (
          <CustomToast
            variant="error"
            title="Falha ao atualizar preferencias"
            description={message}
            onClose={() => toast.dismiss(t)}
          />
        ));
      }
    },
    [reset],
  );

  if (loading) {
    return <div className="max-w-3xl h-24 w-full animate-pulse rounded-lg bg-slate-100" />;
  }

  // Com erro inicial, mantemos o formulário visível com valores padrão e exibimos mensagem no topo

  return (
    <div className="max-w-3xl space-y-3">
      {initialError ? (
        <div>
          <p className="text-sm font-medium text-destructive">Falha ao carregar preferencias</p>
          <p className="text-sm text-destructive/90">{initialError}</p>
        </div>
      ) : null}
      <form
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          void handleSubmit(onSubmit)(event);
        }}
      >
        <PreferenceRow
          control={control}
          name="emailProduct"
          label="Atualizacoes de produto"
          description="Resumo de novidades sobre o produto e melhorias semanais."
        />
        <PreferenceRow
          control={control}
          name="emailSecurity"
          label="Alertas de seguranca"
          description="Avisos sobre novos acessos, alteraçoes sensiveis e recomendacoes de seguranca."
        />
        <PreferenceRow
          control={control}
          name="emailMarketing"
          label="Novidades comerciais"
          description="Campanhas, ofertas e conteudos de marketing."
        />
        <PreferenceRow
          control={control}
          name="whatsapp"
          label="Lembretes por WhatsApp"
          description="Notificacoes operacionais e lembretes de clientes via WhatsApp."
        />
        <PreferenceRow
          control={control}
          name="sms"
          label="Alertas por SMS"
          description="Avisos rapidos enviados por SMS (pode ter custo adicional)."
        />
        <div className="flex justify-end">
          <Button type="submit" disabled={!isDirty || isSubmitting}>
            {isSubmitting ? 'Salvando...' : 'Salvar preferencias'}
          </Button>
        </div>
      </form>
    </div>
  );
}

function PreferenceRow({
  control,
  name,
  label,
  description,
}: {
  control: Control<FormValues>;
  name: keyof FormValues;
  label: string;
  description: string;
}) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { value, onChange } }) => (
        <div className="flex items-start gap-3 rounded-lg border border-slate-100 p-4">
          <Checkbox
            checked={value}
            onCheckedChange={(checked) => onChange(Boolean(checked))}
            aria-label={label}
            className="mt-1"
          />
          <div>
            <Label className="text-sm font-medium text-foreground">{label}</Label>
            <p className="text-xs text-muted-foreground">{description}</p>
          </div>
        </div>
      )}
    />
  );
}
