"use client";
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { IMaskInput } from 'react-imask';
import { toast } from 'sonner';
import { CustomToast } from '@/components/CustomToast';

const schema = z.object({
  name: z.string().min(2, 'Nome muito curto'),
  telefone: z.string().min(8, 'Telefone inválido').max(20).optional().or(z.literal('')),
  foto: z.string().url('URL inválida').optional().or(z.literal('')),
});
type FormValues = z.infer<typeof schema>;

export default function MinhaContaPage() {
  const [loading, setLoading] = useState(true);
  const [initialError, setInitialError] = useState<string | null>(null);
  const { register, handleSubmit, setValue, control, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', telefone: '', foto: '' },
  });

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/users/me', { cache: 'no-store' });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || 'Falha ao carregar');
        setValue('name', data.name || '');
  // Se vier apenas dígitos, mantenha; a máscara renderiza o formato no input controlado
  setValue('telefone', data.telefone || '');
        setValue('foto', data.foto || '');
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : 'Erro ao carregar';
        setInitialError(msg);
      } finally {
        setLoading(false);
      }
    })();
  }, [setValue]);

  async function onSubmit(values: FormValues) {
    const payload = {
      name: values.name,
      telefone: values.telefone ? values.telefone.replace(/\D/g, '') : undefined,
      foto: values.foto || undefined,
    };
    try {
      const res = await fetch('/api/users/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(typeof data?.error === 'string' ? data.error : 'Erro ao salvar');
      }
      toast.custom((t: string) => (
        <CustomToast variant="success" title="Perfil atualizado" description="Suas alterações foram salvas." onClose={() => toast.dismiss(t)} />
      ));
      // Atualiza campos com resposta (fonte da verdade)
      setValue('name', data.name || '');
      setValue('telefone', data.telefone || '');
      setValue('foto', data.foto || '');
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Revise os dados e tente novamente.';
      toast.custom((t: string) => (
        <CustomToast variant="error" title="Falha ao salvar" description={msg} onClose={() => toast.dismiss(t)} />
      ));
    }
  }

  if (loading) {
    return (
      <section aria-label="Minha Conta" className="flex flex-col gap-2">
        <h1 className="text-[32px] font-medium leading-tight text-black">Minha Conta</h1>
        <div className="mt-6 grid grid-cols-1 gap-4">
          <div className="rounded-xl border border-gray-200 p-6">
            <p className="text-sm text-gray-600">Carregando…</p>
          </div>
        </div>
      </section>
    );
  }

  if (initialError) {
    return (
      <section aria-label="Minha Conta" className="flex flex-col gap-2">
        <h1 className="text-[32px] font-medium leading-tight text-black">Minha Conta</h1>
        <div className="mt-6 grid grid-cols-1 gap-4">
          <div className="rounded-xl border border-red-200 p-6">
            <p className="text-sm text-red-600" role="alert">{initialError}</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section aria-label="Minha Conta" className="flex flex-col gap-2">
      <h1 className="text-[32px] font-medium leading-tight text-black">Minha Conta</h1>
      <p className="text-[15px] font-normal text-[#484848]">Gerencie seu perfil e contato.</p>

      <div className="mt-6 grid grid-cols-1 gap-4">
        <div className="rounded-[40px] bg-white p-8 shadow-[rgba(14,63,126,0.06)_0px_0px_0px_1px,rgba(42,51,70,0.03)_0px_1px_1px_-0.5px,rgba(42,51,70,0.04)_0px_2px_2px_-1px,rgba(42,51,70,0.04)_0px_3px_3px_-1.5px,rgba(42,51,70,0.03)_0px_5px_5px_-2.5px,rgba(42,51,70,0.03)_0px_10px_10px_-5px,rgba(42,51,70,0.03)_0px_24px_24px_-8px]">
          <form onSubmit={(e) => { void handleSubmit(onSubmit)(e); }} className="max-w-xl space-y-5" noValidate>
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">Nome</label>
              <input
                id="name"
                aria-invalid={!!errors.name || undefined}
                aria-describedby={errors.name ? 'name-error' : undefined}
                {...register('name')}
                type="text"
                className="mt-1 w-full h-12 rounded-[30px] border border-gray-300 bg-white px-5 text-[14px] font-medium text-gray-900 placeholder:text-gray-400 outline-none focus:border-gray-300 focus:ring-0"
                placeholder="Seu nome"
              />
              {errors.name && <p id="name-error" className="mt-1 text-xs text-red-600">{errors.name.message}</p>}
            </div>

            <div>
              <label htmlFor="telefone" className="block text-sm font-medium text-gray-700">Telefone</label>
              <Controller
                name="telefone"
                control={control}
                render={({ field }) => (
                  <IMaskInput
                    id="telefone"
                    mask={[{ mask: '(00) 0000-0000' }, { mask: '(00) 00000-0000' }]}
                    inputMode="tel"
                    // RHF bindings
                    value={field.value ?? ''}
                    onAccept={(val: string) => field.onChange(val)}
                    onBlur={field.onBlur}
                    aria-invalid={!!errors.telefone || undefined}
                    aria-describedby={errors.telefone ? 'tel-error' : undefined}
                    className="mt-1 w-full h-12 rounded-[30px] border border-gray-300 bg-white px-5 text-[14px] font-medium text-gray-900 placeholder:text-gray-400 outline-none focus:border-gray-300 focus:ring-0"
                    placeholder="(11) 99999-9999"
                  />
                )}
              />
              {errors.telefone && <p id="tel-error" className="mt-1 text-xs text-red-600">{errors.telefone.message as string}</p>}
            </div>

            <div>
              <label htmlFor="foto" className="block text-sm font-medium text-gray-700">Foto (URL)</label>
              <input
                id="foto"
                type="url"
                aria-invalid={!!errors.foto || undefined}
                aria-describedby={errors.foto ? 'foto-error' : undefined}
                {...register('foto')}
                className="mt-1 w-full h-12 rounded-[30px] border border-gray-300 bg-white px-5 text-[14px] font-medium text-gray-900 placeholder:text-gray-400 outline-none focus:border-gray-300 focus:ring-0"
                placeholder="https://..."
              />
              {errors.foto && <p id="foto-error" className="mt-1 text-xs text-red-600">{errors.foto.message as string}</p>}
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="h-12 rounded-[30px] bg-[#3C0269] hover:bg-[#4b0a7d] text-white text-[14px] font-medium px-6 transition-colors outline-none disabled:opacity-60"
                aria-label="Salvar alterações"
              >
                {isSubmitting ? 'Salvando…' : 'Salvar alterações'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}
