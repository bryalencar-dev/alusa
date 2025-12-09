// Página de registro: componente client isolado para permitir wrapper SSR em page.tsx
"use client";
import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { signIn } from 'next-auth/react';
import { Eye, EyeOff, Mail, IdCard } from '@/components/icons/icons';
import { toast } from 'sonner';
import { CustomToast } from '../../../components/CustomToast';
import { debugLog, isAuthDebug } from '@/lib/debug-logger';

export const REQUIRES_SCHOOL_DATA = true;

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

// Schema condicional por modo
const baseSchema = z.object({
  firstName: z.string().min(2, 'Informe o nome'),
  lastName: z.string().min(2, 'Informe o sobrenome'),
  email: z.string().email('E-mail inválido'),
  senha: z.string().regex(strongPassword, 'Senha fraca'),
  confirmarSenha: z.string(),
  termos: z.literal(true, { errorMap: () => ({ message: 'Você deve aceitar os termos' }) }),
});

function schemaFor(mode: 'first'|'direct'|'invite') {
  const cpfCnpjValidator = (v: string): boolean => {
    const d = sanitizeDigits(v);
    if (d.length === 0) return true; // permite vazio quando opcional
    if (!(d.length === 11 || d.length === 14)) return false;
    if (/^(\d)\1+$/.test(d)) return false;
    return true;
  };

  const cpfCnpjOptional = z
    .string()
    .transform(v => formatCpfCnpj(v))
    .refine(cpfCnpjValidator, 'CPF/CNPJ inválido')
    .optional()
    .default('');

  const cpfCnpjRequired = z
    .string()
    .transform(v => formatCpfCnpj(v))
    .refine(v => sanitizeDigits(v).length > 0 && cpfCnpjValidator(v), 'CPF/CNPJ inválido');

  const withCpf = mode === 'first'
    ? baseSchema.extend({ cpfCnpj: cpfCnpjRequired })
    : baseSchema.extend({ cpfCnpj: cpfCnpjOptional });

  return withCpf.refine((data) => data.senha === data.confirmarSenha, {
    path: ['confirmarSenha'],
    message: 'Senhas não coincidem'
  });
}

// Tipos do formulário (superset para todos os modos)
type FormValues = {
  firstName: string;
  lastName: string;
  email: string;
  senha: string;
  confirmarSenha: string;
  termos: true;
  cpfCnpj?: string;
};

interface InviteData {
  email?: string; // Opcional para RESPONSAVEL
  role: string;
  token: string;
  alunos?: Array<{
    id: string;
    nome: string;
    email: string | null;
    idade: number | null;
  }>;
}

type RegisterMode = 'first' | 'invite';

interface RegisterFormProps {
  inviteData?: InviteData;
}

export default function RegisterForm({ inviteData }: RegisterFormProps) {
  const mode: RegisterMode = inviteData ? 'invite' : 'first';
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const schema = useMemo(() => schemaFor(mode), [mode]);
  const { register, handleSubmit, formState: { errors, isSubmitting }, watch, setValue } = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: 'onSubmit',
    defaultValues: {
      email: inviteData?.email || ''
    }
  });

  function handleCpfCnpjChange(e: React.ChangeEvent<HTMLInputElement>) {
    const masked = formatCpfCnpj(e.target.value);
    setValue('cpfCnpj', masked, { shouldValidate: true });
  }

  async function onSubmit(data: FormValues) {
    setGlobalError(null);
    const escolaNome = `${data.firstName} ${data.lastName}`.trim();
    
    try {
      if (isAuthDebug) debugLog('register', 'submit', { mode, email: data.email });
      let endpoint = '/api/users/first-register';
      let payload: Record<string, unknown> = {
        nome: `${data.firstName} ${data.lastName}`.trim(),
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        senha: data.senha,
        cpfCnpj: sanitizeDigits(data.cpfCnpj ?? ''),
        escolaNome
      };

      // Ajuste por modo
      if (mode === 'invite' && inviteData) {
        endpoint = '/api/users/accept';
        payload = {
          token: inviteData.token,
          name: `${data.firstName} ${data.lastName}`.trim(),
          email: data.email, // Envia o email (pode ser do convite ou digitado pelo usuário)
          password: data.senha,
        };
      }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (isAuthDebug) debugLog('register', 'response', { status: res.status });
      
      if (!res.ok) {
        const responsePayload = (await res.json().catch(() => ({}))) as Partial<{ error: string }>;
        const isConflict = res.status === 409;
        const descText = responsePayload.error ?? (isConflict ? 'E-mail já cadastrado.' : 'Falha ao criar conta.');
        setGlobalError(descText);
        if (isAuthDebug) debugLog('register', 'error', { status: res.status, error: responsePayload.error });
        const descNode = isConflict ? (
          <span>
            Este e-mail já está em uso.{" "}
            <a href="/auth/login" className="underline">Fazer login</a>{" "}ou{" "}
            <a href="/auth/forgot-password" className="underline">recuperar senha</a>.
          </span>
        ) : (descText);
        toast.custom((t: string) => (
          <CustomToast
            variant="error"
            title={isConflict ? 'E-mail já cadastrado' : 'Erro ao criar conta'}
            description={descNode}
            onClose={() => { toast.dismiss(t); }}
          />
        ));
        return;
      }
      
      const login = await signIn('credentials', { redirect: false, email: data.email, password: data.senha });
      if (isAuthDebug) debugLog('register', 'auto-login response', login);
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
      
      toast.custom((t: string) => (
        <CustomToast
          variant="success"
          title="Conta criada"
          description="Redirecionando para o painel..."
          onClose={() => { toast.dismiss(t); }}
        />
      ), { duration: 3000 });
      if (isAuthDebug) debugLog('register', 'success', { email: data.email });
      setTimeout(() => { window.location.href = '/dashboard'; }, 450);
    } catch {
      setGlobalError('Erro inesperado. Tente novamente.');
      if (isAuthDebug) debugLog('register', 'unexpected');
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
    const order: Array<keyof FormValues> = [ 'firstName','lastName','cpfCnpj','email','senha','confirmarSenha','termos' ];
    for (const key of order) {
      const err = errors[key];
      if (!err) continue;
      const base = (err.message as string) || 'Campo inválido';
      if (isAuthDebug) debugLog('register', 'validation-error', { field: key, message: base });
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
      if (base && base !== 'Campo inválido') {
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
      break;
    }
  }

  return (
    <div data-layer="form register">
      <header className="text-center mb-8 space-y-2">
        <h1 className="text-[30px] font-semibold leading-tight tracking-tight">
          {mode === 'invite' ? 'Aceitar Convite' : 'Abra sua conta'}
        </h1>
        <p className="text-[12px] font-medium text-brand-muted">
          {mode === 'invite' && inviteData
            ? `Você foi convidado como ${inviteData.role} para acessar o sistema.`
            : 'Informe seu e-mail e defina uma senha para\ncomeçar a abertura da sua conta na alusa.'
          }
        </p>
        {/* No modo convite, o e-mail é editável no campo abaixo (pré-preenchido pelo convite) */}
        {/* Erro global visível apenas se necessário */}
        {globalError && <p data-testid="register-error" className="text-[12px] text-red-600" role="alert">{globalError}</p>}
      </header>
      <form onSubmit={(e) => { void handleSubmit(onSubmit, onError)(e); }} className="w-full max-w-[360px] mx-auto flex flex-col gap-5" data-testid="register-form" noValidate>
        <div className="flex gap-4">
          <div className="flex-1">
            <div className="relative h-12">
              <input type="text" placeholder="Nome" data-testid="register-nome-first" aria-invalid={undefined} className="w-full h-12 rounded-[30px] border border-gray-300 bg-white px-5 text-[14px] font-medium text-gray-900 placeholder:text-gray-400 outline-none focus:border-gray-300 focus:ring-0" {...register('firstName')} />
            </div>
          </div>
          <div className="flex-1">
            <div className="relative h-12">
              <input type="text" placeholder="Sobrenome" data-testid="register-nome-last" aria-invalid={undefined} className="w-full h-12 rounded-[30px] border border-gray-300 bg-white px-5 text-[14px] font-medium text-gray-900 placeholder:text-gray-400 outline-none focus:border-gray-300 focus:ring-0" {...register('lastName')} />
            </div>
          </div>
        </div>
        <div>
          <div className="relative h-12">
            <input type="text" placeholder="CPF ou CNPJ" data-testid="register-cpfCnpj" aria-invalid={undefined} className="w-full h-12 rounded-[30px] border border-gray-300 bg-white pl-5 pr-11 text-[14px] font-medium text-gray-900 placeholder:text-gray-400 outline-none focus:border-gray-300 focus:ring-0" {...register('cpfCnpj')} onChange={handleCpfCnpjChange} />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-brand-muted" aria-hidden><IdCard className="h-4 w-4" /></span>
          </div>
        </div>
        {/* Alunos vinculados (quando for RESPONSAVEL) */}
        {mode === 'invite' && inviteData?.alunos && inviteData.alunos.length > 0 && (
          <div className="p-4 bg-violet-50 rounded-lg border border-violet-200">
            <h2 className="text-sm font-semibold text-violet-900 mb-3">
              Você será responsável por {inviteData.alunos.length === 1 ? 'este aluno' : 'estes alunos'}:
            </h2>
            <div className="space-y-2">
              {inviteData.alunos.map((aluno) => (
                <div key={aluno.id} className="flex items-center gap-3 bg-white p-3 rounded-md">
                  <div className="w-10 h-10 rounded-full bg-violet-100 flex items-center justify-center text-violet-700 font-semibold text-sm">
                    {aluno.nome.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 text-sm">{aluno.nome}</p>
                    {aluno.email && (
                      <p className="text-xs text-gray-500">{aluno.email}</p>
                    )}
                    {aluno.idade && (
                      <p className="text-xs text-gray-500">{aluno.idade} anos</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        <div>
          <div className="relative h-12">
            <input
              type="email"
              placeholder="Email"
              data-testid="register-email"
              autoComplete="email"
              aria-invalid={undefined}
              className="w-full h-12 rounded-[30px] border border-gray-300 bg-white pl-5 pr-11 text-[14px] font-medium text-gray-900 placeholder:text-gray-400 outline-none focus:border-gray-300 focus:ring-0 disabled:bg-gray-100"
              {...register('email')}
              readOnly={mode === 'invite' && !!inviteData?.email}
              disabled={mode === 'invite' && !!inviteData?.email}
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-brand-muted" aria-hidden><Mail className="h-4 w-4" /></span>
          </div>
        </div>
        <div>
          <div className="relative h-12">
            <input type={showPassword ? 'text' : 'password'} placeholder="Senha" data-testid="register-senha" autoComplete="new-password" aria-invalid={undefined} className="w-full h-12 rounded-[30px] border border-gray-300 bg-white pl-5 pr-11 text-[14px] font-medium text-gray-900 placeholder:text-gray-400 outline-none focus:border-gray-300 focus:ring-0" {...register('senha')} />
            <button type="button" onClick={() => { setShowPassword(s => !s); }} aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'} className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-muted p-1 rounded outline-none">{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>
          </div>
        </div>
        <div>
          <div className="relative h-12">
            <input type={showConfirmPassword ? 'text' : 'password'} placeholder="Confirmar senha" data-testid="register-senha-confirmar" autoComplete="new-password" aria-invalid={undefined} className="w-full h-12 rounded-[30px] border border-gray-300 bg-white pl-5 pr-11 text-[14px] font-medium text-gray-900 placeholder:text-gray-400 outline-none focus:border-gray-300 focus:ring-0" {...register('confirmarSenha')} />
            <button type="button" onClick={() => { setShowConfirmPassword(s => !s); }} aria-label={showConfirmPassword ? 'Ocultar senha' : 'Mostrar senha'} className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-muted p-1 rounded outline-none">{showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>
          </div>
        </div>
        <div className="pt-1">
          <label className="flex items-center gap-2 text-[12px] font-medium cursor-pointer select-none leading-relaxed">
            <input type="checkbox" className="h-4 w-4 rounded-[5px] border border-brand-accent accent-brand-accent outline-none" {...register('termos')} />
            <span className="text-[#686868]">Aceito os <a className="text-brand-accent hover:underline" href="/termos" target="_blank" rel="noopener noreferrer">Termos de Uso</a> e a <a className="text-brand-accent hover:underline" href="/privacidade" target="_blank" rel="noopener noreferrer">Política de Privacidade</a></span>
          </label>
        </div>
        <button type="submit" data-testid="register-submit" disabled={isSubmitting} className="mt-1 h-12 rounded-[30px] bg-[#3C0269] hover:bg-[#4b0a7d] text-white text-[14px] font-medium flex items-center justify-center transition-colors outline-none disabled:opacity-60">
          {isSubmitting ? (
            mode === 'invite' ? 'Aceitando convite...' : 'Criando conta...'
          ) : (
            mode === 'invite' ? 'Aceitar Convite' : 'Criar conta'
          )}
        </button>
        <input type="hidden" data-testid="register-nome" value={`${watch('firstName') || ''} ${watch('lastName') || ''}`.trim()} readOnly />
        <input type="hidden" data-testid="register-escolaNome" value={`${watch('firstName') || ''} ${watch('lastName') || ''}`.trim()} readOnly />
        <p className="text-center text-[11px] font-medium mt-2">
          <span className="text-[#686868]">{mode === 'invite' ? 'Não recebeu este convite? ' : 'Já tenho uma conta! '}</span>
          <a href="/auth/login" className="text-brand-accent hover:underline">
            {mode === 'invite' ? 'Contatar administrador' : 'Fazer login'}
          </a>
        </p>
      </form>
    </div>
  );
}
