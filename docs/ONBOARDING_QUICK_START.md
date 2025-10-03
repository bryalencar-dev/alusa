# 🚀 Quick Start - Onboarding ALUSA

> **Objetivo:** Colocar você produtivo no projeto em 15 minutos.

---

## ⏱️ Em 5 minutos: O Essencial

### 1. Arquitetura em 3 pontos

1. **Páginas são wrappers minimalistas** (< 15 linhas)

   ```tsx
   // app/(app)/alunos/page.tsx
   export default function AlunosPage() {
     return <AlunosFeature />;
   }
   ```

2. **Lógica fica em Features** (components com lógica completa)

   ```tsx
   // features/cadastro/alunos/AlunosFeature.tsx
   export default function AlunosFeature() {
     const { items, loading } = useAlunos({ contaId });
     return <TableLayout>...</TableLayout>;
   }
   ```

3. **Componentes são reutilizáveis**
   - `TableLayout` - Layout padrão
   - `DataTable` - Tabelas
   - `EntityFiltersBar` - Filtros
   - `Pagination` - Paginação

### 2. Estrutura de Pastas

```
apps/web/
├── app/(app)/              # Páginas (wrappers)
├── features/cadastro/      # Features (lógica)
├── components/             # Componentes reutilizáveis
└── app/api/                # API Routes

packages/lib/
└── src/services/           # Backend (Prisma)
```

### 3. Sistema de Segurança

```tsx
// Multi-tenancy (SEMPRE)
const { user } = useCurrentUser();
const contaId = user?.contaId;

// Roles (controle de acesso)
const canEdit = ['ADMIN', 'RECEPCAO'].includes(user?.role);
```

---

## ⏱️ Em 10 minutos: Como Criar Funcionalidades

### Passo 1: Verificar se já existe

```bash
# Buscar páginas
ls apps/web/app/(app)/

# Buscar features
ls apps/web/features/cadastro/

# ⚠️ Se existir, NÃO CRIE DUPLICATA!
```

### Passo 2: Criar estrutura

```bash
# 1. Feature
mkdir -p features/cadastro/eventos/{hooks,services}
touch features/cadastro/eventos/EventosFeature.tsx

# 2. Página
mkdir -p app/(app)/eventos
touch app/(app)/eventos/page.tsx

# 3. API
mkdir -p app/api/eventos
touch app/api/eventos/route.ts
```

### Passo 3: Copiar templates

**Página:**

```tsx
'use client';
import EventosFeature from '@/features/cadastro/eventos/EventosFeature';
export default function EventosPage() {
  return <EventosFeature />;
}
```

**Feature:**

```tsx
'use client';
import TableLayout from '@/components/layout/TableLayout';
import DataTable from '@/components/layout/DataTable';
import useCurrentUser from '@/hooks/use-current-user';

export default function EventosFeature() {
  const { user } = useCurrentUser();
  const contaId = user?.contaId ?? null;

  const columns = [
    /* definir colunas */
  ];

  return (
    <TableLayout title="Eventos">
      <DataTable data={[]} columns={columns} loading={false} />
    </TableLayout>
  );
}
```

---

## ⏱️ Em 15 minutos: Roles e Permissões

### Roles Disponíveis

| Role          | Acesso                     |
| ------------- | -------------------------- |
| `ADMIN`       | Tudo                       |
| `FINANCEIRO`  | Área financeira            |
| `RECEPCAO`    | Matrículas, alunos, turmas |
| `PROFESSOR`   | Suas turmas                |
| `RESPONSAVEL` | Seus dependentes           |

### Como Usar

**Frontend:**

```tsx
const { user } = useCurrentUser();
const canCreate = ['ADMIN', 'RECEPCAO'].includes(user?.role ?? '');

{
  canCreate && <Button>Novo Item</Button>;
}
```

**Backend:**

```typescript
const allowedRoles = ['ADMIN', 'RECEPCAO'];
if (!allowedRoles.includes(session.user.role)) {
  return NextResponse.json({ error: { message: 'Sem permissão' } }, { status: 403 });
}
```

---

## 🚫 Top 5 Erros para Evitar

### 1. ❌ Criar páginas duplicadas

```
❌ app/(app)/recepcao/matriculas/page.tsx
   (quando já existe app/(app)/matriculas/page.tsx)
```

**Solução:** Use a existente + controle de acesso via roles

### 2. ❌ Colocar lógica na página

```tsx
❌ export default function AlunosPage() {
     const [data, setData] = useState([]);  // ❌
     useEffect(() => { fetch(...) }, []);   // ❌
   }
```

**Solução:** Mova tudo para Feature

### 3. ❌ Esquecer contaId

```tsx
❌ const items = await prisma.aluno.findMany();  // Sem contaId!
```

**Solução:** SEMPRE filtre por contaId

```tsx
✅ where: { contaId }
```

### 4. ❌ Esquecer validação de role

```typescript
❌ export async function DELETE(req: Request) {
     // Qualquer um pode excluir?
   }
```

**Solução:** Sempre valide role

### 5. ❌ Não reutilizar componentes

```tsx
❌ // Criando tabela do zero
    <table><thead>...
```

**Solução:** Use DataTable, TableLayout, etc.

---

## ✅ Checklist Rápido

Antes de commitar:

```
☐ Página tem < 15 linhas?
☐ Lógica está em Feature?
☐ Usa TableLayout/DataTable?
☐ Valida contaId?
☐ Valida role?
☐ Não criou duplicatas?
☐ Seguiu estrutura de pastas?
```

---

## 📚 Próximos Passos

### Agora você está pronto! 🎉

**Para aprofundar:**

1. **Arquitetura completa:** [docs/ARQUITETURA_E_PADROES.md](./ARQUITETURA_E_PADROES.md)
2. **Templates detalhados:** [docs/QUICK_REFERENCE.md](./QUICK_REFERENCE.md)
3. **Troubleshooting:** [docs/CORREMOS_DE_ARQUITETURA.md](./CORREMOS_DE_ARQUITETURA.md)

**Para ver exemplos:**

```bash
# Features de referência
cat features/cadastro/matriculas/MatriculasFeature.tsx
cat features/cadastro/alunos/AlunosFeature.tsx
cat features/cadastro/turmas/TurmasFeature.tsx

# Páginas de referência
cat app/(app)/matriculas/page.tsx
cat app/(app)/alunos/page.tsx

# API routes de referência
cat app/api/matriculas/route.ts
cat app/api/alunos/route.ts
```

---

## 🆘 Ajuda

- **Dúvida rápida:** [QUICK_REFERENCE.md](./QUICK_REFERENCE.md)
- **Erro de arquitetura:** [CORREMOS_DE_ARQUITETURA.md](./CORREMOS_DE_ARQUITETURA.md)
- **Dúvida conceitual:** [ARQUITETURA_E_PADROES.md](./ARQUITETURA_E_PADROES.md)

---

**Bem-vindo ao time! 🚀**

Versão: 1.0.0  
Última atualização: 2 de outubro de 2025
