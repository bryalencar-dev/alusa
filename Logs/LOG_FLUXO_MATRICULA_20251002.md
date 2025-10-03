# Log de Contexto — Cadastro de Matrícula (Alusa)

## 1. Fluxo do Wizard

O cadastro de matrícula é realizado via wizard multi-step, com os seguintes passos:

1. **Aluno**: Seleção/autocomplete do aluno (dados pessoais, responsável, vínculo).
2. **Turmas/Combo**: Escolha de turma(s) ou combo (pode ser individual ou agrupado).
3. **Plano**: Seleção do plano de cobrança (valor, periodicidade, descontos aplicáveis).
4. **Financeiro**: Definição de condições de cobrança:
   - Data de início
   - Dia do vencimento
   - Forma de pagamento (Dinheiro, PIX, Cartão, Boleto)
   - Taxa de matrícula
   - Desconto (fixo ou percentual)
   - Visualização do valor final
   - Se cartão: coleta dos dados do cartão (nome, número, validade, CVV)
5. **Resumo**: Exibição dos dados consolidados para confirmação antes do submit.

## 2. Dados Coletados

- **Aluno**: id, nome, data de nascimento, responsável, contatos, vínculo opcional com usuário.
- **Turma/Combo**: id da turma ou combo, nome, modalidade, horários, sala.
- **Plano**: id, nome, valor, periodicidade, descontos aplicáveis.
- **Financeiro**:
  - Data de início
  - Dia do vencimento
  - Forma de pagamento
  - Taxa de matrícula
  - Tipo e valor do desconto
  - Dados do cartão (se aplicável)
- **Resumo**: Todos os dados acima, mais cálculo do valor final, mensalidade, descontos.

## 3. Regras e Lógicas

- **Validação**: Cada step valida os campos obrigatórios antes de avançar.
- **Desconto**: Pode ser fixo ou percentual, aplicado sobre o valor do plano.
- **Taxa de matrícula**: Campo opcional, pode ser isento.
- **Cartão**: Dados coletados apenas se forma de pagamento for 'CARTAO'.
- **Resumo**: Exibe todos os dados para revisão antes do submit.
- **Persistência**: Ao finalizar, os dados são enviados para o backend, que grava nas tabelas:
  - `Matricula` (aluno, turma, plano, combo, datas, status, taxa, etc)
  - `Cobranca` (vinculada à matrícula, com forma de pagamento, valor, vencimento)
  - `DescontoMatricula` (se houver desconto aplicado)

## 4. Banco de Dados (Prisma)

- **Principais tabelas**:
  - `Aluno`, `Responsavel`, `Turma`, `Plano`, `Combo`, `Matricula`, `Cobranca`, `Desconto`, `DescontoMatricula`, `Pagamento`
- **Relacionamentos**:
  - `Matricula` referencia `Aluno`, `Turma`, `Plano`, `Combo`
  - `Cobranca` referencia `Matricula`
  - `DescontoMatricula` referencia `Matricula` e `Desconto`
  - `Pagamento` referencia `Cobranca`
- **Enums**:
  - `FormaPagamento`, `StatusMatricula`, `StatusCobranca`, `PeriodicidadePlano`, etc.
- **Multi-tenant**: Todas as entidades principais têm `contaId` para isolamento de dados.

## 5. Lógicas de Negócio

- **Cancelamento**: Ao cancelar matrícula, todas cobranças pendentes são marcadas como canceladas.
- **Auditoria**: Sugestão futura de logs/auditoria para exclusão e alterações críticas.
- **Validação de unicidade**: CPF, e-mail, código interno, etc, são únicos por conta.
- **Soft delete**: Algumas entidades usam `deletedAt` para exclusão lógica.

## 6. Consumo de Dados

- **Frontend**: Wizard consome dados via hooks/contextos, valida e envia para API.
- **Backend**: API recebe payload, valida, grava nas tabelas e retorna status/sucesso.
- **Prisma**: ORM utilizado para todas operações de banco.

## 7. Observações

- O fluxo está preparado para multi-tenant, com isolamento por conta.
- Todas as validações críticas são feitas tanto no frontend quanto no backend.
- O design do wizard permite fácil extensão para novos campos ou regras.

---

_Gerado automaticamente em 02/10/2025 por GitHub Copilot._
