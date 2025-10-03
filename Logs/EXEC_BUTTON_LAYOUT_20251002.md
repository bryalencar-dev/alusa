# 📝 Ajuste de Layout: Botões do Wizard de Matrícula

**Data**: 02/10/2025  
**Desenvolvedor**: GitHub Copilot Agent  
**Tarefa**: Ajustar posicionamento dos botões no wizard de matrícula

---

## 🎯 Objetivo

Melhorar o layout dos botões no wizard de matrícula:

1. **Botões "Voltar" e "Avançar"** lado a lado, alinhados à direita
2. **Botão "Cadastrar aluno"** sempre visível embaixo do campo de busca

---

## 📦 Arquivos Modificados

### ✅ 1. `MatriculaWizardFlow.tsx`

#### Antes (❌)

```tsx
<div className="flex items-center justify-between gap-3 border-t ...">
  <div className="flex items-center gap-2">
    {wizard.step !== 'aluno' && (
      <Button variant="outline" onClick={handleBack}>
        Voltar
      </Button>
    )}
  </div>
  <div className="flex items-center gap-2">
    <Button onClick={handleNext}>{wizard.step === 'resumo' ? 'Concluir' : 'Avançar'}</Button>
  </div>
</div>
```

**Layout**:

```
┌─────────────────────────────────────────┐
│ [Voltar]              [Avançar] ────────│
└─────────────────────────────────────────┘
```

#### Depois (✅)

```tsx
<div className="flex items-center justify-end gap-3 border-t ...">
  <div className="flex items-center gap-3">
    {wizard.step !== 'aluno' && (
      <Button variant="outline" onClick={handleBack}>
        Voltar
      </Button>
    )}
    <Button onClick={handleNext}>{wizard.step === 'resumo' ? 'Concluir' : 'Avançar'}</Button>
  </div>
</div>
```

**Layout**:

```
┌─────────────────────────────────────────┐
│                   [Voltar] [Avançar] ───│
└─────────────────────────────────────────┘
```

**Mudanças**:

- ✅ `justify-between` → `justify-end` (tudo à direita)
- ✅ `gap-2` → `gap-3` (espaçamento entre botões)
- ✅ Botões agrupados em um único `<div>`

---

### ✅ 2. `StepAluno.tsx`

#### Antes (❌)

Botão "Cadastrar Novo Aluno" só aparecia quando **não estava no modo de formulário**:

```tsx
{
  !showForm && !state.aluno && (
    <div className="space-y-4">
      {/* Campo de busca */}
      <div className="relative">...</div>

      {/* Botão dentro do mesmo bloco */}
      <Button onClick={() => setShowForm(true)}>Cadastrar Novo Aluno</Button>
    </div>
  );
}
```

**Problemas**:

- ❌ Botão desaparecia quando formulário abria
- ❌ Não era possível cancelar de forma visual clara

#### Depois (✅)

Botão **sempre visível** abaixo do campo de busca:

```tsx
{
  !showForm && !state.aluno && (
    <div className="space-y-4">
      {/* Campo de busca */}
      <div className="relative">...</div>
    </div>
  );
}

{
  /* Botão agora fora do bloco showForm */
}
{
  !state.aluno && (
    <div className="pt-2">
      <Button
        onClick={() => {
          if (showForm) {
            setShowForm(false);
            reset();
          } else {
            setShowForm(true);
          }
        }}
      >
        <PlusIcon className="h-4 w-4 mr-2" />
        Cadastrar aluno
      </Button>
    </div>
  );
}
```

**Layout**:

```
┌─────────────────────────────────────────┐
│ 🔍 [Campo de busca]                     │
│                                         │
│ [+ Cadastrar aluno] ←── Sempre visível │
│                                         │
│ {Formulário de cadastro (se aberto)}   │
└─────────────────────────────────────────┘
```

**Mudanças**:

- ✅ Botão **sempre visível** (quando aluno não selecionado)
- ✅ **Toggle**: Abre/fecha formulário
- ✅ Texto simplificado: "Cadastrar aluno" (vs "Cadastrar Novo Aluno")
- ✅ Chama `reset()` ao cancelar (limpa formulário)
- ✅ Ícone `PlusIcon` mantido

---

## 🎨 Comportamento por Etapa

### Etapa 1: Aluno (primeira etapa)

```
┌─────────────────────────────────────────┐
│ 🔍 [Campo de busca]                     │
│ [+ Cadastrar aluno]                     │
│                                         │
│                        [Avançar] ───────│
└─────────────────────────────────────────┘
```

**Características**:

- ❌ Sem botão "Voltar" (primeira etapa)
- ✅ Botão "Avançar" à direita
- ✅ Botão "Cadastrar aluno" embaixo da busca

---

### Etapas 2-5: Turmas, Taxa, Plano, Financeiro

```
┌─────────────────────────────────────────┐
│ [Conteúdo da etapa]                     │
│                                         │
│              [Voltar] [Avançar] ────────│
└─────────────────────────────────────────┘
```

**Características**:

- ✅ Ambos os botões visíveis
- ✅ Lado a lado, alinhados à direita
- ✅ Gap de 3 entre eles (12px)

---

### Etapa 6: Resumo (última etapa)

```
┌─────────────────────────────────────────┐
│ [Resumo da matrícula]                   │
│                                         │
│              [Voltar] [Concluir] ───────│
└─────────────────────────────────────────┘
```

**Características**:

- ✅ "Avançar" vira "Concluir"
- ✅ Mostra "Processando..." quando submetendo
- ✅ Botão desabilitado durante submissão

---

## 🔄 Fluxo de Interação

### No StepAluno

**1. Estado inicial (sem aluno selecionado)**

```
┌─────────────────────────────────────────┐
│ 🔍 [Campo de busca]                     │
│                                         │
│ [+ Cadastrar aluno] ◄── Clicável       │
└─────────────────────────────────────────┘
```

**2. Após clicar "Cadastrar aluno"**

```
┌─────────────────────────────────────────┐
│ 🔍 [Campo de busca]                     │
│                                         │
│ [+ Cadastrar aluno] ◄── Fecha formulário│
│                                         │
│ [Formulário expandido]                  │
│ - Nome                                  │
│ - Data nascimento                       │
│ - CPF                                   │
│ - ...                                   │
│                                         │
│ [Cancelar] [Salvar e Continuar]        │
└─────────────────────────────────────────┘
```

**3. Após selecionar aluno**

```
┌─────────────────────────────────────────┐
│ ┌───────────────────────────────────┐   │
│ │ 👤 Bryan de Alencar Bezerra  [×] │   │
│ │ CPF: 044.104.352-64              │   │
│ └───────────────────────────────────┘   │
│                                         │
│ ❌ Botão "Cadastrar aluno" oculto      │
└─────────────────────────────────────────┘
```

---

## 📊 Comparação Visual

### Layout dos Botões de Navegação

| Aspecto            | ❌ Antes                     | ✅ Depois               |
| ------------------ | ---------------------------- | ----------------------- |
| **Alinhamento**    | `justify-between` (extremos) | `justify-end` (direita) |
| **Agrupamento**    | 2 divs separados             | 1 div unificado         |
| **Gap**            | `gap-2` (8px)                | `gap-3` (12px)          |
| **Responsividade** | Igual                        | Igual                   |
| **Consistência**   | Botões distantes             | Botões próximos         |

### Botão "Cadastrar aluno"

| Aspecto           | ❌ Antes                 | ✅ Depois            |
| ----------------- | ------------------------ | -------------------- |
| **Visibilidade**  | Desaparece ao abrir form | Sempre visível       |
| **Texto**         | "Cadastrar Novo Aluno"   | "Cadastrar aluno"    |
| **Comportamento** | Só abre                  | Toggle (abre/fecha)  |
| **Reset**         | Manual                   | Automático ao fechar |
| **Posição**       | Dentro do bloco de busca | Independente         |

---

## ✅ Melhorias de UX

### 1. **Consistência visual**

- Botões de navegação sempre juntos à direita
- Padrão mantido em todas as etapas
- Mais próximo do padrão de diálogos modernos

### 2. **Clareza de ação**

- "Voltar" e "Avançar" visualmente conectados
- Usuário entende que são ações de navegação
- Separação clara entre ações primárias e secundárias

### 3. **Flexibilidade**

- Botão "Cadastrar aluno" sempre acessível
- Possível mudar de ideia durante preenchimento
- Formulário pode ser fechado facilmente

### 4. **Espaçamento**

- Gap de 12px entre botões (mais confortável)
- Menos "espalhado" horizontalmente
- Melhor aproveitamento do espaço

---

## 🧪 Casos de Teste

### Teste 1: Navegação entre etapas

```typescript
describe('Botões de navegação', () => {
  it('devem estar alinhados à direita', () => {
    render(<MatriculaWizardFlow />);
    const footer = screen.getByRole('contentinfo'); // ou selector apropriado
    expect(footer).toHaveClass('justify-end');
  });

  it('botão Voltar não aparece na primeira etapa', () => {
    render(<MatriculaWizardFlow />);
    expect(screen.queryByText('Voltar')).not.toBeInTheDocument();
    expect(screen.getByText('Avançar')).toBeInTheDocument();
  });

  it('ambos os botões aparecem nas etapas intermediárias', () => {
    const { goNext } = renderWithWizardContext(<MatriculaWizardFlow />, { step: 'turmasCombo' });
    expect(screen.getByText('Voltar')).toBeInTheDocument();
    expect(screen.getByText('Avançar')).toBeInTheDocument();
  });

  it('botão Avançar vira Concluir na última etapa', () => {
    renderWithWizardContext(<MatriculaWizardFlow />, { step: 'resumo' });
    expect(screen.getByText('Concluir')).toBeInTheDocument();
    expect(screen.queryByText('Avançar')).not.toBeInTheDocument();
  });
});
```

### Teste 2: Botão "Cadastrar aluno"

```typescript
describe('Botão Cadastrar aluno', () => {
  it('deve estar sempre visível quando aluno não selecionado', () => {
    render(<StepAluno ctx={mockCtx} />);
    expect(screen.getByText('Cadastrar aluno')).toBeInTheDocument();
  });

  it('deve abrir formulário ao clicar', () => {
    render(<StepAluno ctx={mockCtx} />);
    fireEvent.click(screen.getByText('Cadastrar aluno'));
    expect(screen.getByLabelText('Nome Completo *')).toBeInTheDocument();
  });

  it('deve fechar formulário ao clicar novamente', () => {
    render(<StepAluno ctx={mockCtx} />);
    const button = screen.getByText('Cadastrar aluno');

    fireEvent.click(button); // Abre
    expect(screen.getByLabelText('Nome Completo *')).toBeInTheDocument();

    fireEvent.click(button); // Fecha
    expect(screen.queryByLabelText('Nome Completo *')).not.toBeInTheDocument();
  });

  it('deve desaparecer quando aluno é selecionado', () => {
    const ctx = { ...mockCtx, state: { ...mockCtx.state, aluno: mockAluno } };
    render(<StepAluno ctx={ctx} />);
    expect(screen.queryByText('Cadastrar aluno')).not.toBeInTheDocument();
  });
});
```

---

## 📱 Responsividade

### Desktop (≥768px)

```
┌───────────────────────────────────────────────┐
│ [Conteúdo do step]                            │
│                                               │
│                        [Voltar] [Avançar] ────│
└───────────────────────────────────────────────┘
```

### Mobile (<768px)

```
┌─────────────────────┐
│ [Conteúdo do step]  │
│                     │
│ [Voltar] [Avançar] ─│
└─────────────────────┘
```

**Classes responsivas mantidas**:

- `p-4 md:p-6` (padding adaptativo)
- `gap-3` (consistente em todas as telas)
- Botões mantêm `min-w-[140px]` e `min-w-[160px]`

---

## ✅ Checklist de Entrega

- [x] Botões "Voltar" e "Avançar" agrupados à direita
- [x] Gap de 3 (12px) entre os botões
- [x] Botão "Cadastrar aluno" sempre visível (quando sem aluno)
- [x] Comportamento toggle do botão "Cadastrar aluno"
- [x] Reset automático ao fechar formulário
- [x] Texto simplificado: "Cadastrar aluno"
- [x] Layout consistente em todas as etapas
- [x] Responsividade mantida
- [ ] Testes unitários atualizados (pendente)
- [ ] Testes E2E validados (pendente)

---

## 🎉 Resultado

✅ **Layout dos botões modernizado com sucesso!**  
✅ **Navegação mais intuitiva e consistente**  
✅ **Botão "Cadastrar aluno" sempre acessível**  
✅ **UX melhorada em todas as etapas**

**O wizard agora segue padrões modernos de UI com botões de ação agrupados e bem posicionados!** 🚀

---

_Ajuste concluído em 02/10/2025_  
_Desenvolvedor: GitHub Copilot Agent_  
_Versão: 1.0_
