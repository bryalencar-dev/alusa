"use client";

import React, { useState } from 'react';
import { Mail } from 'lucide-react';
import { toast } from 'sonner';
import { CustomToast } from '@/components/CustomToast';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    try {
      const res = await fetch('/api/auth/forgot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      if (res.status === 501) {
        async function safeParse(r: Response): Promise<{ error?: string }> {
          try {
            const j: unknown = await r.json();
            if (typeof j === 'object' && j !== null) {
              const rec = j as Record<string, unknown>;
              if (typeof rec.error === 'string') return { error: rec.error };
            }
            return {};
          } catch { return { error: 'Recuperação indisponível.' }; }
        }
        const body = await safeParse(res);
        toast.custom((t) => (
          <CustomToast
            variant="error"
            title="Erro"
            description={body.error || 'Recuperação de senha indisponível.'}
            onClose={() => { toast.dismiss(t); }}
          />
        ));
      } else if (res.ok) {
        toast.custom((t) => (
          <CustomToast
            variant="info"
            title="Verifique seu e-mail"
            description="Se existir cadastro, enviamos um link de redefinição."
            onClose={() => { toast.dismiss(t); }}
          />
        ));
      } else {
        toast.custom((t) => (
          <CustomToast
            variant="error"
            title="Erro"
            description="Não foi possível enviar. Tente mais tarde."
            onClose={() => { toast.dismiss(t); }}
          />
        ));
      }
    } catch {
      toast.custom((t) => (
        <CustomToast
          variant="error"
          title="Erro de rede"
            description="Tente novamente."
          onClose={() => { toast.dismiss(t); }}
        />
      ));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto w-[420px] max-w-[92vw] rounded-[40px] bg-white p-10 shadow-[0_6px_24px_rgba(0,0,0,0.12)] flex flex-col items-center" data-layer="form forgot-password">
      <h1 className="text-2xl font-bold text-center">Recuperar senha</h1>
      <p className="text-sm text-[#686868] text-center mt-2 max-w-[320px]">Informe o e-mail cadastrado. Enviaremos um link para redefinir sua senha.</p>
      <form onSubmit={(e)=>{ void onSubmit(e); }} className="mt-6 flex flex-col gap-5 items-center w-full" noValidate>
        <div className="relative mx-auto w-[320px] h-12">
          <label htmlFor="email" className="sr-only">E-mail</label>
          <input
            id="email"
            type="email"
            placeholder="Digite seu E-mail"
            autoComplete="email"
            required
            value={email}
            onChange={(e)=>{ setEmail(e.target.value); }}
            className="h-12 w-full rounded-[30px] border border-[#E2E2E8] pl-5 pr-11 text-sm placeholder:text-[#828282] outline-none focus:outline-none"
            aria-invalid={email.length>0 && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) ? 'true' : undefined}
          />
          <Mail className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#828282]" aria-hidden />
        </div>
        <button
          type="submit"
          disabled={loading || email.trim().length===0}
          className="w-[320px] h-12 rounded-[30px] bg-[#19143A] text-white font-medium hover:opacity-95 disabled:opacity-50 transition-colors"
        >
          {loading ? 'Enviando...' : 'Enviar link'}
        </button>
        <p className="text-center text-[11px] font-medium w-[320px] mt-1">
          <span className="text-[#686868]">Tenho uma conta? </span>
          <a href="/auth/login" className="text-[#4F2298] hover:underline">Fazer login</a>
        </p>
      </form>
    </div>
  );
}
