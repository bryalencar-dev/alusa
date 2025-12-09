"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Search, Plus, CalendarDaysIcon, BanknotesIcon, ChartBarIcon, Close, Refresh } from "@/components/icons/icons";
import { PaperClipIcon } from "@heroicons/react/24/outline";

type Tipo = "RECEITA" | "DESPESA";
type StatusReceita = "RECEBIDO" | "PREVISTO" | "ESTORNADO";
type StatusDespesa = "PAGO" | "PENDENTE" | "ESTORNADO";
type StatusLancamento = StatusReceita | StatusDespesa;
type Origem = "SISTEMA" | "MANUAL";

type LancamentoItem = {
  id: string;
  tipo: Tipo;
  origem: Origem;
  status: StatusLancamento;
  valor: number;
  descricao: string;
  referencia: string | null;
  centroCustoId: string | null;
  centroCustoNome: string | null;
  categoriaId: string | null;
  categoriaNome: string | null;
  subcategoriaId: string | null;
  subcategoriaNome: string | null;
  formaPagamento: string | null;
  dataEfetiva: string | null;
  dataPrevista: string | null;
  isEstorno: boolean;
  parentId: string | null;
  dataEstorno: string | null;
  motivoEstorno: string | null;
  observacao: string | null;
  anexoUrl: string | null;
  externalRef: string | null;
  createdAt: string | null;
};

type Totals = { receitas: number; despesas: number; estornos: number; liquido: number };

type Categoria = { id: string; nome: string; tipo: Tipo; parentId: string | null };
type CentroCusto = { id: string; nome: string; tipo: 'RECEITA' | 'DESPESA' | 'MISTO' };

const statusOptions: Record<Tipo, { label: string; value: StatusLancamento }[]> = {
  RECEITA: [
    { label: "Recebido", value: "RECEBIDO" },
    { label: "Previsto", value: "PREVISTO" },
    { label: "Estornado", value: "ESTORNADO" },
  ],
  DESPESA: [
    { label: "Pago", value: "PAGO" },
    { label: "Pendente", value: "PENDENTE" },
    { label: "Estornado", value: "ESTORNADO" },
  ],
};

const SELECT_ALL = "ALL";
const SELECT_NONE = "NONE";

const formaPagamentoList = [
  "PIX",
  "BOLETO",
  "CARTAO_CREDITO",
  "CARTAO_DEBITO",
  "DINHEIRO",
  "TRANSFERENCIA",
  "TED",
  "DOC",
  "DEBITO_AUTOMATICO",
  "CHEQUE",
  "VOUCHER",
  "OUTRO",
];

const emptyForm = (): FormState => ({
  tipo: "RECEITA",
  origem: "MANUAL",
  status: "PREVISTO",
  valor: "",
  descricao: "",
  referencia: "",
  centroCustoId: SELECT_NONE,
  categoriaId: SELECT_NONE,
  subcategoriaId: SELECT_NONE,
  formaPagamento: SELECT_NONE,
  dataEfetiva: "",
  dataPrevista: new Date().toISOString().slice(0, 10),
  observacao: "",
  anexoUrl: "",
});

type FormState = {
  tipo: Tipo;
  origem: Origem;
  status: StatusLancamento;
  valor: string;
  descricao: string;
  referencia: string;
  centroCustoId: string;
  categoriaId: string;
  subcategoriaId: string;
  formaPagamento: string;
  dataEfetiva: string;
  dataPrevista: string;
  observacao: string;
  anexoUrl: string;
};

export default function LancamentosPage() {
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<LancamentoItem[]>([]);
  const [totals, setTotals] = useState<Totals>({ receitas: 0, despesas: 0, estornos: 0, liquido: 0 });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [search, setSearch] = useState("");
  const [tipoFilter, setTipoFilter] = useState<Tipo | typeof SELECT_ALL>(SELECT_ALL);
  const [statusFilter, setStatusFilter] = useState<StatusLancamento | typeof SELECT_ALL>(SELECT_ALL);
  const [origemFilter, setOrigemFilter] = useState<Origem | typeof SELECT_ALL>(SELECT_ALL);
  const [centroFilter, setCentroFilter] = useState<string | typeof SELECT_ALL>(SELECT_ALL);
  const [sort, setSort] = useState<"dataEfetiva" | "valor">("dataEfetiva");
  const [order, setOrder] = useState<"asc" | "desc">("desc");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);

  const [estornoId, setEstornoId] = useState<string | null>(null);
  const [estornoData, setEstornoData] = useState(new Date().toISOString().slice(0, 10));
  const [estornoMotivo, setEstornoMotivo] = useState("");
  const [estornando, setEstornando] = useState(false);

  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [centrosCusto, setCentrosCusto] = useState<CentroCusto[]>([]);
  const [novaCategoriaNome, setNovaCategoriaNome] = useState("");
  const [criandoCategoria, setCriandoCategoria] = useState(false);

  const [uploading, setUploading] = useState(false);

  const tipoAtivo: Tipo = (form?.tipo as Tipo) || "RECEITA";
  const statusOptionsAtuais = statusOptions[tipoAtivo];

  const fetchCategorias = useCallback(async () => {
    try {
      const tipoQuery = form.tipo ? `?tipo=${form.tipo}` : "";
      const res = await fetch(`/api/financeiro/lancamentos/categorias${tipoQuery}`, { cache: "no-store" });
      if (!res.ok) throw new Error("Falha ao carregar categorias");
      const data = await res.json();
      setCategorias(data.data || []);
    } catch (err) {
      console.error(err);
    }
  }, [form.tipo]);

  const fetchCentrosCusto = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (form.tipo) params.set("tipo", form.tipo);
      params.set("status", "ATIVO");
      const res = await fetch(`/api/financeiro/centros-custo?${params.toString()}`, { cache: "no-store" });
      if (!res.ok) throw new Error("Falha ao carregar centros de custo");
      const data = await res.json();
      setCentrosCusto(data.data || []);
    } catch (err) {
      console.error(err);
    }
  }, [form.tipo]);

  const load = useCallback(
    async (pageToLoad = 1) => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        params.set("page", String(pageToLoad));
        params.set("pageSize", "20");
        if (search.trim()) params.set("q", search.trim());
        if (tipoFilter !== SELECT_ALL) params.set("tipo", tipoFilter);
        if (statusFilter !== SELECT_ALL) params.append("status", statusFilter);
        if (origemFilter !== SELECT_ALL) params.append("origem", origemFilter);
        if (centroFilter !== SELECT_ALL) params.set("centroCustoId", centroFilter);
        params.set("sort", sort);
        params.set("order", order);

        const res = await fetch(`/api/financeiro/lancamentos?${params.toString()}`, { cache: "no-store" });
        const json = await res.json().catch(() => null);
        if (!res.ok) throw new Error(json?.error?.message || "Falha ao carregar lancamentos");
        setItems(json.data || []);
        setTotals(json.totals || { receitas: 0, despesas: 0, estornos: 0, liquido: 0 });
        setPage(json.page || 1);
        setTotalPages(json.totalPages || 1);
      } catch (err) {
        toast.error((err as Error).message);
        setItems([]);
      } finally {
        setLoading(false);
      }
    },
    [order, search, sort, statusFilter, tipoFilter, origemFilter],
  );

  useEffect(() => {
    load(1);
  }, [load]);

  useEffect(() => {
    fetchCategorias();
  }, [fetchCategorias]);

  useEffect(() => {
    fetchCentrosCusto();
  }, [fetchCentrosCusto]);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm());
    setModalOpen(true);
  };

  const openEdit = (item: LancamentoItem) => {
    setEditingId(item.id);
    setForm({
      tipo: item.tipo,
      origem: item.origem,
      status: item.status,
      valor: String(item.valor),
      descricao: item.descricao,
      referencia: item.referencia || "",
      centroCustoId: item.centroCustoId || SELECT_NONE,
      categoriaId: item.categoriaId || SELECT_NONE,
      subcategoriaId: item.subcategoriaId || SELECT_NONE,
      formaPagamento: item.formaPagamento || SELECT_NONE,
      dataEfetiva: item.dataEfetiva ? item.dataEfetiva.slice(0, 10) : "",
      dataPrevista: item.dataPrevista ? item.dataPrevista.slice(0, 10) : "",
      observacao: item.observacao || "",
      anexoUrl: item.anexoUrl || "",
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.descricao.trim() || !form.valor) {
      toast.error("Informe descricao e valor");
      return;
    }
    const statusValido = statusByTipo(form.tipo).includes(form.status);
    if (!statusValido) {
      toast.error("Status invalido para o tipo selecionado");
      return;
    }
    if (form.origem === "MANUAL" && (form.centroCustoId === SELECT_NONE || !form.centroCustoId)) {
      toast.error("Selecione um centro de custo para lançamentos manuais");
      return;
    }
    const payload = {
      tipo: form.tipo,
      origem: form.origem,
      status: form.status,
      valor: Number(form.valor),
      descricao: form.descricao.trim(),
      referencia: form.referencia.trim() || null,
      centroCustoId: form.centroCustoId === SELECT_NONE ? null : form.centroCustoId,
      categoriaId: form.categoriaId === SELECT_NONE ? null : form.categoriaId,
      subcategoriaId: form.subcategoriaId === SELECT_NONE ? null : form.subcategoriaId,
      formaPagamento: form.formaPagamento === SELECT_NONE ? null : form.formaPagamento,
      dataEfetiva: form.dataEfetiva || null,
      dataPrevista: form.dataPrevista || null,
      observacao: form.observacao.trim() || null,
      anexoUrl: form.anexoUrl || null,
    };
    setSaving(true);
    try {
      const res = await fetch(editingId ? `/api/financeiro/lancamentos/${editingId}` : "/api/financeiro/lancamentos", {
        method: editingId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(json?.error?.message || "Falha ao salvar");
      toast.success(editingId ? "Lancamento atualizado" : "Lancamento criado");
      setModalOpen(false);
      setForm(emptyForm());
      load(page);
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handleEstornar = async () => {
    if (!estornoId) return;
    setEstornando(true);
    try {
      const res = await fetch(`/api/financeiro/lancamentos/${estornoId}/estornar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dataEstorno: estornoData, motivo: estornoMotivo.trim() || null }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(json?.error?.message || "Falha ao estornar");
      toast.success("Estorno registrado");
      setEstornoId(null);
      setEstornoMotivo("");
      load(page);
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setEstornando(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Remover lancamento manual?")) return;
    try {
      const res = await fetch(`/api/financeiro/lancamentos/${id}`, { method: "DELETE" });
      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(json?.error?.message || "Falha ao remover");
      toast.success("Lancamento removido");
      load(page);
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  const handleCreateCategoria = async () => {
    if (!novaCategoriaNome.trim()) {
      toast.error("Informe o nome da categoria");
      return;
    }
    setCriandoCategoria(true);
    try {
      const res = await fetch("/api/financeiro/lancamentos/categorias", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome: novaCategoriaNome.trim(), tipo: form.tipo, parentId: null }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(json?.error?.message || "Falha ao criar categoria");
      toast.success("Categoria criada");
      setNovaCategoriaNome("");
      fetchCategorias();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setCriandoCategoria(false);
    }
  };

  const handleUpload = async (file?: File | null) => {
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(json?.error || "Falha no upload");
      setForm((prev) => ({ ...prev, anexoUrl: json.url }));
      toast.success("Comprovante anexado");
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setUploading(false);
    }
  };

  const formattedItems = useMemo(() => {
    return items.map((it) => ({
      ...it,
      valorAbs: Math.abs(it.valor),
      valorSigned: it.tipo === "RECEITA" ? (it.isEstorno ? -it.valor : it.valor) : it.isEstorno ? it.valor : -it.valor,
    }));
  }, [items]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-[22px] md:text-[24px] font-semibold text-gray-900">Lancamentos</h1>
          <p className="text-[13px] text-gray-500">
            Extrato de receitas e despesas com estornos, filtros e exportacao futura.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => load(page)}>
            <Refresh className="h-4 w-4 mr-2" /> Atualizar
          </Button>
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4 mr-2" /> Novo lancamento
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Receitas" value={totals.receitas} color="text-emerald-600" icon={<BanknotesIcon className="h-5 w-5" />} />
        <KpiCard label="Despesas" value={totals.despesas} color="text-rose-600" icon={<ChartBarIcon className="h-5 w-5" />} />
        <KpiCard label="Estornos" value={totals.estornos} color="text-amber-600" icon={<Close className="h-5 w-5" />} />
        <KpiCard label="Liquido" value={totals.liquido} color="text-indigo-700" icon={<BanknotesIcon className="h-5 w-5" />} />
      </div>

      <div className="bg-white border rounded-xl p-4 shadow-sm space-y-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="relative w-full md:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar por descricao ou referencia..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Select value={tipoFilter} onValueChange={(v) => setTipoFilter(v as Tipo | typeof SELECT_ALL)}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={SELECT_ALL}>Todos</SelectItem>
                <SelectItem value="RECEITA">Receita</SelectItem>
                <SelectItem value="DESPESA">Despesa</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusLancamento | typeof SELECT_ALL)}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={SELECT_ALL}>Todos</SelectItem>
                <SelectItem value="RECEBIDO">Recebido</SelectItem>
                <SelectItem value="PREVISTO">Previsto</SelectItem>
                <SelectItem value="PAGO">Pago</SelectItem>
                <SelectItem value="PENDENTE">Pendente</SelectItem>
                <SelectItem value="ESTORNADO">Estornado</SelectItem>
              </SelectContent>
            </Select>
            <Select value={origemFilter} onValueChange={(v) => setOrigemFilter(v as Origem | typeof SELECT_ALL)}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Origem" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={SELECT_ALL}>Todas</SelectItem>
                <SelectItem value="SISTEMA">Sistema</SelectItem>
                <SelectItem value="MANUAL">Manual</SelectItem>
              </SelectContent>
            </Select>
            <Select value={centroFilter} onValueChange={(v) => setCentroFilter(v)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Centro de Custo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={SELECT_ALL}>Todos centros</SelectItem>
                {centrosCusto.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={sort} onValueChange={(v) => setSort(v as "dataEfetiva" | "valor")}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Ordenar por" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="dataEfetiva">Data</SelectItem>
                <SelectItem value="valor">Valor</SelectItem>
              </SelectContent>
            </Select>
            <Select value={order} onValueChange={(v) => setOrder(v as "asc" | "desc")}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Ordem" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="desc">Desc</SelectItem>
                <SelectItem value="asc">Asc</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left font-semibold text-gray-600">Descricao</th>
                <th className="px-3 py-2 text-left font-semibold text-gray-600">Tipo</th>
                <th className="px-3 py-2 text-left font-semibold text-gray-600">Origem</th>
                <th className="px-3 py-2 text-left font-semibold text-gray-600">Centro de Custo</th>
                <th className="px-3 py-2 text-left font-semibold text-gray-600">Data</th>
                <th className="px-3 py-2 text-right font-semibold text-gray-600">Valor</th>
                <th className="px-3 py-2 text-left font-semibold text-gray-600">Status</th>
                <th className="px-3 py-2 text-left font-semibold text-gray-600">Forma</th>
                <th className="px-3 py-2 text-right font-semibold text-gray-600">Acoes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading && (
                <tr>
                  <td className="px-3 py-4 text-gray-500" colSpan={8}>
                    Carregando...
                  </td>
                </tr>
              )}
              {!loading && formattedItems.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-3 py-6 text-center text-gray-500">
                    Nenhum lancamento encontrado. Clique em "Novo lancamento" para adicionar.
                  </td>
                </tr>
              )}
              {formattedItems.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-3 py-2">
                    <div className="flex flex-col gap-0.5">
                      <span className="font-medium text-gray-900">{item.descricao}</span>
                      <span className="text-xs text-gray-500">{item.referencia || "Sem referencia"}</span>
                      <span className="text-xs text-gray-500">
                        {item.categoriaNome || "Sem categoria"}
                        {item.subcategoriaNome ? ` / ${item.subcategoriaNome}` : ""}
                      </span>
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    <Badge className={tipoBadgeClass(item.tipo)}>
                      {item.tipo === "RECEITA" ? "Receita" : "Despesa"}
                    </Badge>
                  </td>
                  <td className="px-3 py-2">
                    <Badge variant="outline">{item.origem === "SISTEMA" ? "Sistema" : "Manual"}</Badge>
                  </td>
                  <td className="px-3 py-2 text-gray-700">
                    {item.centroCustoNome || "--"}
                  </td>
                  <td className="px-3 py-2 text-gray-700 flex items-center gap-1">
                    <CalendarDaysIcon className="h-4 w-4 text-gray-400" />
                    {item.dataEfetiva?.slice(0, 10) || item.dataPrevista?.slice(0, 10) || "--"}
                  </td>
                  <td className="px-3 py-2 text-right font-semibold text-gray-900">
                    <span className={item.tipo === "RECEITA" ? "text-emerald-600" : "text-rose-600"}>
                      {item.tipo === "RECEITA" ? "" : "-"} R$ {item.valorAbs.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      {item.isEstorno ? " (estorno)" : ""}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <Badge className={statusBadgeClass(item.status)}>{item.status}</Badge>
                  </td>
                    <td className="px-3 py-2 text-gray-700">{item.formaPagamento || "--"}</td>
                  <td className="px-3 py-2 text-right space-x-2">
                    <button className="text-indigo-600 text-sm" onClick={() => openEdit(item)}>
                      Editar
                    </button>
                    {(item.status === "RECEBIDO" || item.status === "PAGO") && !item.isEstorno && (
                      <button
                        className="text-rose-600 text-sm"
                        onClick={() => {
                          setEstornoId(item.id);
                          setEstornoData(new Date().toISOString().slice(0, 10));
                          setEstornoMotivo(`Estorno de ${item.descricao}`);
                        }}
                      >
                        Estornar
                      </button>
                    )}
                    {item.origem === "MANUAL" && !item.isEstorno && (
                      <button className="text-gray-500 text-sm" onClick={() => handleDelete(item.id)}>
                        Remover
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-3">
            <span className="text-xs text-gray-500">
              Pagina {page} de {totalPages}
            </span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => load(page - 1)}>
                Anterior
              </Button>
              <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => load(page + 1)}>
                Proxima
              </Button>
            </div>
          </div>
        )}
      </div>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{editingId ? "Editar lancamento" : "Novo lancamento"}</DialogTitle>
            <DialogDescription>Informe os dados do lancamento. Status e datas seguem o tipo.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Tipo</label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={form.tipo === "RECEITA" ? "default" : "outline"}
                  onClick={() => setForm((prev) => ({ ...prev, tipo: "RECEITA", status: "PREVISTO" }))}
                >
                  Receita
                </Button>
                <Button
                  type="button"
                  variant={form.tipo === "DESPESA" ? "default" : "outline"}
                  onClick={() => setForm((prev) => ({ ...prev, tipo: "DESPESA", status: "PENDENTE" }))}
                >
                  Despesa
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select value={form.status} onValueChange={(v) => setForm((prev) => ({ ...prev, status: v as StatusLancamento }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statusOptionsAtuais.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Descricao</label>
              <Input value={form.descricao} onChange={(e) => setForm((prev) => ({ ...prev, descricao: e.target.value }))} />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Valor</label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={form.valor}
                onChange={(e) => setForm((prev) => ({ ...prev, valor: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Centro de custo</label>
              <Select value={form.centroCustoId} onValueChange={(v) => setForm((prev) => ({ ...prev, centroCustoId: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={SELECT_NONE}>Selecione um centro</SelectItem>
                  {centrosCusto
                    .filter((c) => c.tipo === 'MISTO' || c.tipo === form.tipo)
                    .map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.nome} {c.tipo === 'MISTO' ? '(Misto)' : ''}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              <div className="flex flex-wrap gap-2 text-xs text-indigo-700">
                <Button variant="link" className="px-0" onClick={() => window.open('/financeiro/centros-custo', '_blank')}>
                  Gerenciar centros de custo
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Categoria</label>
              <Select value={form.categoriaId} onValueChange={(v) => setForm((prev) => ({ ...prev, categoriaId: v, subcategoriaId: SELECT_NONE }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={SELECT_NONE}>Sem categoria</SelectItem>
                  {categorias
                    .filter((c) => !c.parentId)
                    .map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.nome}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              <div className="flex gap-2">
                <Input
                  placeholder="Nova categoria"
                  value={novaCategoriaNome}
                  onChange={(e) => setNovaCategoriaNome(e.target.value)}
                />
                <Button variant="outline" onClick={handleCreateCategoria} disabled={criandoCategoria}>
                  {criandoCategoria ? "Salvando..." : "Criar"}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Subcategoria</label>
              <Select
                value={form.subcategoriaId}
                onValueChange={(v) => setForm((prev) => ({ ...prev, subcategoriaId: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={SELECT_NONE}>Sem subcategoria</SelectItem>
                  {categorias
                    .filter((c) => c.parentId && c.parentId === form.categoriaId)
                    .map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.nome}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Forma pagamento</label>
              <Select
                value={form.formaPagamento}
                onValueChange={(v) => setForm((prev) => ({ ...prev, formaPagamento: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                <SelectItem value={SELECT_NONE}>Nao informar</SelectItem>
                {formaPagamentoList.map((fp) => (
                  <SelectItem key={fp} value={fp}>
                    {fp.replace(/_/g, " ")}
                  </SelectItem>
                ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Data efetiva</label>
              <Input
                type="date"
                value={form.dataEfetiva}
                onChange={(e) => setForm((prev) => ({ ...prev, dataEfetiva: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Data prevista</label>
              <Input
                type="date"
                value={form.dataPrevista}
                onChange={(e) => setForm((prev) => ({ ...prev, dataPrevista: e.target.value }))}
              />
            </div>

            <div className="md:col-span-2 space-y-2">
              <label className="text-sm font-medium">Observacao</label>
              <Textarea
                rows={3}
                value={form.observacao}
                onChange={(e) => setForm((prev) => ({ ...prev, observacao: e.target.value }))}
              />
            </div>

            <div className="md:col-span-2 space-y-2">
              <label className="text-sm font-medium">Comprovante (imagem ou PDF)</label>
              <div className="flex items-center gap-3">
                <input
                  type="file"
                  accept=".pdf,image/*"
                  onChange={(e) => handleUpload(e.target.files?.[0])}
                  disabled={uploading}
                />
                {form.anexoUrl && (
                  <a href={form.anexoUrl} target="_blank" rel="noreferrer" className="text-indigo-600 text-sm flex items-center gap-1">
                    <PaperClipIcon className="h-4 w-4" /> Ver anexo
                  </a>
                )}
              </div>
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!estornoId} onOpenChange={(open) => (!open ? setEstornoId(null) : null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar estorno</DialogTitle>
            <DialogDescription>Informe data e motivo para registrar o estorno.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2">
              <label className="text-sm font-medium">Data do estorno</label>
              <Input type="date" value={estornoData} onChange={(e) => setEstornoData(e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Motivo</label>
              <Input value={estornoMotivo} onChange={(e) => setEstornoMotivo(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEstornoId(null)}>
              Cancelar
            </Button>
            <Button onClick={handleEstornar} disabled={estornando}>
              {estornando ? "Processando..." : "Estornar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function statusByTipo(tipo: Tipo) {
  return tipo === "RECEITA" ? (["RECEBIDO", "PREVISTO", "ESTORNADO"] as StatusLancamento[]) : (["PAGO", "PENDENTE", "ESTORNADO"] as StatusLancamento[]);
}

function tipoBadgeClass(tipo: Tipo) {
  return tipo === "RECEITA"
    ? "bg-emerald-100 text-emerald-700 border-emerald-200"
    : "bg-rose-100 text-rose-700 border-rose-200";
}

function statusBadgeClass(status: StatusLancamento) {
  if (status === "RECEBIDO" || status === "PAGO") {
    return "bg-emerald-100 text-emerald-800 border-emerald-200";
  }
  if (status === "PREVISTO" || status === "PENDENTE") {
    return "bg-gray-100 text-gray-700 border-gray-200";
  }
  return "bg-amber-100 text-amber-800 border-amber-200";
}

function KpiCard({ label, value, color, icon }: { label: string; value: number; color: string; icon: ReactNode }) {
  return (
    <div className="rounded-xl border bg-white p-4 shadow-sm flex items-center gap-3">
      <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-700">{icon}</div>
      <div className="flex flex-col">
        <span className="text-sm text-gray-500">{label}</span>
        <span className={`text-xl font-semibold ${color}`}>R$ {value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
      </div>
    </div>
  );
}
