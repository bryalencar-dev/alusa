"use client";
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { alunoCreateSchema } from '@alusa/lib';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'react-hot-toast';
import type { z } from 'zod';

interface Props { aluno?: any; onClose: () => void; onSaved: () => void }

type FormValues = z.infer<typeof alunoCreateSchema>;

export function AlunoForm({ aluno, onClose, onSaved }: Props) {
  const form = useForm<FormValues>({ resolver: zodResolver(alunoCreateSchema), defaultValues: aluno ? { ...aluno } : { contaId: 'conta-default' } });

  async function onSubmit(values: FormValues) {
    try {
      const res = await fetch(aluno ? `/api/alunos/${aluno.id}` : '/api/alunos', {
        method: aluno ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values)
      });
      if (!res.ok) throw new Error('Erro');
      toast.success('Aluno salvo');
      onSaved();
      onClose();
    } catch (e) {
      toast.error('Erro ao salvar aluno');
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow p-6 w-[420px]">
        <h2 className="text-lg font-semibold mb-4">{aluno ? 'Editar Aluno' : 'Novo Aluno'}</h2>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
          <Input placeholder="Nome" {...form.register('nome')} />
          <Input placeholder="E-mail" {...form.register('email')} />
          <Input placeholder="Telefone" {...form.register('telefone')} />
          <Input type="date" placeholder="Data de Nascimento" {...form.register('dataNasc')} />
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit">Salvar</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
