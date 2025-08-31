"use client";
import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { useForm } from 'react-hook-form';
import type { FieldErrors } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { User, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { CustomToast } from '@/components/CustomToast';
import { debugLog, isAuthDebug } from '@/lib/debug-logger';
import { nextParamToRedirect } from '@/lib/safe-redirect';

const schema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'Informe a senha')
});
type FormData = z.infer<typeof schema>;

export default function LoginClient() {
  const sp = useSearchParams();
  const callbackUrl = nextParamToRedirect(sp.get('next')) || '/admin/dashboard';
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const { register, handleSubmit, formState: { errors, isSubmitting }, setValue } = useForm<FormData>({ resolver: zodResolver(schema), mode: 'onSubmit' });

  useEffect(() => {
    try {
      const flag = localStorage.getItem('alusa.remember');
      const savedEmail = localStorage.getItem('alusa.remember.email');
      if (flag === '1' && savedEmail) {
        setRemember(true);
        setValue('email', savedEmail);
      }
    } catch { /* ignore */ }
  }, [setValue]);

  const onSubmit = (data: FormData) => {
    void (async () => {
      if (isAuthDebug) debugLog('login', 'attempt', { email: data.email });
      const res = await signIn('credentials', { email: data.email, password: data.password, redirect: false, callbackUrl });
      if (isAuthDebug) debugLog('login', 'signIn response', res);
      if (res?.error) {
        toast.custom((t) => (
          <CustomToast
            title="Credenciais inválidas"
            description="Verifique e-mail e senha e tente novamente."
            variant="error"
            onClose={() => { toast.dismiss(t); }}
          />
        ));
        return;
      }
      try {
        if (remember) {
          localStorage.setItem('alusa.remember', '1');
          localStorage.setItem('alusa.remember.email', data.email);
        } else {
          localStorage.removeItem('alusa.remember');
          localStorage.removeItem('alusa.remember.email');
        }
      } catch { /* ignore storage */ }
      toast.custom((t) => (
        <CustomToast
          variant="success"
          title="Login efetuado"
          description="Redirecionando..."
          onClose={() => { toast.dismiss(t); }}
        />
      ), { duration: 1400 });
      // Sem timeout longo; pequeno micro delay p/ flush do Set-Cookie
      setTimeout(() => {
  const target = (res?.url && res.url !== '/auth/login') ? res.url : callbackUrl;
        if (isAuthDebug) debugLog('login', 'redirecting(full-reload)', { target });
        window.location.replace(target);
      }, 80);
    })();
  };

  const onError = (formErrors: FieldErrors<FormData>) => {
    if (formErrors.email) {
      toast.custom((t: string) => (
        <CustomToast
          title="E-mail inválido"
          description="Preencha corretamente seu e-mail."
          variant="error"
          onClose={() => { toast.dismiss(t); }}
        />
      ));
      return;
    }
    if (formErrors.password) {
      toast.custom((t: string) => (
        <CustomToast
          title="Senha inválida"
          description="Digite sua senha corretamente."
          variant="error"
          onClose={() => { toast.dismiss(t); }}
        />
      ));
    }
  };

  return (
    <div className="login-card mx-auto w-[420px] max-w-[92vw] rounded-[40px] bg-white p-10 shadow-[0_6px_24px_rgba(0,0,0,0.12)] flex flex-col items-center" data-layer="form login">
      <img
        src="/brand/logo.svg"
        alt="Alusa"
        width={158}
        className="select-none mb-0 h-auto"
        draggable={false}
      />
      <p className="mt-4 text-[12px] font-medium text-brand-muted text-center">
        Bem-vindo de volta! Faça login para continuar.
      </p>
      <form
        onSubmit={(e) => { void handleSubmit(onSubmit, onError)(e); }}
        data-testid="login-form"
        className="mt-6 flex flex-col gap-4 w-full items-center"
        noValidate
      >
        <div className="relative w-[320px] h-12">
          <input
            type="email"
            data-testid="email"
            placeholder="Digite seu E-mail"
            autoComplete="email"
            aria-invalid={!!errors.email || undefined}
            className="w-full h-12 rounded-[30px] border-[1.5px] border-brand-stroke pl-5 pr-11 text-[14px] font-medium placeholder:text-brand-muted outline-none"
            {...register('email')}
          />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-brand-muted" aria-hidden>
            <User className="h-4 w-4" />
          </span>
        </div>
        <div className="relative w-[320px] h-12">
          <input
            type={showPassword ? 'text' : 'password'}
            data-testid="password"
            placeholder="Digite sua senha"
            autoComplete="current-password"
            aria-invalid={!!errors.password || undefined}
            className="w-full h-12 rounded-[30px] border-[1.5px] border-brand-stroke pl-5 pr-11 text-[14px] font-medium placeholder:text-brand-muted outline-none"
            {...register('password')}
          />
          <button
            type="button"
            onClick={() => { setShowPassword(s => !s); }}
            aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-muted p-1 rounded outline-none"
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        <div className="flex w-[320px] justify-between text-[12px] font-medium">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e)=> { setRemember(e.target.checked); }}
              className="h-4 w-4 rounded-[5px] border border-brand-accent accent-brand-accent outline-none"
            />
            <span className="text-[#686868]">Lembrar-me</span>
          </label>
          <a href="/auth/forgot-password" className="text-[12px] text-brand-accent hover:underline outline-none rounded">
            Esqueceu sua senha?
          </a>
        </div>
        <div className="w-[320px] mt-2">
          <button
            type="submit"
            data-testid="login-button"
            disabled={isSubmitting}
            className="w-full h-12 rounded-[30px] bg-[#3C0269] hover:bg-[#4b0a7d] text-white text-[14px] font-medium flex items-center justify-center transition-colors outline-none disabled:opacity-60"
          >
            Fazer login
          </button>
        </div>
        <p className="text-center text-[11px] font-medium w-[320px] mt-4">
          <span className="text-[#686868]">Não tem uma conta? </span>
          <a
            href="/auth/register"
            className="text-brand-accent hover:underline outline-none rounded"
          >
            Cadastre-se
          </a>
        </p>
      </form>
    </div>
  );
}