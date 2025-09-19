"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Trash2,
  Plus,
  Search,
  Filter,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Edit3,
  Eye,
  EyeOff,
} from "@/components/icons/icons";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import AlunoWizardDialog from "@/components/alunos/AlunoWizardDialog";
import { AlunoEditDialog, type EditAluno } from "@/components/alunos/AlunoEditDialog";
import AlunoDeleteDialog from "@/components/alunos/AlunoDeleteDialog";

type Aluno = {
  id: string;
  nome: string;
  email?: string;
  telefone?: string;
  status: "ATIVO" | "INATIVO";
  foto?: string;
  cpf?: string;
  consentimentoImagem?: boolean;
  dataConsentimentoImagem?: string;
  isentoTaxaMatricula?: boolean;
  bolsaDescontoPercent?: string | number | null;
  tags?: string[];
  dataInativacao?: string | null;
  motivoInativacao?: string | null;
};

function maskCpf(cpf: string) {
  const d = cpf.replace(/\D/g, "");
  if (d.length !== 11) return cpf;
  return (
    d.slice(0, 3) +
    "." +
    d.slice(3, 6) +
    "." +
    d.slice(6, 9) +
    "-" +
    d.slice(9, 11)
  );
}

export default function AlunosPage() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  // Controle de privacidade: oculta dados sensíveis com blur
  const [hideSensitive, setHideSensitive] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 10;
  // Edição
  const [editOpen, setEditOpen] = useState(false);
  const [editAluno, setEditAluno] = useState<EditAluno | null>(null);
  // Exclusão
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteAlunoId, setDeleteAlunoId] = useState<string | null>(null);
  const [deleteAlunoNome, setDeleteAlunoNome] = useState<string | undefined>(undefined);
  // Ordenação
  const [sortOrder, setSortOrder] = useState<"ASC" | "DESC">("ASC");

  // Filtros
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "TODOS" | "ATIVO" | "INATIVO"
  >("TODOS");
  // Removido: isento/bolsa do print. Manteremos apenas Status e Busca na barra.

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/alunos?contaId=conta-default", {
        cache: "no-store",
      });
      if (!res.ok) throw new Error("Falha ao carregar alunos");
      const data = await res.json();
      const items = (Array.isArray(data?.items) ? data.items : []).map(
        (a: Partial<Aluno>) =>
          ({
            id: String(a.id),
            nome: String(a.nome ?? ""),
            email: a.email ?? undefined,
            telefone: a.telefone ?? undefined,
            status: (a.status === "INATIVO" ? "INATIVO" : "ATIVO") as
              | "ATIVO"
              | "INATIVO",
            foto: a.foto ?? undefined,
            cpf: a.cpf ?? undefined,
            consentimentoImagem: Boolean(a.consentimentoImagem),
            dataConsentimentoImagem: a.dataConsentimentoImagem ?? undefined,
            isentoTaxaMatricula: Boolean(a.isentoTaxaMatricula),
            bolsaDescontoPercent: a.bolsaDescontoPercent ?? null,
            tags: Array.isArray(a.tags) ? a.tags : [],
            dataInativacao: a.dataInativacao ?? null,
            motivoInativacao: a.motivoInativacao ?? null,
          } as Aluno)
      );
      setAlunos(items);
    } catch {
      setAlunos([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  // Recarrega quando wizard dispara evento customizado
  useEffect(() => {
    function handleChanged() {
      load();
    }
    window.addEventListener('alunos:changed', handleChanged as EventListener);
    return () => window.removeEventListener('alunos:changed', handleChanged as EventListener);
  }, []);

  const onCreated = () => {
    load();
  };

  // Resetar página quando filtros/ordenação mudarem
  useEffect(() => {
    setPage(1);
  }, [searchTerm, statusFilter, sortOrder]);

  // Filtrar alunos
  const filteredAlunos = alunos.filter((aluno) => {
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const nome = aluno.nome.toLowerCase();
      const email = (aluno.email || "").toLowerCase();
      const cpf = (aluno.cpf || "").replace(/\D/g, "");
      const termNumbers = searchTerm.replace(/\D/g, "");

      if (
        !nome.includes(term) &&
        !email.includes(term) &&
        !cpf.includes(termNumbers)
      ) {
        return false;
      }
    }

    if (statusFilter !== "TODOS" && aluno.status !== statusFilter) {
      return false;
    }

    // Filtros de isenção/bolsa foram removidos na UI para ficar como o print

    return true;
  });

  // Aplicar ordenação por nome conforme sortOrder
  const orderedAlunos = [...filteredAlunos].sort((a, b) => {
    const comp = a.nome.localeCompare(b.nome, "pt-BR", { sensitivity: "base" });
    return sortOrder === "ASC" ? comp : -comp;
  });

  return (
    <div className="space-y-6">
      {/* Header + Subheader */}
      <div className="space-y-1">
        <h1 className="text-[22px] md:text-[24px] font-semibold tracking-tight text-gray-900">
          Gestão de Alunos
        </h1>
        <p className="text-[13px] text-gray-500">
          Gerencie cadastros, status e informações dos alunos.
        </p>
      </div>

      {/* Barra de ações */}
  <div className="bg-white rounded-xl border p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          {/* Ações à esquerda */}
          <div className="flex items-center gap-3">
            <Button
              onClick={() => setOpen(true)}
              className="bg-brand-accent hover:bg-brand-accent/90 text-white"
              aria-label="Cadastrar aluno"
              data-testid="abrir-wizard-aluno"
            >
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Aluno
            </Button>
            <Button
              variant="outline"
              onClick={() => setHideSensitive((v) => !v)}
              className="bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
              title={hideSensitive ? "Mostrar CPF, e-mail e telefone" : "Ocultar CPF, e-mail e telefone"}
              aria-label={hideSensitive ? "Mostrar dados sensíveis" : "Ocultar dados sensíveis"}
              aria-pressed={hideSensitive}
            >
              {hideSensitive ? (
                <>
                  <Eye className="h-4 w-4 mr-2" />
                  Mostrar dados
                </>
              ) : (
                <>
                  <EyeOff className="h-4 w-4 mr-2" />
                  Ocultar dados
                </>
              )}
            </Button>
          </div>

          {/* Filtros à direita (sempre visíveis) */}
          <div className="flex w-full md:w-auto items-center gap-3">
            {/* Botão Filtro (à esquerda do status) */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
                >
                  <Filter className="h-4 w-4 mr-2" />
                  Filtro
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-3 pt-2 pb-1 text-[11px] font-medium uppercase tracking-wide text-gray-500">
                  Ordenar por nome
                </div>
                <DropdownMenuItem
                  onClick={() => setSortOrder("ASC")}
                  className={"justify-between " + (sortOrder === "ASC" ? "text-brand-accent" : "")}
                >
                  A–Z (crescente)
                  {sortOrder === "ASC" ? <CheckCircle className="h-4 w-4" /> : null}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setSortOrder("DESC")}
                  className={"justify-between " + (sortOrder === "DESC" ? "text-brand-accent" : "")}
                >
                  Z–A (decrescente)
                  {sortOrder === "DESC" ? <CheckCircle className="h-4 w-4" /> : null}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Select
              value={statusFilter}
              onValueChange={(value) =>
                setStatusFilter(value as typeof statusFilter)
              }
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Todos os status" />
              </SelectTrigger>
              <SelectContent align="end">
                <SelectItem value="TODOS">Todos os status</SelectItem>
                <SelectItem value="ATIVO">Ativo</SelectItem>
                <SelectItem value="INATIVO">Inativo</SelectItem>
              </SelectContent>
            </Select>

            <div className="relative flex-1 md:w-[320px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar por nome, email ou CPF..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Tabela */}
      <div className="bg-white rounded-xl border overflow-hidden">
        {loading ? (
          <>
            {/* Header da tabela (skeleton) */}
            <div className="bg-gray-50 px-6 py-3 border-b">
              <div className="grid grid-cols-12 gap-4">
                <Skeleton className="col-span-3 h-4" />
                <Skeleton className="col-span-2 h-4" />
                <Skeleton className="col-span-3 h-4" />
                <Skeleton className="col-span-2 h-4" />
                <Skeleton className="col-span-1 h-4" />
                <Skeleton className="col-span-1 h-4" />
              </div>
            </div>
            {/* Linhas (skeleton) */}
            {[...Array(5)].map((_, i) => (
              <div key={i} className="px-6 py-3">
                <div className="grid grid-cols-12 gap-4 items-center">
                  <div className="col-span-3 flex items-center gap-3">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-48" />
                      <div className="flex gap-2">
                        <Skeleton className="h-4 w-12" />
                        <Skeleton className="h-4 w-16" />
                      </div>
                    </div>
                  </div>
                  <Skeleton className="col-span-2 h-4 w-28" />
                  <Skeleton className="col-span-3 h-4 w-56" />
                  <Skeleton className="col-span-2 h-4 w-32" />
                  <Skeleton className="col-span-1 h-6 w-12 rounded-full" />
                  <Skeleton className="col-span-1 h-8 w-8 rounded-md justify-self-end" />
                </div>
              </div>
            ))}
          </>
        ) : (
          <>
            {/* Cabeçalho da tabela */}
            <div className="bg-gray-50 px-6 py-3 border-b">
              <div className="grid grid-cols-12 gap-4 text-[11px] font-medium text-gray-500 uppercase tracking-wider">
                <div className="col-span-3">Aluno</div>
                <div className="col-span-2 text-center">CPF</div>
                <div className="col-span-3 text-center">E-mail</div>
                <div className="col-span-2 text-center">Telefone</div>
                <div className="col-span-1 text-center">Status</div>
                <div className="col-span-1 text-center">Ações</div>
              </div>
            </div>

            {/* Linhas */}
            <div className="divide-y">
              {orderedAlunos.length === 0 ? (
                <div className="px-6 py-12 text-center text-gray-500">
                  Nenhum aluno encontrado
                </div>
              ) : (
                // Paginação client-side
                (() => {
                  const totalPages = Math.max(
                    1,
                    Math.ceil(orderedAlunos.length / pageSize)
                  );
                  if (page > totalPages) setPage(totalPages);
                })()
                  ,
                orderedAlunos
                  .slice((page - 1) * pageSize, page * pageSize)
                  .map((aluno) => {
                  const initials = aluno.nome
                    .split(/\s+/)
                    .slice(0, 2)
                    .map((p) => p[0])
                    .join("")
                    .toUpperCase();
                  const shouldBlur = (val: string | undefined) =>
                    hideSensitive && !!val && val !== "-";
                  const blurBox =
                    "inline-block filter blur-[3px] px-1 -mx-1 py-0.5 -my-0.5 leading-[20px]";

                  return (
                    <div
                      key={aluno.id}
                      className="px-6 py-3 hover:bg-gray-50 transition-colors bg-white"
                    >
                      <div className="grid grid-cols-12 gap-4 items-center">
                        {/* Aluno */}
                        <div className="col-span-3 flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            {aluno.foto ? (
                              <AvatarImage src={aluno.foto} alt={aluno.nome} />
                            ) : null}
                            <AvatarFallback className="bg-purple-100 text-purple-700 font-medium">
                              {initials}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <div className="font-normal text-gray-900 text-[13px] truncate" data-testid={`aluno-nome-${aluno.id}`}>
                              {aluno.nome}
                            </div>
                            {/* Espaço reservado para chips abaixo do nome */}
                            <div className="flex flex-wrap gap-1 mt-1">
                              {aluno.isentoTaxaMatricula && (
                                <Badge
                                  variant="outline"
                                  className="text-xs bg-purple-50 text-purple-700 border-purple-200"
                                >
                                  Isento
                                </Badge>
                              )}
                              {aluno.bolsaDescontoPercent &&
                                Number(aluno.bolsaDescontoPercent) > 0 && (
                                  <Badge
                                    variant="outline"
                                    className="text-xs bg-green-50 text-green-700 border-green-200"
                                  >
                                    Bolsa {aluno.bolsaDescontoPercent}%
                                  </Badge>
                                )}
                            </div>
                          </div>
                        </div>

                        {/* CPF */}
                        <div className="col-span-2 text-[13px] text-gray-700 text-center">
                          <span className={shouldBlur(aluno.cpf) ? blurBox : "leading-[20px]"}>
                            {aluno.cpf ? maskCpf(aluno.cpf) : "-"}
                          </span>
                        </div>

                        {/* E-mail */}
                        <div
                          className="col-span-3 text-[13px] text-gray-700 text-center"
                          title={aluno.email || ""}
                        >
                          {shouldBlur(aluno.email) ? (
                            <span className={blurBox}>{aluno.email || "-"}</span>
                          ) : (
                            <span className="inline-block max-w-full truncate leading-[20px]">
                              {aluno.email || "-"}
                            </span>
                          )}
                        </div>

                        {/* Telefone */}
                        <div className="col-span-2 text-[13px] text-gray-700 text-center">
                          <span className={shouldBlur(aluno.telefone) ? blurBox : "leading-[20px]"}>
                            {aluno.telefone || "-"}
                          </span>
                        </div>

                        {/* Status */}
                        <div className="col-span-1 flex justify-center">
                          {aluno.status === "ATIVO" ? (
                            <Badge className="bg-green-100 text-green-700 border-green-200">
                              Ativo
                            </Badge>
                          ) : (
                            <Badge className="bg-red-100 text-red-700 border-red-200">
                              Inativo
                            </Badge>
                          )}
                        </div>

                        {/* Ações */}
                        <div className="col-span-1 flex justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-gray-600 hover:text-gray-800 hover:bg-gray-50"
                            aria-label="Editar aluno"
                            onClick={() => {
                              setEditAluno(mapToEditAluno(aluno));
                              setEditOpen(true);
                            }}
                          >
                            <Edit3 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                            aria-label="Excluir aluno"
                            onClick={() => {
                              setDeleteAlunoId(aluno.id);
                              setDeleteAlunoNome(aluno.nome);
                              setDeleteOpen(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </>
        )}
      </div>

      {/* Paginação */}
      {orderedAlunos.length > 0 && (
        <Pagination
          totalItems={orderedAlunos.length}
          pageSize={pageSize}
          page={page}
          onChange={setPage}
        />
      )}

      {/* Modais */}
      <AlunoWizardDialog open={open} onOpenChange={setOpen} onFinish={onCreated} />
      <AlunoEditDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        aluno={editAluno}
        onSaved={() => {
          setEditOpen(false);
          onCreated();
        }}
      />
      <AlunoDeleteDialog
        open={deleteOpen}
        onOpenChange={(o) => {
          if (!o) {
            setDeleteAlunoId(null);
            setDeleteAlunoNome(undefined);
          }
          setDeleteOpen(o);
        }}
        alunoId={deleteAlunoId}
        alunoNome={deleteAlunoNome}
        onDeleted={() => {
          setDeleteOpen(false);
          load();
        }}
      />
    </div>
  );
}

function mapToEditAluno(a: Aluno): EditAluno {
  return {
    id: a.id,
    nome: a.nome,
    nomeSocial: null,
    dataNasc: null,
    cpf: a.cpf ?? null,
    email: a.email ?? null,
    telefone: a.telefone ?? null,
    foto: a.foto ?? null,
    enderecoCep: null,
    enderecoLogradouro: null,
    enderecoNumero: null,
    enderecoComplemento: null,
    enderecoBairro: null,
    enderecoCidade: null,
    enderecoUf: null,
    observacao: null,
    genero: null,
    modalidadePrincipal: null,
    nivel: null,
    alergias: null,
    restricoesMedicas: null,
    contatoEmergenciaNome: null,
    contatoEmergenciaTelefone: null,
    origemCadastro: null,
    bolsaDescontoPercent: a.bolsaDescontoPercent ? Number(a.bolsaDescontoPercent) : null,
    isentoTaxaMatricula: a.isentoTaxaMatricula ?? null,
    consentimentoImagem: a.consentimentoImagem ?? null,
    dataConsentimentoImagem: a.dataConsentimentoImagem ?? null,
    consentimentoComunicacoes: null,
    tamanhoCamiseta: null,
    tamanhoCalcado: null,
    codigoInterno: null,
    tags: a.tags ?? null,
    status: a.status,
    responsavel: null,
  };
}

// Componente de paginação simples, centralizado com elipses
function Pagination({
  totalItems,
  pageSize,
  page,
  onChange,
}: {
  totalItems: number;
  pageSize: number;
  page: number;
  onChange: (_p: number) => void;
}) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const clamp = (n: number) => Math.min(totalPages, Math.max(1, n));

  const makePages = () => {
    const pages: (number | "…")[] = [];
    const maxButtons = 5; // 1, 2, current, last-1, last (com elipses)
    if (totalPages <= maxButtons + 2) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
      return pages;
    }
    const siblings = 1;
    const left = Math.max(2, page - siblings);
    const right = Math.min(totalPages - 1, page + siblings);
    pages.push(1);
    if (left > 2) pages.push("…");
    for (let i = left; i <= right; i++) pages.push(i);
    if (right < totalPages - 1) pages.push("…");
    pages.push(totalPages);
    return pages;
  };

  const pages = makePages();

  return (
    <div className="flex items-center justify-center py-6">
      <div className="flex items-center gap-2 text-sm">
        <IconButton
          aria-label="Primeira página"
          disabled={page === 1}
          onClick={() => onChange(1)}
        >
          <ChevronsLeft className="h-4 w-4" />
        </IconButton>
        <IconButton
          aria-label="Página anterior"
          disabled={page === 1}
          onClick={() => onChange(clamp(page - 1))}
        >
          <ChevronLeft className="h-4 w-4" />
        </IconButton>

        {pages.map((p, idx) =>
          p === "…" ? (
            <span key={`e-${idx}`} className="px-2 text-brand-accent/50">
              …
            </span>
          ) : (
            <button
              key={p}
              onClick={() => onChange(p)}
              aria-current={p === page ? "page" : undefined}
              className={
                "h-8 w-8 rounded-md border transition grid place-items-center " +
                "border-brand-accent/30 text-brand-accent hover:bg-brand-accent hover:text-white hover:border-brand-accent " +
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent/40 focus-visible:ring-offset-1 focus-visible:ring-offset-white " +
                (p === page
                  ? "bg-brand-accent text-white border-brand-accent hover:bg-brand-accent/90 hover:text-white"
                  : "bg-white")
              }
            >
              {p}
            </button>
          )
        )}

        <IconButton
          aria-label="Próxima página"
          disabled={page === totalPages}
          onClick={() => onChange(clamp(page + 1))}
        >
          <ChevronRight className="h-4 w-4" />
        </IconButton>
        <IconButton
          aria-label="Última página"
          disabled={page === totalPages}
          onClick={() => onChange(totalPages)}
        >
          <ChevronsRight className="h-4 w-4" />
        </IconButton>
      </div>
    </div>
  );
}

function IconButton({
  children,
  onClick,
  disabled,
  "aria-label": ariaLabel,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  "aria-label"?: string;
}) {
  return (
    <button
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={onClick}
      className="h-8 w-8 rounded-md border grid place-items-center transition \
      border-brand-accent/30 bg-white text-brand-accent hover:bg-brand-accent hover:text-white hover:border-brand-accent \
      focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent/40 focus-visible:ring-offset-1 focus-visible:ring-offset-white \
      disabled:text-gray-300 disabled:border-gray-200 disabled:hover:bg-white disabled:hover:text-gray-300 disabled:cursor-not-allowed"
    >
      {children}
    </button>
  );
}
