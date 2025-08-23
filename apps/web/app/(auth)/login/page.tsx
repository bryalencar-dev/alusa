"use client";
export const dynamic = "force-dynamic";
import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function Page() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError(null);
    const res = await signIn('credentials', { redirect: false, email, password });
    setLoading(false);
    if (res?.error) { setError('Credenciais inválidas'); return; }
    router.push('/portal');
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <form onSubmit={submit} aria-label="Formulário de login" style={{ width: '100%', maxWidth: 360, background: '#fff', padding: '1.5rem', border: '1px solid #e5e7eb', borderRadius: 8 }}>
        <h1 style={{ fontSize: '1.1rem', margin: 0, marginBottom: '1rem' }}>Login</h1>
        <div style={{ marginBottom: '0.75rem' }}>
          <label htmlFor="email" style={{ display: 'block', fontSize: 12, fontWeight: 500, marginBottom: 4 }}>Email</label>
          <input id="email" name="email" type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="seu@email.com" style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: 4 }} />
        </div>
        <div style={{ marginBottom: '1rem' }}>
          <label htmlFor="password" style={{ display: 'block', fontSize: 12, fontWeight: 500, marginBottom: 4 }}>Senha</label>
          <input id="password" name="password" type="password" autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="••••••" style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: 4 }} />
        </div>
        {error && <div role="alert" style={{ color: '#b91c1c', fontSize: 12, marginBottom: '0.75rem' }}>{error}</div>}
        <button aria-label="Entrar no portal" disabled={loading} type="submit" style={{ width: '100%', padding: '0.6rem', background: '#2563eb', color: '#fff', borderRadius: 4, fontSize: 14, fontWeight: 500 }}>{loading ? 'Entrando...' : 'Entrar'}</button>
      </form>
    </div>
  );
}
