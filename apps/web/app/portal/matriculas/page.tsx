"use client";
import { useEffect, useState } from 'react';
import { LoadingSkeleton, ErrorState, EmptyState } from '@alusa/ui';

interface PlanoResumo { id: string; nome: string }
interface TurmaResumo { id: string; nome: string | null }
interface MatriculaItem { id: string; status: string; plano?: PlanoResumo | null; turma?: TurmaResumo | null }

export default function MatriculasPage(){
  const [data, setData] = useState<MatriculaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetch('/api/portal/matriculas');
        if(!res.ok) throw new Error('Falha ao carregar');
        const json = await res.json();
        if(active) setData(json);
      } catch (e) {
        if(active) setError('Erro ao carregar matrículas');
      } finally {
        if(active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  return (
    <div>
      <h2 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Minhas Matrículas</h2>
  {loading && <LoadingSkeleton variant="table" rows={3} className="mt-3" />}
  {error && <ErrorState message={error} onRetry={() => { setLoading(true); setError(null); setData([]); fetch('/api/portal/matriculas').then(r=>{ if(!r.ok) throw new Error(); return r.json();}).then(j=> setData(j)).catch(()=> setError('Erro ao carregar matrículas')).finally(()=> setLoading(false)); }} />}
  {!loading && data.length === 0 && !error && <EmptyState title="Sem matrículas" message="Nenhuma matrícula encontrada" />}
      <div style={{ marginTop: '0.75rem', display: 'grid', gap: '0.75rem' }}>
        {data.map(m => (
          <div key={m.id} style={{ border: '1px solid #e5e7eb', borderRadius: 6, padding: '0.75rem' }}>
            <div style={{ fontSize: '0.9rem', fontWeight: 500 }}>{m.turma?.nome || 'Sem turma'}</div>
            <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>{m.plano?.nome}</div>
            <div style={{ fontSize: '0.7rem', marginTop: 4 }}>Status: {m.status}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
