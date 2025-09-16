"use client";
import { useEffect, useState, useMemo, useCallback } from "react";
import { Plus, Search, Trash2, Edit3, Eye, EyeOff } from "lucide-react";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "../../../components/ui/select";
import { Avatar, AvatarImage, AvatarFallback } from "../../../components/ui/avatar";
import { Skeleton } from "../../../components/ui/skeleton";
import AlunoWizardDialog from "../../../components/aluno/AlunoWizardDialog";
import toast from "react-hot-toast";

type StatusAluno = "ATIVO" | "INATIVO";
type Filtro = "TODOS" | "ATIVOS" | "INATIVOS";

interface Aluno {
  id: string;
  nome: string;
  email?: string | null;
  cpf?: string | null;
  telefone?: string | null;
  status: StatusAluno;
  foto?: string | null;
  codigoInterno?: string | null;
}

export default function AlunosPage() {
  const [filtroStatus, setFiltroStatus] = useState<Filtro>("TODOS");
  const [busca, setBusca] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [openWizard, setOpenWizard] = useState(false);
  const [loading, setLoading] = useState(true);
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [erro, setErro] = useState<string | null>(null);
  const [showSensitiveData, setShowSensitiveData] = useState(false);
  const contaId = "conta-default";

  // Modal de exclusão definitiva
  const [deleting, setDeleting] = useState<Aluno | null>(null);
  const [deleteReason, setDeleteReason] = useState("");
  const [deletingLoading, setDeletingLoading] = useState(false);

  const fetchAlunos = useCallback(async () => {
    setLoading(true);
    setErro(null);
    try {
      const res = await fetch(`/api/alunos?contaId=${encodeURIComponent(contaId)}`);
      if (!res.ok) throw new Error("Falha ao carregar");
      const data = await res.json();
      setAlunos(Array.isArray(data) ? data : []);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Erro desconhecido";
      setErro(msg);
      toast.error("Erro ao carregar alunos");
    } finally {
      setLoading(false);
    }
  }, [contaId]);

  useEffect(() => {
    fetchAlunos();
    const handler = () => fetchAlunos();
    // Ouve evento global emitido pelo Wizard após criação
    window.addEventListener('alunos:changed', handler);
    return () => window.removeEventListener('alunos:changed', handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtrados = useMemo(() => {
    return alunos.filter((a) => {
      if (filtroStatus === "ATIVOS" && a.status !== "ATIVO") return false;
      if (filtroStatus === "INATIVOS" && a.status !== "INATIVO") return false;
      if (busca) {
        const b = busca.toLowerCase();
        if (
          !a.nome.toLowerCase().includes(b) &&
          !(a.email || "").toLowerCase().includes(b) &&
          !(a.codigoInterno || "").toLowerCase().includes(b)
        )
          return false;
      }
      return true;
    });
  }, [alunos, filtroStatus, busca]);

  const totalPages = Math.max(1, Math.ceil(filtrados.length / pageSize));
  const pageSafe = Math.min(page, totalPages);
  const slice = filtrados.slice((pageSafe - 1) * pageSize, pageSafe * pageSize);

  // Componente para texto com blur permanente
  function BlurredText({ value, isVisible }: { value: string; isVisible: boolean }) {
    if (isVisible) {
      return <span className="inline-block" title={value}>{value}</span>;
    }
    
    return (
      <div className="relative inline-block">
        <span className="absolute inset-0 blur-sm select-none">{value}</span>
        <span className="opacity-0 select-none">{value}</span>
      </div>
    );
  }

  function formatTelefoneOriginal(t?: string | null) {
    if (!t) return "-";
    const d = t.replace(/\D/g, "");
    if (d.length < 10) return t;
    if (d.length === 10) {
      return d.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
    } else {
      return d.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
    }
  }

  function formatCpfOriginal(c?: string | null) {
    if (!c) return "-";
    const d = c.replace(/\D/g, "");
    if (d.length !== 11) return c;
    return d.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  }

  function openDelete(a: Aluno) {
    setDeleting(a);
    setDeleteReason("");
  }

  async function confirmDelete() {
    if (!deleting) return;
    setDeletingLoading(true);
    try {
      const res = await fetch(`/api/alunos/${deleting.id}?motivo=${encodeURIComponent(deleteReason)}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Falha ao excluir');
      toast.success('Aluno excluído');
      setDeleting(null);
      setDeleteReason("");
      fetchAlunos();
    } catch {
      toast.error('Não foi possível excluir');
    } finally {
      setDeletingLoading(false);
    }
  }

  function handleEdit() {
    toast("Edição avançada em breve");
  }

  function onWizardFinish() {
    toast.success("Aluno cadastrado");
    setOpenWizard(false);
    fetchAlunos();
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="flex items-start justify-between">
          <div className="flex flex-col">
            <h1 className="text-lg font-semibold text-gray-900 tracking-tight">Alunos</h1>
            <p className="text-xs text-gray-500">Gestão de cadastros e status.</p>
          </div>
        </div>
        {/* Toolbar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Button onClick={() => setOpenWizard(true)} className="bg-violet-600 hover:bg-violet-700 text-white shadow-sm gap-2">
              <Plus className="h-4 w-4" /> Novo aluno
            </Button>
            <Select
              value={filtroStatus}
              onValueChange={(value) => {
                setFiltroStatus(value as Filtro);
                setPage(1);
              }}
            >
              <SelectTrigger className="h-10 w-[140px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="TODOS">Ver tudo</SelectItem>
                <SelectItem value="ATIVOS">Ativos</SelectItem>
                <SelectItem value="INATIVOS">Inativos</SelectItem>
              </SelectContent>
            </Select>
            <button
              onClick={() => setShowSensitiveData(!showSensitiveData)}
              className="flex h-10 w-auto items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50 gap-2 hover:bg-accent hover:text-accent-foreground"
              title={showSensitiveData ? "Ocultar dados sensíveis" : "Mostrar dados sensíveis"}
            >
              {showSensitiveData ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              {showSensitiveData ? "Ocultar" : "Mostrar"}
            </button>
          </div>
          <div className="relative w-full md:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              value={busca}
              onChange={(e) => {
                setBusca(e.target.value);
                setPage(1);
              }}
              placeholder="Pesquise aqui"
              className="pl-9 h-10 bg-white border-gray-200 text-sm"
            />
          </div>
        </div>
      </div>

      {/* Tabela */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="min-h-[320px]">
          {/* Cabeçalho */}
          <div className="grid grid-cols-12 px-6 h-12 bg-slate-50 border-b border-slate-200 text-sm font-semibold text-slate-600 items-center">
            <span className="col-span-3 text-left">Nome</span>
            <span className="col-span-2 text-left">CPF</span>
            <span className="col-span-3 text-left">E-mail</span>
            <span className="col-span-2 text-left">Telefone</span>
            <span className="col-span-1 text-center">Status</span>
            <span className="col-span-1 text-center">Ações</span>
          </div>

          {loading && (
            <div className="divide-y divide-slate-200">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="grid grid-cols-12 items-center gap-4 px-6 h-16 py-4">
                  <div className="col-span-3 flex items-center gap-3">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-2 w-full">
                      <Skeleton className="h-3 w-32" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                  </div>
                  <div className="col-span-2">
                    <Skeleton className="h-3 w-24" />
                  </div>
                  <div className="col-span-3">
                    <Skeleton className="h-3 w-40" />
                  </div>
                  <div className="col-span-2">
                    <Skeleton className="h-3 w-24" />
                  </div>
                  <div className="col-span-1 flex justify-center">
                    <Skeleton className="h-5 w-12 rounded-full" />
                  </div>
                  <div className="col-span-1 flex justify-center gap-2">
                    <Skeleton className="h-8 w-8 rounded-md" />
                    <Skeleton className="h-8 w-8 rounded-md" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && slice.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center gap-2">
              <p className="text-sm text-gray-600 font-medium">
                {erro ? "Erro ao carregar alunos" : "Nenhum aluno encontrado"}
              </p>
              {!erro && (
                <p className="text-[11px] text-gray-400">
                  Ajuste filtros ou cadastre um novo aluno.
                </p>
              )}
              {erro && (
                <Button variant="outline" size="sm" onClick={fetchAlunos}>
                  Tentar novamente
                </Button>
              )}
            </div>
          )}

          {!loading &&
            slice.map((a) => {
              const initials = a.nome
                .split(/\s+/)
                .slice(0, 2)
                .map((p) => p[0])
                .join("")
                .toUpperCase();
              return (
                <div
                  key={a.id}
                  className="grid grid-cols-12 px-6 h-16 py-4 items-center hover:bg-slate-50 transition border-b border-slate-200 last:border-b-0"
                >
                  {/* Nome */}
                  <div className="col-span-3 flex items-center gap-3 min-w-0">
                    <Avatar className="h-10 w-10 flex-shrink-0">
                      {a.foto && <AvatarImage src={a.foto} alt={a.nome} />}
                      <AvatarFallback className="h-10 w-10 bg-violet-100 text-violet-700 font-medium">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col min-w-0">
                      <span className="text-sm font-medium text-slate-900 truncate">
                        {a.nome}
                      </span>
                      <span className="text-xs text-slate-500 truncate">
                        {a.codigoInterno
                          ? `Código ${a.codigoInterno}`
                          : `ID ${a.id.slice(0, 8)}`}
                      </span>
                    </div>
                  </div>
                  <div
                    className="col-span-2 text-sm text-slate-700 overflow-visible"
                  >
                    <BlurredText value={formatCpfOriginal(a.cpf)} isVisible={showSensitiveData} />
                  </div>
                  <div
                    className="col-span-3 text-sm text-slate-700 overflow-visible"
                  >
                    <BlurredText value={a.email || "-"} isVisible={showSensitiveData} />
                  </div>
                  <div
                    className="col-span-2 text-sm text-slate-700 overflow-visible"
                  >
                    <BlurredText value={formatTelefoneOriginal(a.telefone)} isVisible={showSensitiveData} />
                  </div>
                  <div className="col-span-1 flex justify-center">
                    <span
                      className={`px-2 py-0.5 text-xs rounded-full font-medium border ${
                        a.status === "ATIVO"
                          ? "bg-green-100 text-green-700 border-green-200"
                          : "bg-red-100 text-red-700 border-red-200"
                      }`}
                    >
                      {a.status === "ATIVO" ? "Ativo" : "Inativo"}
                    </span>
                  </div>
                  <div className="col-span-1 flex justify-center gap-2">
                    <button
                      type="button"
                      aria-label="Editar aluno"
                      className="p-2 rounded-md hover:bg-slate-100 transition text-slate-500 hover:text-violet-700"
                      onClick={() => handleEdit()}
                    >
                      <Edit3 className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      aria-label="Excluir aluno"
                      className="p-2 rounded-md hover:bg-slate-100 transition text-slate-500 hover:text-red-600"
                      onClick={() => openDelete(a)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}
        </div>
        {/* Modal de exclusão */}
        {deleting && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow w-full max-w-sm p-5 space-y-4">
              <h3 className="text-sm font-semibold">Excluir aluno</h3>
              <p className="text-xs text-gray-600">Esta ação é permanente e removerá o aluno do sistema. Opcionalmente, informe um motivo.</p>
              <textarea
                value={deleteReason}
                onChange={(e) => setDeleteReason(e.target.value)}
                rows={3}
                className="w-full border rounded px-2 py-1 text-xs"
                placeholder="Motivo da exclusão (opcional)"
              />
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => { setDeleting(null); setDeleteReason(""); }} disabled={deletingLoading}>Cancelar</Button>
                <Button type="button" size="sm" className="bg-red-600 text-white hover:bg-red-700 disabled:opacity-50" onClick={confirmDelete} disabled={deletingLoading}>
                  {deletingLoading ? 'Excluindo...' : 'Excluir'}
                </Button>
              </div>
            </div>
          </div>
        )}
        {/* Paginação */}
        {!loading && slice.length > 0 && (
          <div className="border-t border-slate-200 bg-white flex justify-center items-center gap-2 py-3">
            <button
              type="button"
              className="w-8 h-8 flex items-center justify-center rounded-md text-sm bg-slate-50 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={pageSafe === 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              &lt;
            </button>
            {Array.from({ length: totalPages })
              .slice(0, totalPages > 7 ? 7 : totalPages)
              .map((_, i) => {
                const num = i + 1;
                return (
                  <button
                    key={num}
                    type="button"
                    className={`w-8 h-8 flex items-center justify-center rounded-md text-sm ${
                      num === pageSafe
                        ? "bg-violet-600 text-white"
                        : "bg-slate-50 hover:bg-slate-100"
                    }`}
                    onClick={() => setPage(num)}
                  >
                    {num}
                  </button>
                );
              })}
            {totalPages > 7 && (
              <span className="px-2 text-xs text-gray-400">...</span>
            )}
            {totalPages > 7 && (
              <button
                type="button"
                className={`w-8 h-8 flex items-center justify-center rounded-md text-sm ${
                  pageSafe === totalPages
                    ? "bg-violet-600 text-white"
                    : "bg-slate-50 hover:bg-slate-100"
                }`}
                onClick={() => setPage(totalPages)}
              >
                {totalPages}
              </button>
            )}
            <button
              type="button"
              className="w-8 h-8 flex items-center justify-center rounded-md text-sm bg-slate-50 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={pageSafe === totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              &gt;
            </button>
          </div>
        )}
      </div>

      {/* Modal Wizard via container */}
      <AlunoWizardDialog
        open={openWizard}
        onOpenChange={setOpenWizard}
        contaId={contaId}
        onFinish={onWizardFinish}
      />
    </div>
  );
}
