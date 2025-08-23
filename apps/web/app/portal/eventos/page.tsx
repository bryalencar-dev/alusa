"use client";
import { useEffect, useState } from 'react';
import { LoadingSkeleton, ErrorState, EmptyState } from '@alusa/ui';

interface EventoBase { nome?: string; dataInicio?: string }
interface InscricaoItem { id: string; evento?: EventoBase | null; ingressos?: { id: string }[] }

export default function EventosPage(){
  const [data, setData] = useState<InscricaoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetch('/api/portal/eventos');
        if(!res.ok) throw new Error('Falha ao carregar');
        const json = await res.json();
        if(active) setData(json);
      } catch (e) {
        if(active) setError('Erro ao carregar eventos');
      } finally {
        if(active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  return (
    <div>
      <h2 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Eventos / Inscrições</h2>
  {loading && <LoadingSkeleton variant="table" rows={3} className="mt-3" />}
  {error && <ErrorState message={error} onRetry={() => { setLoading(true); setError(null); setData([]); fetch('/api/portal/eventos').then(r=>{ if(!r.ok) throw new Error(); return r.json();}).then(j=> setData(j)).catch(()=> setError('Erro ao carregar eventos')).finally(()=> setLoading(false)); }} />}
  {!loading && data.length === 0 && !error && <EmptyState title="Sem inscrições" message="Você ainda não possui inscrições" />}
      <div style={{ marginTop: '0.75rem', display: 'grid', gap: '0.75rem' }}>
        {data.map(e => (
          <div key={e.id} style={{ border: '1px solid #e5e7eb', borderRadius: 6, padding: '0.75rem' }}>
            <div style={{ fontSize: '0.9rem', fontWeight: 500 }}>{e.evento?.nome}</div>
            <div style={{ fontSize: '0.7rem', marginTop: 4 }}>Data: {e.evento && new Date(e.evento.dataInicio!).toLocaleDateString()}</div>
            <div style={{ fontSize: '0.7rem', marginTop: 4 }}>Ingressos: {e.ingressos?.length}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
