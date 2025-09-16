"use client";
import type { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { toast } from 'react-hot-toast';

interface Aluno { id: string; nome: string; email?: string; telefone?: string; status: string; foto?: string }
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

export function AlunoTable({ data, loading, onEdit, onDeleted }: { data: Aluno[]; loading: boolean; onEdit: (_row: Aluno) => void; onDeleted: () => void; }) {
  const columns: ColumnDef<Aluno>[] = [
    { accessorKey: 'nome', header: 'Nome', cell: ({ row }) => {
      const aluno = row.original;
      const initials = aluno.nome.split(/\s+/).slice(0,2).map(p=>p[0]).join('').toUpperCase();
      return (
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9">
            {aluno.foto ? <AvatarImage src={aluno.foto} alt={aluno.nome} /> : null}
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <span className="font-medium text-sm leading-tight">{aluno.nome}</span>
        </div>
      );
    } },
    { accessorKey: 'email', header: 'E-mail' },
    { accessorKey: 'telefone', header: 'Telefone' },
    { accessorKey: 'status', header: 'Status' },
    {
      id: 'actions',
      cell: ({ row }) => (
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => onEdit(row.original)}>Editar</Button>
          <Button size="sm" variant="outline" onClick={async () => {
            if (!confirm('Deseja realmente inativar este aluno?')) return;
            const res = await fetch(`/api/alunos/${row.original.id}` , { method: 'DELETE' });
            if (res.ok) { toast.success('Aluno inativado'); onDeleted(); } else { toast.error('Erro ao inativar'); }
          }}>Excluir</Button>
        </div>
      )
    }
  ];
  return <DataTable columns={columns} data={data} loading={loading} emptyMessage="Nenhum aluno encontrado" />;
}
