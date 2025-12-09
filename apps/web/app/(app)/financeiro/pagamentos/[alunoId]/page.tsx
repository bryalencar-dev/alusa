'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { StatusBadge } from '@/components/ui/status-badge';
import { ChevronLeft as ArrowLeft } from '@/components/icons/icons';
import { pushToast } from '@/components/ui/toast';
import { StatusCobranca } from '@prisma/client';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

type Pagamento = {
  id: string;
  cobrancaId: string;
  dataPagamento: string | null;
  formaPagamento: string;
  valorPago: number;
  status: string;
  comprovante: string | null;
  createdAt: string;
  cobranca: {
    id: string;
    tipo: string;
    status: StatusCobranca;
    valor: number;
    vencimento: string;
    descricao: string | null;
  };
};

type AlunoData = {
  id: string;
  nome: string;
  email: string | null;
  telefone: string | null;
  cpf: string | null;
  foto: string | null;
};

// Mapeamento de status para o StatusBadge
const statusMap: Record<string, 'ATIVO' | 'INATIVO' | 'PENDING' | 'CONFIRMED' | 'OVERDUE' | 'CANCELED' | 'REFUNDED' | 'RECEIVED'> = {
  'CONFIRMADO': 'CONFIRMED',
  'PAGO': 'CONFIRMED',
  'PENDENTE': 'PENDING',
  'ESTORNADO': 'REFUNDED',
  'CANCELADO': 'CANCELED',
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

const formatDate = (dateStr: string | null) => {
  if (!dateStr) return '—';
  try {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(new Date(dateStr));
  } catch {
    return '—';
  }
};

const getInitials = (nome: string) => {
  const parts = nome.split(' ').filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const FORMA_PAGAMENTO_LABELS: Record<string, string> = {
  BOLETO: 'Boleto Bancário',
  PIX: 'Pix',
  CARTAO_CREDITO: 'Cartão de Crédito',
  CREDIT_CARD: 'Cartão de Crédito',
  INDEFINIDO: 'Não definido',
  DINHEIRO: 'Dinheiro',
  TRANSFERENCIA: 'Transferência',
};

const TIPO_COBRANCA_LABELS: Record<string, string> = {
  TAXA_MATRICULA: 'Taxa de Matrícula',
  MENSALIDADE: 'Mensalidade',
  EXTRA: 'Extra',
  AVULSA: 'Avulsa',
  PARCELADA: 'Parcelada',
  RECORRENTE: 'Recorrente',
};

export default function PagamentoAlunoDetalhesPage({
  params,
}: {
  params: { alunoId: string };
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [aluno, setAluno] = useState<AlunoData | null>(null);
  const [pagamentos, setPagamentos] = useState<Pagamento[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  // Filtros
  const [statusFilter, setStatusFilter] = useState('TODOS');
  const [tipoFilter, setTipoFilter] = useState('TODOS');
  const [formaFilter, setFormaFilter] = useState('TODOS');
  const [searchTerm, setSearchTerm] = useState('');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch(`/api/financeiro/pagamentos/aluno/${params.alunoId}`, {
          cache: 'no-store',
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data?.error?.message || 'Erro ao carregar dados');
        }

        const payload = await res.json();
        setAluno(payload.data.aluno);
        setPagamentos(payload.data.pagamentos || []);
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : 'Erro desconhecido';
        setError(errMsg);
        pushToast({ title: 'Erro', description: errMsg, variant: 'error' });
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [params.alunoId]);

  // Loading state
  if (loading) {
    return (
      <div className="container mx-auto py-6 px-4 max-w-7xl">
        <div className="mb-8">
          <Skeleton className="h-10 w-32 mb-5" />
          <div className="flex items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div>
                <Skeleton className="h-7 w-64 mb-2" />
                <Skeleton className="h-4 w-40" />
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Skeleton className="h-[88px] w-[160px] rounded-lg" />
              <Skeleton className="h-[88px] w-[120px] rounded-lg" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="px-6 py-4 border-b border-gray-100">
            <Skeleton className="h-6 w-64" />
          </div>
          <div className="bg-gray-50 px-6 py-3 border-b">
            <div className="grid grid-cols-12 gap-4">
              <Skeleton className="col-span-3 h-4" />
              <Skeleton className="col-span-2 h-4" />
              <Skeleton className="col-span-2 h-4" />
              <Skeleton className="col-span-2 h-4" />
              <Skeleton className="col-span-2 h-4" />
              <Skeleton className="col-span-1 h-4" />
            </div>
          </div>
          <div className="divide-y">
            {[1, 2, 3].map((i) => (
              <div key={i} className="px-6 py-3">
                <div className="grid grid-cols-12 gap-4 items-center">
                  <Skeleton className="col-span-3 h-10" />
                  <Skeleton className="col-span-2 h-6" />
                  <Skeleton className="col-span-2 h-6" />
                  <Skeleton className="col-span-2 h-6" />
                  <Skeleton className="col-span-2 h-6" />
                  <Skeleton className="col-span-1 h-6" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !aluno) {
    return (
      <div className="container mx-auto py-6 px-4 max-w-7xl">
        <button
          onClick={() => router.back()}
          className="mb-8 flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </button>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
            <div className="flex items-center justify-center w-20 h-20 mb-6 bg-red-100 rounded-full">
              <span className="text-4xl">⚠️</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Erro ao carregar dados</h2>
            <p className="text-base text-gray-600 mb-8 max-w-md">
              {error || 'Os dados do aluno não foram encontrados'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Filtrar pagamentos
  const pagamentosFiltrados = pagamentos.filter((pagamento) => {
    // Filtro de busca
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const tipo = TIPO_COBRANCA_LABELS[pagamento.cobranca.tipo] || pagamento.cobranca.tipo;
      const forma = FORMA_PAGAMENTO_LABELS[pagamento.formaPagamento] || pagamento.formaPagamento;
      
      if (
        !tipo.toLowerCase().includes(searchLower) &&
        !forma.toLowerCase().includes(searchLower)
      ) {
        return false;
      }
    }
    
    // Filtro de data
    if (dataInicio || dataFim) {
      const dataPagamento = pagamento.dataPagamento || pagamento.createdAt;
      const dataPagamentoObj = new Date(dataPagamento);
      
      if (dataInicio) {
        const dataInicioObj = new Date(dataInicio);
        dataInicioObj.setHours(0, 0, 0, 0);
        if (dataPagamentoObj < dataInicioObj) {
          return false;
        }
      }
      
      if (dataFim) {
        const dataFimObj = new Date(dataFim);
        dataFimObj.setHours(23, 59, 59, 999);
        if (dataPagamentoObj > dataFimObj) {
          return false;
        }
      }
    }
    
    if (statusFilter !== 'TODOS' && pagamento.status !== statusFilter) {
      return false;
    }
    if (tipoFilter !== 'TODOS' && pagamento.cobranca.tipo !== tipoFilter) {
      return false;
    }
    if (formaFilter !== 'TODOS' && pagamento.formaPagamento !== formaFilter) {
      return false;
    }
    return true;
  });

  const totalPago = pagamentosFiltrados.reduce((sum, p) => sum + Number(p.valorPago), 0);

  // Função para exportar CSV
  const exportarCSV = () => {
    if (pagamentosFiltrados.length === 0) {
      pushToast({
        title: 'Sem dados',
        description: 'Não há pagamentos para exportar',
        variant: 'warning',
      });
      return;
    }

    const headers = ['Tipo', 'Valor Pago', 'Data Pagamento', 'Forma', 'Status'];
    const rows = pagamentosFiltrados.map((pagamento) => [
      TIPO_COBRANCA_LABELS[pagamento.cobranca.tipo] || pagamento.cobranca.tipo,
      formatCurrency(Number(pagamento.valorPago)),
      formatDate(pagamento.dataPagamento || pagamento.createdAt),
      FORMA_PAGAMENTO_LABELS[pagamento.formaPagamento] || pagamento.formaPagamento,
      pagamento.status,
    ]);

    // Adicionar linha de total
    rows.push(['', '', '', 'TOTAL:', formatCurrency(totalPago)]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute(
      'download',
      `historico-pagamentos-${aluno?.nome.replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    pushToast({
      title: 'CSV exportado',
      description: 'Relatório exportado com sucesso',
      variant: 'success',
    });
  };

  // Função para exportar PDF
  const exportarPDF = async () => {
    if (pagamentosFiltrados.length === 0) {
      pushToast({
        title: 'Sem dados',
        description: 'Não há pagamentos para exportar',
        variant: 'warning',
      });
      return;
    }

    try {
      // Importar jsPDF e plugin dinamicamente
      const jsPDFModule = await import('jspdf');
      const jsPDF = jsPDFModule.default || jsPDFModule.jsPDF;
      const autoTable = (await import('jspdf-autotable')).default;

      const doc = new jsPDF();

      // Título
      doc.setFontSize(18);
      doc.text('Histórico de Pagamento', 14, 20);

      // Informações do aluno
      doc.setFontSize(11);
      doc.text(`Aluno: ${aluno?.nome}`, 14, 30);
      if (aluno?.cpf) {
        doc.text(
          `CPF: ${aluno.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')}`,
          14,
          36,
        );
      }

      // Filtros aplicados
      doc.setFontSize(9);
      let yPos = 42;
      if (dataInicio || dataFim) {
        const periodo = `Período: ${dataInicio ? new Date(dataInicio).toLocaleDateString('pt-BR') : '---'} a ${dataFim ? new Date(dataFim).toLocaleDateString('pt-BR') : '---'}`;
        doc.text(periodo, 14, yPos);
        yPos += 6;
      }

      // Tabela
      const tableData = pagamentosFiltrados.map((pagamento) => [
        TIPO_COBRANCA_LABELS[pagamento.cobranca.tipo] || pagamento.cobranca.tipo,
        formatCurrency(Number(pagamento.valorPago)),
        formatDate(pagamento.dataPagamento || pagamento.createdAt),
        FORMA_PAGAMENTO_LABELS[pagamento.formaPagamento] || pagamento.formaPagamento,
        pagamento.status,
      ]);

      autoTable(doc, {
        head: [['Tipo', 'Valor Pago', 'Data', 'Forma', 'Status']],
        body: tableData,
        startY: yPos + 5,
        styles: { fontSize: 9, font: 'helvetica' },
        headStyles: { fillColor: [124, 58, 237], textColor: [255, 255, 255] },
        margin: { top: 10 },
      });

      // Total
      const finalY = (doc as any).lastAutoTable.finalY || yPos + 50;
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text(`Total: ${formatCurrency(totalPago)}`, 14, finalY + 10);

      // Data de geração
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text(
        `Relatório gerado em ${new Date().toLocaleString('pt-BR')}`,
        14,
        doc.internal.pageSize.height - 10,
      );

      doc.save(
        `historico-pagamentos-${aluno?.nome.replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.pdf`,
      );

      pushToast({
        title: 'PDF exportado',
        description: 'Relatório exportado com sucesso',
        variant: 'success',
      });
    } catch (error) {
      console.error('Erro ao exportar PDF:', error);
      pushToast({
        title: 'Erro',
        description: `Erro ao exportar relatório em PDF: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
        variant: 'error',
      });
    }
  };

  return (
    <div className="container mx-auto py-6 px-4 max-w-7xl pb-8">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => router.back()}
          className="mb-5 flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </button>

        <div className="flex items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <Avatar className="h-12 w-12">
              <AvatarImage src={aluno.foto || undefined} alt={aluno.nome} />
              <AvatarFallback className="bg-purple-100 text-purple-700 font-medium">
                {getInitials(aluno.nome)}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Histórico de Pagamento</h1>
              <p className="text-[13px] text-gray-500 mt-0.5">
                {aluno.nome}
                {aluno.cpf && ` • ${aluno.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')}`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="bg-white rounded-lg border border-gray-200 px-6 py-4 text-center min-w-[160px]">
              <p className="text-[11px] font-medium text-gray-500 uppercase tracking-wider mb-1">
                Total Pago
              </p>
              <p className="text-2xl font-semibold text-green-600">{formatCurrency(totalPago)}</p>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 px-6 py-4 text-center min-w-[120px]">
              <p className="text-[11px] font-medium text-gray-500 uppercase tracking-wider mb-1">
                Pagamentos
              </p>
              <p className="text-2xl font-semibold text-gray-900">{pagamentos.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Barra de Pesquisa e Filtros */}
      <div className="bg-white rounded-xl border p-4 mb-6">
        <div className="flex flex-col gap-4">
          {/* Linha 1: Busca */}
          <div className="relative flex-1">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="text"
              placeholder="Buscar por tipo ou forma de pagamento..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-10 pl-10 pr-4 text-[13px] border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-accent focus:border-transparent"
            />
          </div>

          {/* Linha 2: Filtros e Exportar */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <Input
                  type="date"
                  value={dataInicio}
                  onChange={(e) => setDataInicio(e.target.value)}
                  className="h-10 text-[13px] border-gray-300"
                  placeholder="Data início"
                />
                <span className="text-gray-500">até</span>
                <Input
                  type="date"
                  value={dataFim}
                  onChange={(e) => setDataFim(e.target.value)}
                  className="h-10 text-[13px] border-gray-300"
                  placeholder="Data fim"
                />
              </div>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-10 !w-auto md:!w-auto shrink-0 min-w-[140px] whitespace-nowrap bg-white text-gray-700 border border-gray-300 shadow-none px-3">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent align="end">
                  <SelectItem value="TODOS">Todos Status</SelectItem>
                  <SelectItem value="CONFIRMADO">Confirmado</SelectItem>
                  <SelectItem value="PAGO">Pago</SelectItem>
                  <SelectItem value="PENDENTE">Pendente</SelectItem>
                  <SelectItem value="ESTORNADO">Estornado</SelectItem>
                </SelectContent>
              </Select>

              <Select value={tipoFilter} onValueChange={setTipoFilter}>
                <SelectTrigger className="h-10 !w-auto md:!w-auto shrink-0 min-w-[140px] whitespace-nowrap bg-white text-gray-700 border border-gray-300 shadow-none px-3">
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent align="end">
                  <SelectItem value="TODOS">Todos Tipos</SelectItem>
                  <SelectItem value="TAXA_MATRICULA">Taxa de Matrícula</SelectItem>
                  <SelectItem value="MENSALIDADE">Mensalidade</SelectItem>
                  <SelectItem value="EXTRA">Extra</SelectItem>
                  <SelectItem value="AVULSA">Avulsa</SelectItem>
                </SelectContent>
              </Select>

              <Select value={formaFilter} onValueChange={setFormaFilter}>
                <SelectTrigger className="h-10 !w-auto md:!w-auto shrink-0 min-w-[140px] whitespace-nowrap bg-white text-gray-700 border border-gray-300 shadow-none px-3">
                  <SelectValue placeholder="Forma" />
                </SelectTrigger>
                <SelectContent align="end">
                  <SelectItem value="TODOS">Todas Formas</SelectItem>
                  <SelectItem value="PIX">Pix</SelectItem>
                  <SelectItem value="BOLETO">Boleto</SelectItem>
                  <SelectItem value="CARTAO_CREDITO">Cartão de Crédito</SelectItem>
                  <SelectItem value="INDEFINIDO">Não definido</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="h-10 px-4 text-[13px] font-medium">
                    <svg
                      className="h-4 w-4 mr-2"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    Gerar Relatório
                    <svg
                      className="h-4 w-4 ml-2"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={exportarCSV}>
                    <svg
                      className="h-4 w-4 mr-2"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    Exportar CSV
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={exportarPDF}>
                    <svg
                      className="h-4 w-4 mr-2"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                      />
                    </svg>
                    Exportar PDF
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>

      {/* Lista de Pagamentos */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        {pagamentos.length === 0 ? (
          <div className="px-6 py-12 text-center text-gray-500">
            <p className="text-sm">Nenhum pagamento encontrado</p>
          </div>
        ) : pagamentosFiltrados.length === 0 ? (
          <div className="px-6 py-12 text-center text-gray-500">
            <p className="text-sm">Nenhum pagamento encontrado com os filtros selecionados</p>
          </div>
        ) : (
          <>
            {/* Cabeçalho da tabela */}
            <div className="bg-gray-50 px-6 py-3 border-b">
              <div className="grid grid-cols-12 gap-4 text-[11px] font-medium text-gray-500 uppercase tracking-wider">
                <div className="col-span-3">Tipo</div>
                <div className="col-span-2 text-center">Valor Pago</div>
                <div className="col-span-2 text-center">Data Pagamento</div>
                <div className="col-span-2 text-center">Forma</div>
                <div className="col-span-2 text-center">Status</div>
                <div className="col-span-1 text-center">Ações</div>
              </div>
            </div>

            {/* Linhas */}
            <div className="divide-y">
              {pagamentosFiltrados.map((pagamento) => (
                <div
                  key={pagamento.id}
                  className="px-6 py-3 hover:bg-gray-50 transition-colors"
                >
                    <div className="grid grid-cols-12 gap-4 items-center">
                      {/* Tipo */}
                      <div className="col-span-3">
                        <p className="text-[13px] font-normal text-gray-900 truncate">
                          {TIPO_COBRANCA_LABELS[pagamento.cobranca.tipo] ||
                            pagamento.cobranca.tipo}
                        </p>
                      </div>

                    {/* Valor Pago */}
                    <div className="col-span-2 text-[13px] font-semibold text-gray-900 text-center">
                      {formatCurrency(Number(pagamento.valorPago))}
                    </div>

                    {/* Data do Pagamento */}
                    <div className="col-span-2 text-[13px] text-gray-700 text-center">
                      {formatDate(pagamento.dataPagamento || pagamento.createdAt)}
                    </div>

                    {/* Forma de Pagamento */}
                    <div className="col-span-2 text-[13px] text-gray-700 text-center">
                      {FORMA_PAGAMENTO_LABELS[pagamento.formaPagamento] ||
                        pagamento.formaPagamento}
                    </div>

                    {/* Status */}
                    <div className="col-span-2 flex justify-center">
                      <StatusBadge status={statusMap[pagamento.status] || 'PENDING'} />
                    </div>

                    {/* Ações */}
                    <div className="col-span-1 flex justify-center">
                      <button
                        onClick={() => router.push(`/cobrancas/${pagamento.cobrancaId}`)}
                        className="text-brand-accent hover:text-brand-accent/80"
                        title="Ver detalhes da cobrança"
                      >
                        <svg
                          className="h-5 w-5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

