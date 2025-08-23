"use client";
import { useEffect, useState } from 'react';
import { LoadingSkeleton, ErrorState, EmptyState } from '@alusa/ui';

interface PlanoResumo { nome?: string }
interface EventoResumo { nome?: string }
interface MatriculaResumo { plano?: PlanoResumo | null }
interface CobrancaItem { id: string; status: string; vencimento: string; matricula?: MatriculaResumo | null; evento?: EventoResumo | null }

export default function CobrancasPage(){
  const [data, setData] = useState<CobrancaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetch('/api/portal/cobrancas');
        if(!res.ok) throw new Error('Falha ao carregar');
        const json = await res.json();
        if(active) setData(json);
      } catch (e) {
        if(active) setError('Erro ao carregar cobranças');
      } finally {
        if(active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  return (
    <div>
      <h2 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Cobranças</h2>
  {loading && <LoadingSkeleton variant="table" rows={4} className="mt-3" />}
  {error && <ErrorState message={error} onRetry={() => { setLoading(true); setError(null); setData([]); fetch('/api/portal/cobrancas').then(r=>{ if(!r.ok) throw new Error(); return r.json();}).then(j=> setData(j)).catch(()=> setError('Erro ao carregar cobranças')).finally(()=> setLoading(false)); }} />}
  {!loading && data.length === 0 && !error && <EmptyState title="Sem cobranças" message="Nenhuma cobrança disponível" />}
      <div style={{ marginTop: '0.75rem', display: 'grid', gap: '0.75rem' }}>
        {data.map(c => (
          <div key={c.id} style={{ border: '1px solid #e5e7eb', borderRadius: 6, padding: '0.75rem' }}>
            <div style={{ fontSize: '0.9rem', fontWeight: 500 }}>{c.matricula?.plano?.nome || c.evento?.nome || 'Cobrança'}</div>
            <div style={{ fontSize: '0.7rem', marginTop: 4 }}>Vencimento: {new Date(c.vencimento).toLocaleDateString()}</div>
            <div style={{ fontSize: '0.7rem', marginTop: 4 }}>Status: {c.status}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
