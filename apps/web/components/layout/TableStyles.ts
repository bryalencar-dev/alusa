// Centraliza classes utilitárias para manter consistência visual entre tabelas.
// Se futuramente quisermos ajustar altura, tipografia ou cores, alteramos aqui.
export const table = {
  container: 'bg-white border border-gray-200 rounded-xl overflow-hidden',
  headerRow:
    'grid grid-cols-12 gap-4 text-[11px] font-medium text-gray-500 uppercase tracking-wider',
  headerWrap: 'bg-gray-50 px-6 py-3 border-b border-gray-200',
  bodyDivider: 'divide-y divide-gray-100',
  dataRow: 'px-6 py-3 hover:bg-gray-50 transition-colors bg-white',
  cellBase: 'text-[13px] leading-[20px] text-gray-700',
  primaryText: 'text-[13px] font-normal text-gray-900 truncate',
  actionsCell: 'flex justify-end gap-1',
  statusBadgeActive:
    'px-2.5 py-0.5 font-medium text-xs bg-green-100 text-green-700 border-green-200',
  statusBadgeInactive:
    'px-2.5 py-0.5 font-medium text-xs bg-rose-100 text-rose-700 border-rose-200',
  // Presets de distribuição de colunas para garantir coerência entre entidades
  cols: {
    alunos: {
      spans: {
        nome: 'col-span-3',
        cpf: 'col-span-2',
        email: 'col-span-3',
        telefone: 'col-span-2',
        status: 'col-span-1',
        acoes: 'col-span-1',
      },
    },
    planos: {
      spans: {
        nome: 'col-span-3',
        descricao: 'col-span-3',
        periodicidade: 'col-span-2',
        valor: 'col-span-2',
        status: 'col-span-1',
        acoes: 'col-span-1',
      },
    },
    modalidades: {
      spans: {
        nome: 'col-span-3', // alinhado com primeira coluna de alunos
        descricao: 'col-span-5',
        filler: 'col-span-2', // para manter grid consistente visualmente (pode ser oculto)
        status: 'col-span-1',
        acoes: 'col-span-1',
      },
    },
    salas: {
      spans: {
        nome: 'col-span-3',
        descricao: 'col-span-4',
        capacidade: 'col-span-2',
        status: 'col-span-1',
        acoes: 'col-span-1',
        vazio: 'col-span-1', // harmonização opcional
      },
    },
    turmas: {
      spans: {
        nome: 'col-span-3',
        dias: 'col-span-3',
        horario: 'col-span-2',
        professores: 'col-span-2',
        capacidade: 'col-span-1',
        acoes: 'col-span-1',
      },
    },
  },
};
