// Página de registro agora com guard SSR via wrapper + client component interno.
// Mantemos o layout e estilos.
"use client";
// Campos: Nome, Sobrenome, CPF/CNPJ, Email, Senha, Confirmar Senha, Termos.
// Derivamos escolaNome = `${firstName} ${lastName}` no envio (compatibilidade backend) sem solicitar campo extra.

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { signIn } from 'next-auth/react';
import { Eye, EyeOff, Mail, IdCard } from 'lucide-react';
import { toast } from 'sonner';
import { CustomToast } from '../../../components/CustomToast';

export const REQUIRES_SCHOOL_DATA = true; // Mantido para testes/feature flag futuro.

// Política de senha (espelha servidor)
const strongPassword = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*]).{8,}$/;

function sanitizeDigits(v: string) { return v.replace(/\D/g, ''); }
function formatCpfCnpj(v: string) {
  const d = sanitizeDigits(v);
  if (d.length <= 11) {
    return d
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  }
  return d
    .replace(/(\d{2})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1/$2')
    .replace(/(\d{4})(\d{1,2})$/, '$1-$2');
}

const formSchema = z.object({
  firstName: z.string().min(2, 'Informe o nome'),
  lastName: z.string().min(2, 'Informe o sobrenome'),
  cpfCnpj: z.string().transform(v => formatCpfCnpj(v)).refine(v => {
    const d = sanitizeDigits(v);
    if (!(d.length === 11 || d.length === 14)) return false;
    if (/^(\d)\1+$/.test(d)) return false;
    return true;
  }, 'CPF/CNPJ inválido'),
  email: z.string().email('E-mail inválido'),
  senha: z.string().regex(strongPassword, 'Senha fraca'),
  confirmarSenha: z.string(),
  termos: z.literal(true, { errorMap: () => ({ message: 'Você deve aceitar os termos' }) })
}).refine(data => data.senha === data.confirmarSenha, {
  path: ['confirmarSenha'],
  message: 'Senhas não coincidem'
});

type FormValues = z.infer<typeof formSchema>;

export default function RegisterPage() {
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const { register, handleSubmit, formState: { errors, isSubmitting }, watch, setValue } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    mode: 'onSubmit'
  });

  // Ajusta máscara de CPF/CNPJ enquanto digita mantendo caret no final (simples: substitui valor inteiro)
  function handleCpfCnpjChange(e: React.ChangeEvent<HTMLInputElement>) {
    const masked = formatCpfCnpj(e.target.value);
    setValue('cpfCnpj', masked, { shouldValidate: true });
  }

  async function onSubmit(data: FormValues) {
    setGlobalError(null);
    const escolaNome = `${data.firstName} ${data.lastName}`.trim();
    try {
      const res = await fetch('/api/first-register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: `${data.firstName} ${data.lastName}`.trim(),
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          senha: data.senha,
          cpfCnpj: sanitizeDigits(data.cpfCnpj),
          escolaNome
        })
      });
      if (!res.ok) {
        const payload = (await res.json().catch(() => ({}))) as Partial<{ error: string }>;
        const desc = payload.error ?? 'Falha ao criar conta.';
        setGlobalError(desc);
        toast.custom((t: string) => (
          <CustomToast
            variant="error"
            title="Erro ao criar conta"
            description="Tente novamente mais tarde."
            onClose={() => { toast.dismiss(t); }}
          />
        ));
        return;
      }
      // Auto login após criação
      const login = await signIn('credentials', {
        redirect: false,
        email: data.email,
        password: data.senha
      });
      if (login?.error) {
        const desc = 'Conta criada, mas não foi possível autenticar.';
        setGlobalError(desc);
        toast.custom((t: string) => (
          <CustomToast
            variant="warning"
            title="Falha na autenticação"
            description="Faça login manualmente."
            onClose={() => { toast.dismiss(t); }}
          />
        ));
        return;
      }
      // Toast de sucesso (conta criada + login feito)
      toast.custom((t: string) => (
        <CustomToast
          variant="success"
          title="Conta criada"
          description="Redirecionando para o painel..."
          onClose={() => { toast.dismiss(t); }}
        />
      ), { duration: 3000 });
      setTimeout(() => { window.location.href = '/admin/dashboard'; }, 450);
    } catch {
      setGlobalError('Erro inesperado. Tente novamente.');
      toast.custom((t: string) => (
        <CustomToast
          variant="error"
          title="Erro inesperado"
          description="Tente novamente."
          onClose={() => { toast.dismiss(t); }}
        />
      ));
    }
  }

  function onError() {
    // Prioridade de exibição (primeiro erro encontrado na sequência lógica do formulário)
    const order: Array<keyof FormValues> = [
      'firstName','lastName','cpfCnpj','email','senha','confirmarSenha','termos'
    ];
    for (const key of order) {
      const err = errors[key];
      if (!err) continue;
  const base = (err.message as string) || 'Campo inválido';
      let title = 'Campo inválido';
      let desc = 'Revise o valor informado.';
      switch (key) {
        case 'firstName': title='Nome inválido'; desc='Informe um nome válido (mín. 2 letras).'; break;
        case 'lastName': title='Sobrenome inválido'; desc='Informe um sobrenome válido.'; break;
        case 'cpfCnpj': title='CPF/CNPJ inválido'; desc='Digite um CPF ou CNPJ válido.'; break;
        case 'email': title='E-mail inválido'; desc='Preencha corretamente seu e-mail.'; break;
        case 'senha': title='Senha fraca'; desc='Use 8+ caracteres, maiúscula, minúscula, número e símbolo.'; break;
        case 'confirmarSenha': title='Senhas não coincidem'; desc='Garanta que as duas senhas são iguais.'; break;
        case 'termos': title='Termos necessários'; desc='Aceite os termos para continuar.'; break;
      }
      // Em alguns casos a regex original pode dar outra mensagem; preservamos se for mais específica
      if (base && base !== 'Campo inválido') {
        // mantemos a descrição preparada e usamos base como título se fizer sentido
        if (key === 'senha' && base !== 'Senha fraca') { desc = base; }
      }
      toast.custom((t: string) => (
        <CustomToast
          variant="error"
          title={title}
          description={desc}
          onClose={() => { toast.dismiss(t); }}
        />
      ));
      break; // Apenas primeiro erro
    }
  }

  return (
    <div className="mx-auto w-[480px] max-w-[92vw] rounded-[40px] bg-white px-12 py-10 shadow-[0_6px_24px_rgba(0,0,0,0.12)] flex flex-col items-center" data-layer="form register">
      {/* Logo removida conforme solicitação */}
      <header className="text-center mb-8 space-y-2">
        <h1 className="text-[30px] font-semibold leading-tight tracking-tight">Abra sua conta</h1>
        <p className="text-[12px] font-medium text-brand-muted">Preencha os dados abaixo para começar.</p>
        {/* Erro global visível apenas se necessário */}
        {globalError && <p data-testid="register-error" className="text-[12px] text-red-600" role="alert">{globalError}</p>}
      </header>
      <form onSubmit={(e) => { void handleSubmit(onSubmit, onError)(e); }} className="w-full max-w-[360px] flex flex-col gap-5" data-testid="register-form" noValidate>
        {/* Linha nome / sobrenome */}
        <div className="flex gap-4">
          <div className="flex-1">
            <div className="relative h-12">
              <input
                type="text"
                placeholder="Nome"
                data-testid="register-nome-first"
                aria-invalid={!!errors.firstName || undefined}
                className="w-full h-12 rounded-[30px] border border-brand-stroke bg-white px-5 text-[14px] font-medium placeholder:text-brand-muted outline-none"
                {...register('firstName')}
              />
            </div>
            {/* feedback inline removido: via toast */}
          </div>
          <div className="flex-1">
            <div className="relative h-12">
              <input
                type="text"
                placeholder="Sobrenome"
                data-testid="register-nome-last"
                aria-invalid={!!errors.lastName || undefined}
                className="w-full h-12 rounded-[30px] border border-brand-stroke bg-white px-5 text-[14px] font-medium placeholder:text-brand-muted outline-none"
                {...register('lastName')}
              />
            </div>
            {/* feedback inline removido */}
          </div>
        </div>

        {/* CPF/CNPJ */}
        <div>
          <div className="relative h-12">
            <input
              type="text"
              placeholder="CPF ou CNPJ"
              data-testid="register-cpfCnpj"
              aria-invalid={!!errors.cpfCnpj || undefined}
              className="w-full h-12 rounded-[30px] border border-brand-stroke bg-white pl-5 pr-11 text-[14px] font-medium placeholder:text-brand-muted outline-none"
              {...register('cpfCnpj')}
              onChange={handleCpfCnpjChange}
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-brand-muted" aria-hidden><IdCard className="h-4 w-4" /></span>
          </div>
          {/* feedback inline removido */}
        </div>

        {/* Email */}
        <div>
          <div className="relative h-12">
            <input
              type="email"
              placeholder="Email"
              data-testid="register-email"
              autoComplete="email"
              aria-invalid={!!errors.email || undefined}
              className="w-full h-12 rounded-[30px] border border-brand-stroke bg-white pl-5 pr-11 text-[14px] font-medium placeholder:text-brand-muted outline-none"
              {...register('email')}
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-brand-muted" aria-hidden><Mail className="h-4 w-4" /></span>
          </div>
          {/* feedback inline removido */}
        </div>

        {/* Senha */}
        <div>
          <div className="relative h-12">
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Senha"
              data-testid="register-senha"
              autoComplete="new-password"
              aria-invalid={!!errors.senha || undefined}
              className="w-full h-12 rounded-[30px] border border-brand-stroke bg-white pl-5 pr-11 text-[14px] font-medium placeholder:text-brand-muted outline-none"
              {...register('senha')}
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
          {/* feedback inline removido */}
        </div>

        {/* Confirmar Senha */}
        <div>
          <div className="relative h-12">
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              placeholder="Confirmar senha"
              data-testid="register-senha-confirmar"
              autoComplete="new-password"
              aria-invalid={!!errors.confirmarSenha || undefined}
              className="w-full h-12 rounded-[30px] border border-brand-stroke bg-white pl-5 pr-11 text-[14px] font-medium placeholder:text-brand-muted outline-none"
              {...register('confirmarSenha')}
            />
            <button
              type="button"
              onClick={() => { setShowConfirmPassword(s => !s); }}
              aria-label={showConfirmPassword ? 'Ocultar senha' : 'Mostrar senha'}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-muted p-1 rounded outline-none"
            >
              {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {/* feedback inline removido */}
        </div>

        {/* Termos */}
        <div className="pt-1">
          <label className="flex items-center gap-2 text-[12px] font-medium cursor-pointer select-none leading-relaxed">
            <input
              type="checkbox"
              className="h-4 w-4 rounded-[5px] border border-brand-accent accent-brand-accent outline-none"
              {...register('termos')}
            />
            <span className="text-[#686868]">Aceito os <a className="text-brand-accent hover:underline" href="/termos" target="_blank" rel="noopener noreferrer">Termos de Uso</a> e a <a className="text-brand-accent hover:underline" href="/privacidade" target="_blank" rel="noopener noreferrer">Política de Privacidade</a></span>
          </label>
          {/* feedback inline removido */}
        </div>

        {/* Botão */}
        <button
          type="submit"
          data-testid="register-submit"
          disabled={isSubmitting}
          className="mt-1 h-12 rounded-[30px] bg-[#3C0269] hover:bg-[#4b0a7d] text-white text-[14px] font-medium flex items-center justify-center transition-colors outline-none disabled:opacity-60"
        >
          {isSubmitting ? 'Criando...' : 'Criar conta'}
        </button>

        {/* Hidden compat (nome completo) */}
        <input type="hidden" data-testid="register-nome" value={`${watch('firstName') || ''} ${watch('lastName') || ''}`.trim()} readOnly />

        {/* Rodapé */}
        <p className="text-center text-[11px] font-medium mt-2">
          <span className="text-[#686868]">Já tenho uma conta! </span>
          <a href="/auth/login" className="text-brand-accent hover:underline">Fazer login</a>
        </p>
      </form>
    </div>
  );
}
