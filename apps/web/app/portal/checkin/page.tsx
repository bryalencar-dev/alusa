'use client';
import React, { useState } from 'react';

async function doCheckin(qr: string){
  const res = await fetch('/api/portal/checkin', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ qr }) });
  return res.json();
}

export default function CheckinPage(){
  const [qr, setQr] = useState('');
  interface CheckinResult { status?: string; error?: string; ingresso?: { id?: string; usadoEm?: string } }
  const [result, setResult] = useState<CheckinResult | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if(!qr) return;
    setLoading(true);
    try {
      const data = await doCheckin(qr.trim());
      setResult(data);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Check-in de Ingresso</h2>
      <form onSubmit={submit} style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
  <input value={qr} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQr(e.target.value)} placeholder="QR code" style={{ flex: 1, padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: 4 }} />
        <button type="submit" disabled={!qr || loading} style={{ padding: '0.5rem 0.75rem', background: '#2563eb', color: 'white', borderRadius: 4, fontSize: '0.85rem' }}>{loading ? 'Validando...' : 'Validar'}</button>
      </form>
      {result && (
        <div style={{ marginTop: '1rem', fontSize: '0.8rem' }}>
          <pre style={{ background: '#f3f4f6', padding: '0.75rem', borderRadius: 4, overflowX: 'auto' }}>{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}
      <p style={{ fontSize: '0.65rem', marginTop: '1.25rem', color: '#6b7280' }}>Futuro: scanner de câmera (getUserMedia) para ler QR automaticamente.</p>
    </div>
  );
}
