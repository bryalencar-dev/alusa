# 📚 Documentação do Projeto ALUSA

Bem-vindo à documentação técnica do projeto ALUSA. Este diretório contém toda a documentação necessária para desenvolvimento, manutenção e evolução do sistema.

---

## 📋 Índice de Documentos

> 💡 **Para um índice visual completo e detalhado, veja [INDEX.md](./INDEX.md)**

### 🚀 Início Rápido

#### [**ONBOARDING_QUICK_START.md**](./ONBOARDING_QUICK_START.md) - Comece Aqui! 🎯

**Quando consultar:** Primeiro contato com o projeto ou onboarding rápido.

**Conteúdo:**

- Arquitetura em 3 pontos essenciais
- Como criar funcionalidades em minutos
- Top 5 erros para evitar
- Checklist rápido
- Links para documentação completa

**Tamanho:** ~200 linhas  
**Nível:** Iniciante  
**Tempo de leitura:** 15 minutos

---

### 📐 Diagramas e Visualizações

#### [**DIAGRAMA_ARQUITETURA.md**](./DIAGRAMA_ARQUITETURA.md) - Visão Visual 🎨

**Quando consultar:** Para entender visualmente a arquitetura do sistema.

**Conteúdo:**

- Diagrama de camadas da arquitetura
- Fluxo de dados completo (GET e POST)
- Camadas de segurança ilustradas
- Estrutura de features detalhada
- Padrões de nomenclatura
- Fluxo de criação de features
- Matriz de responsabilidades

**Tamanho:** ~450 linhas  
**Nível:** Todos  
**Tipo:** Diagramas ASCII e visualizações

---

### 🏗️ Arquitetura e Padrões

#### [**ARQUITETURA_E_PADROES.md**](./ARQUITETURA_E_PADROES.md) - Principal ⭐

**Quando consultar:** Sempre que for iniciar uma nova funcionalidade ou tiver dúvidas sobre estrutura.

**Conteúdo:**

- Visão geral da arquitetura feature-based
- Estrutura completa de pastas do projeto
- Padrão de páginas (routes) - Como criar páginas corretamente
- Padrão de features - Onde colocar lógica de negócio
- Componentes reutilizáveis - TableLayout, DataTable, etc.
- Sistema de roles e permissões - Controle de acesso
- Services e APIs - Como estruturar requisições
- Fluxo de dados completo
- Padrões visuais e tipografia
- Checklist de desenvolvimento
- Exemplos práticos

**Tamanho:** ~1100 linhas  
**Nível:** Iniciante a Avançado

---

#### [**CORREMOS_DE_ARQUITETURA.md**](./CORREMOS_DE_ARQUITETURA.md) - Casos Práticos

**Quando consultar:** Quando cometer um erro ou antes de criar estruturas duplicadas.

**Conteúdo:**

- Erro comum: Criar páginas duplicadas (caso real: /recepcao/matriculas)
- Erro comum: Lógica de negócio na página
- Erro comum: Ignorar sistema de roles
- Como identificar erros de arquitetura
- Fluxo de decisão para novas funcionalidades
- Exemplos de correções passo a passo
- Lista de DO's e DON'Ts
- Sinais de alerta

**Tamanho:** ~700 linhas  
**Nível:** Intermediário  
**Baseado em:** Correção real de 2/10/2025

---

#### [**QUICK_REFERENCE.md**](./QUICK_REFERENCE.md) - Referência Rápida ⚡

**Quando consultar:** Durante o desenvolvimento para consultas rápidas.

**Conteúdo:**

- Tabela de onde criar cada tipo de arquivo
- Templates prontos para copiar e colar:
  - Página nova
  - Feature nova
  - Hook de dados
  - Service (frontend)
  - API Route
- Componentes reutilizáveis - Sintaxe rápida
- Sistema de roles - Exemplos rápidos
- Padrões de código - Imports, nomenclatura
- Erros comuns (resumo)
- Comandos úteis
- Checklist de nova feature

**Tamanho:** ~400 linhas  
**Nível:** Todos  
**Tipo:** Cheatsheet / Cookbook

---

### 🔐 Autenticação

#### [**auth/README.md**](./auth/README.md)

**Conteúdo:**

- Sistema de autenticação (NextAuth)
- Configuração de sessões
- Fluxo de login/logout
- Middleware de proteção de rotas

---

### 📊 Execução e Logs

Documentos de execução de funcionalidades específicas (histórico de implementação):

- **EXEC_ATUALIZACAO_20250929.md** - Atualizações gerais
- **EXEC_MODALIDADES_CRUD_20250923.md** - CRUD de modalidades
- **EXEC_SALAS_CRUD_20250924.md** - CRUD de salas
- **EXEC_SALAS_INLINE_20250924.md** - Edição inline de salas
- **EXEC_TURMAS_CRUD_20250923.md** - CRUD de turmas
- **LOG_FLUXO_MATRICULA_20251002.md** - Fluxo completo de matrículas
- **RELATORIO_ARQUITETURA_E_STATUS.md** - Relatório geral de arquitetura
- **RELATORIO_DEPENDENCIAS.md** - Relatório de dependências

---

## 🎯 Como Usar Esta Documentação

### Para Novos Desenvolvedores

1. **Comece por aqui:** Leia o [README principal](../README.md) do projeto
2. **Entenda a arquitetura:** [ARQUITETURA_E_PADROES.md](./ARQUITETURA_E_PADROES.md)
3. **Veja exemplos práticos:** [CORREMOS_DE_ARQUITETURA.md](./CORREMOS_DE_ARQUITETURA.md)
4. **Tenha sempre à mão:** [QUICK_REFERENCE.md](./QUICK_REFERENCE.md)

### Para Desenvolvedores Experientes

1. **Consulta rápida:** [QUICK_REFERENCE.md](./QUICK_REFERENCE.md)
2. **Dúvidas específicas:** [ARQUITETURA_E_PADROES.md](./ARQUITETURA_E_PADROES.md) (buscar seção)
3. **Troubleshooting:** [CORREMOS_DE_ARQUITETURA.md](./CORREMOS_DE_ARQUITETURA.md)

### Para Code Review

1. **Checklist:** [ARQUITETURA_E_PADROES.md](./ARQUITETURA_E_PADROES.md) - Seção "Checklist de Desenvolvimento"
2. **Erros comuns:** [CORREMOS_DE_ARQUITETURA.md](./CORREMOS_DE_ARQUITETURA.md) - Seção "Como Identificar Erros"
3. **Padrões:** [QUICK_REFERENCE.md](./QUICK_REFERENCE.md) - Seção "Padrões de Código"

### Para Onboarding de IA/Copilot

**Configure seu AI Assistant para:**

1. Sempre consultar [ARQUITETURA_E_PADROES.md](./ARQUITETURA_E_PADROES.md) antes de criar novas estruturas
2. Usar templates de [QUICK_REFERENCE.md](./QUICK_REFERENCE.md)
3. Verificar erros em [CORREMOS_DE_ARQUITETURA.md](./CORREMOS_DE_ARQUITETURA.md)

---

## 🚀 Fluxo de Trabalho Recomendado

### Criar Nova Funcionalidade

```
1. Consultar ARQUITETURA_E_PADROES.md
   └── Verificar se funcionalidade já existe
   └── Entender estrutura de pastas

2. Usar templates de QUICK_REFERENCE.md
   └── Copiar template de página
   └── Copiar template de feature
   └── Copiar template de hook/service

3. Seguir checklist de ARQUITETURA_E_PADROES.md
   └── Validar contaId (multi-tenancy)
   └── Validar roles (autorização)
   └── Reutilizar componentes

4. Revisar com CORREMOS_DE_ARQUITETURA.md
   └── Verificar se não cometeu erros comuns
   └── Conferir sinais de alerta
```

### Corrigir Erro de Arquitetura

```
1. Identificar erro em CORREMOS_DE_ARQUITETURA.md
   └── Verificar sinais de alerta
   └── Comparar com exemplos

2. Aplicar correção seguindo exemplos
   └── Deletar duplicatas
   └── Mover lógica para lugar correto
   └── Adicionar validações de role

3. Validar com checklist de ARQUITETURA_E_PADROES.md
```

---

## 📖 Convenções de Documentação

### Estrutura de Documentos

Todos os documentos seguem esta estrutura:

1. **Título e Descrição** - O que é e para que serve
2. **Índice** - Navegação rápida
3. **Conteúdo Principal** - Explicações detalhadas
4. **Exemplos Práticos** - Código real
5. **Referências** - Links e recursos
6. **Metadados** - Versão, data, autores

### Emojis Usados

- 📁 Estrutura de arquivos
- 🎯 Objetivos e metas
- ✅ Correto / Recomendado
- ❌ Incorreto / Não recomendado
- 🚨 Alerta / Atenção
- 💡 Dica / Insight
- 🔐 Segurança / Autenticação
- 🧩 Componentes
- 🔍 Busca / Troubleshooting
- 📊 Dados / Fluxos
- ⚡ Rápido / Performance
- 🆘 Ajuda / Suporte

### Status de Documentos

- **[ATUAL]** - Documentação atualizada e revisada
- **[LEGADO]** - Documentação antiga, consultar com cautela
- **[DRAFT]** - Em elaboração
- **[DEPRECATED]** - Obsoleto, não usar

---

## 🔄 Manutenção da Documentação

### Quando Atualizar

- ✅ Ao adicionar nova funcionalidade significativa
- ✅ Ao corrigir erro arquitetural importante
- ✅ Ao mudar padrões de código
- ✅ Ao adicionar novos componentes reutilizáveis
- ✅ Ao mudar sistema de roles/permissões

### Como Atualizar

1. **Identificar documento afetado**
2. **Atualizar seção específica**
3. **Atualizar data de modificação**
4. **Incrementar versão (se relevante)**
5. **Atualizar este README se necessário**

### Versionamento

- **1.x.x** - Mudanças maiores de arquitetura
- **x.1.x** - Adição de novas seções
- **x.x.1** - Correções e melhorias

---

## 🎓 Recursos Adicionais

### Tecnologias Principais

- **Next.js 14** - [Documentação](https://nextjs.org/docs)
- **React 18** - [Documentação](https://react.dev/)
- **TypeScript** - [Documentação](https://www.typescriptlang.org/docs/)
- **Prisma** - [Documentação](https://www.prisma.io/docs)
- **NextAuth.js** - [Documentação](https://next-auth.js.org/)
- **Tailwind CSS** - [Documentação](https://tailwindcss.com/docs)

### Padrões de Projeto

- **Feature-Based Architecture** - Organização por funcionalidade
- **Repository Pattern** - Services como camada de abstração
- **Multi-Tenancy** - Isolamento por `contaId`
- **RBAC (Role-Based Access Control)** - Controle de acesso por roles

---

## 📞 Suporte

### Onde Buscar Ajuda

1. **Documentação** (este diretório)
2. **Código existente** (`features/cadastro/` para exemplos)
3. **Time de desenvolvimento**
4. **Issues do repositório**

### Reportar Problemas na Documentação

Se encontrar erros, inconsistências ou melhorias possíveis na documentação:

1. Abra uma issue no repositório
2. Descreva o problema/sugestão
3. Indique qual documento está afetado
4. Sugira uma correção (opcional)

---

## 📝 Glossário

| Termo                 | Significado                                               |
| --------------------- | --------------------------------------------------------- |
| **Feature**           | Módulo completo de funcionalidade (ex: MatriculasFeature) |
| **Page**              | Wrapper minimalista em `app/(app)/` que renderiza Feature |
| **Service**           | Camada de abstração para comunicação com API              |
| **Hook**              | Custom hook React para lógica de estado/efeitos           |
| **Role**              | Papel do usuário no sistema (ADMIN, RECEPCAO, etc.)       |
| **ContaId**           | Identificador da conta (multi-tenancy)                    |
| **Multi-Tenancy**     | Isolamento de dados por conta                             |
| **RBAC**              | Role-Based Access Control (controle por papel)            |
| **Layout Components** | Componentes de estrutura (TableLayout, DataTable, etc.)   |
| **Feature-Based**     | Arquitetura organizada por funcionalidade                 |

---

## 🏆 Melhores Práticas

### Top 10 Regras de Ouro

1. ✅ **Sempre verifique se já existe** antes de criar
2. ✅ **Páginas são wrappers** (< 15 linhas)
3. ✅ **Lógica vai em Features** (não em páginas)
4. ✅ **Reutilize componentes** (TableLayout, DataTable, etc.)
5. ✅ **Use sistema de roles** (não crie pastas por role)
6. ✅ **Sempre valide contaId** (multi-tenancy)
7. ✅ **Sempre valide role** (autorização)
8. ✅ **Use TypeScript** em 100% do código
9. ✅ **Siga nomenclatura** (PascalCase, camelCase, kebab-case)
10. ✅ **Consulte documentação** antes de criar

---

## 📅 Histórico de Atualizações

| Data       | Documento                  | Mudança                                               |
| ---------- | -------------------------- | ----------------------------------------------------- |
| 02/10/2025 | ARQUITETURA_E_PADROES.md   | Criação inicial - Documentação completa               |
| 02/10/2025 | CORREMOS_DE_ARQUITETURA.md | Criação - Baseado em correção de /recepcao/matriculas |
| 02/10/2025 | QUICK_REFERENCE.md         | Criação - Cheatsheet para desenvolvimento             |
| 02/10/2025 | README.md (este)           | Criação - Índice da documentação                      |

---

**Mantido por:** Equipe de Desenvolvimento ALUSA  
**Última atualização:** 2 de outubro de 2025  
**Versão da documentação:** 1.0.0
