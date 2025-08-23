import { PrismaClient, CobrancaStatus } from '@prisma/client';

const prisma = new PrismaClient();

export interface Periodo { inicio: Date; fim: Date }

export function parsePeriodo(p: string): Periodo {
  const agora = new Date();
  if (p.endsWith('m')) {
    const meses = parseInt(p.slice(0, -1), 10) || 12;
    const fim = new Date(agora);
    const inicio = new Date(fim);
    inicio.setMonth(inicio.getMonth() - meses + 1, 1);
    inicio.setHours(0,0,0,0);
    return { inicio, fim };
  }
  // fallback ano corrente
  const inicio = new Date(agora.getFullYear(), 0, 1);
  return { inicio, fim: agora };
}

export async function receitaMensal(periodoStr: string) {
  const { inicio, fim } = parsePeriodo(periodoStr);
  const rows = await prisma.cobranca.findMany({
    where: { vencimento: { gte: inicio, lte: fim } },
    select: { valor: true, status: true, vencimento: true },
    take: 5000 // limite defensivo
  });
  interface Bucket { total: number; paga: number; pendente: number; cancelada: number }
  const map = new Map<string, Bucket>();
  for (const r of rows) {
    const d = new Date(r.vencimento);
    const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
    if (!map.has(key)) map.set(key, { total: 0, paga: 0, pendente: 0, cancelada: 0 });
    const b = map.get(key)!;
    b.total += Number(r.valor);
    if (r.status === CobrancaStatus.PAGA) b.paga += Number(r.valor);
    else if (r.status === CobrancaStatus.CANCELADA) b.cancelada += Number(r.valor);
    else b.pendente += Number(r.valor);
  }
  const meses = [...map.entries()].sort(([a],[b])=>a.localeCompare(b)).map(([mes, v])=>({ mes, ...v }));
  const totals = meses.reduce((acc, m)=>({
    total: acc.total + m.total,
    paga: acc.paga + m.paga,
    pendente: acc.pendente + m.pendente,
    cancelada: acc.cancelada + m.cancelada
  }), { total:0,paga:0,pendente:0,cancelada:0 });
  const fmt = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
  return { periodo: periodoStr, meses: meses.map(m=>({ ...m, totalFmt: fmt.format(m.total), pagaFmt: fmt.format(m.paga), pendenteFmt: fmt.format(m.pendente), canceladaFmt: fmt.format(m.cancelada) })), ...totals, totalFmt: fmt.format(totals.total), pagaFmt: fmt.format(totals.paga), pendenteFmt: fmt.format(totals.pendente), canceladaFmt: fmt.format(totals.cancelada) };
}

export async function inadimplencia(periodoStr: string) {
  const { inicio, fim } = parsePeriodo(periodoStr);
  const hoje = new Date();
  const rows = await prisma.cobranca.findMany({
    where: { vencimento: { gte: inicio, lte: fim } },
    select: { status: true, vencimento: true },
    take: 5000
  });
  let total = 0; let inad = 0;
  for (const r of rows) {
    total++;
    const vencida = r.status === CobrancaStatus.VENCIDA || (r.status === CobrancaStatus.PENDENTE && r.vencimento < hoje);
    if (vencida) inad++;
  }
  const taxa = total ? inad/total : 0;
  return { periodo: periodoStr, total, inad, taxa, taxaFmt: (taxa*100).toFixed(2)+'%' };
}

export async function receitaPorPlano(periodoStr: string) {
  const { inicio, fim } = parsePeriodo(periodoStr);
  const rows = await prisma.cobranca.findMany({
    where: { vencimento: { gte: inicio, lte: fim }, matriculaId: { not: null } },
    select: { valor: true, status: true, matricula: { select: { plano: { select: { id: true, nome: true } } } } },
    take: 5000
  });
  interface Agg { valor: number; paga: number; qtd: number }
  const agg = new Map<string, Agg>();
  for (const r of rows) {
    const key = r.matricula?.plano?.id || 'sem';
    if (!agg.has(key)) agg.set(key, { valor:0, paga:0, qtd:0 });
    const a = agg.get(key)!;
    a.valor += Number(r.valor);
    if (r.status === CobrancaStatus.PAGA) a.paga += Number(r.valor);
    a.qtd++;
  }
  const fmt = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
  return [...agg.entries()].map(([id, v]) => ({ planoId: id, valor: v.valor, valorFmt: fmt.format(v.valor), valorPago: v.paga, valorPagoFmt: fmt.format(v.paga), quantidade: v.qtd }));
}

export async function receitaPorTurma(periodoStr: string) {
  const { inicio, fim } = parsePeriodo(periodoStr);
  const rows = await prisma.cobranca.findMany({
    where: { vencimento: { gte: inicio, lte: fim }, matriculaId: { not: null } },
    select: { valor: true, status: true, matricula: { select: { turma: { select: { id: true, nome: true } }, comboId: true } } },
    take: 5000
  });
  interface Agg { valor: number; pago: number }
  const agg = new Map<string, Agg>();
  for (const r of rows) {
    const key = r.matricula?.turma?.id || 'sem';
    if (!agg.has(key)) agg.set(key, { valor:0, pago:0 });
    const a = agg.get(key)!;
    a.valor += Number(r.valor);
    if (r.status === CobrancaStatus.PAGA) a.pago += Number(r.valor);
  }
  const fmt = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
  return [...agg.entries()].map(([id,v])=>({ turmaId: id, valor: v.valor, valorFmt: fmt.format(v.valor), valorPago: v.pago, valorPagoFmt: fmt.format(v.pago) }));
}

export async function receitaPorEvento(periodoStr: string) {
  const { inicio, fim } = parsePeriodo(periodoStr);
  const rows = await prisma.cobranca.findMany({
    where: { vencimento: { gte: inicio, lte: fim }, eventoId: { not: null } },
    select: { valor: true, status: true, evento: { select: { id: true, nome: true } } },
    take: 5000
  });
  interface Agg { valor: number; pago: number }
  const agg = new Map<string, Agg>();
  for (const r of rows) {
    const key = r.evento?.id || 'sem';
    if (!agg.has(key)) agg.set(key, { valor:0, pago:0 });
    const a = agg.get(key)!;
    a.valor += Number(r.valor);
    if (r.status === CobrancaStatus.PAGA) a.pago += Number(r.valor);
  }
  const fmt = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
  return [...agg.entries()].map(([id,v])=>({ eventoId: id, valor: v.valor, valorFmt: fmt.format(v.valor), valorPago: v.pago, valorPagoFmt: fmt.format(v.pago) }));
}