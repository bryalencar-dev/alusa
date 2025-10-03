# 🎯 Teste do Fluxo de Matrícula com Status Financeiro

## Como testar a implementação

### 1. **Teste básico - Matrícula sem taxa (isenta)**

1. Acesse `/matriculas/novo`
2. Selecione um aluno existente
3. Escolha um plano
4. No Step Taxa: marque "Isentar taxa"
5. Preencha a justificativa (ex: "Bolsista integral")
6. Finalize a matrícula
7. **Resultado esperado:**
   - Matrícula criada com `status: ATIVA`
   - `statusFinanceiro: ADIMPLENTE`
   - `taxaIsenta: true`
   - Toast de sucesso
   - Nenhum link de checkout

### 2. **Teste com taxa pendente (sem pagamento imediato)**

1. Acesse `/matriculas/novo`
2. Selecione aluno e plano
3. No Step Taxa: marque "Cobrar taxa"
4. Defina um valor (ex: R$ 120,00)
5. **NÃO** marque "Pagar taxa agora"
6. Finalize a matrícula
7. **Resultado esperado:**
   - Matrícula criada com `status: ATIVA`
   - `statusFinanceiro: PENDENTE_TAXA`
   - `taxaIsenta: false`
   - Toast de sucesso
   - Nenhum link de checkout

### 3. **Teste com cartão (link copiado)**

1. Acesse `/matriculas/novo`
2. Selecione aluno e plano
3. No Step Taxa: marque "Cobrar taxa"
4. Defina um valor (ex: R$ 120,00)
5. **Marque** "Pagar taxa agora"
6. Escolha método "CARTAO"
7. Finalize a matrícula
8. **Resultado esperado:**
   - Matrícula criada com `status: ATIVA`
   - `statusFinanceiro: PENDENTE_TAXA`
   - Toast mostrando "Link de checkout copiado!"
   - Link `/checkout/[token]` na área de transferência
   - Cobrança AVULSA criada

### 4. **Teste da página de checkout**

1. Após o teste 3, abra o link copiado
2. **Resultado esperado:**
   - Página com formulário de cartão de crédito
   - Dados do aluno e valor da taxa
   - Campos: número, validade, CVV, nome
   - Botão "Finalizar Pagamento" (desabilitado por enquanto)

### 5. **Teste com PIX/Boleto (simulação)**

1. No Step Taxa, escolha "PIX" ou "BOLETO"
2. **Resultado esperado:**
   - Matrícula criada normalmente
   - Nenhum link de checkout (seria enviado via Asaas)
   - Cobrança AVULSA criada

## Validações no banco de dados

Após cada teste, verifique no banco:

```sql
-- Ver matrícula criada
SELECT id, status, "statusFinanceiro", "taxaIsenta", "taxaMatricula", "taxaJustificativa"
FROM "Matricula"
ORDER BY "createdAt" DESC
LIMIT 1;

-- Ver cobrança da taxa
SELECT id, tipo, descricao, valor, "formaPagamento", status
FROM "Cobranca"
WHERE "matriculaId" = '[ID_DA_MATRICULA]'
AND tipo = 'AVULSA';

-- Ver checkout link (se cartão)
SELECT id, token, "expiresAt", "usedAt"
FROM "CheckoutLink"
WHERE "matriculaId" = '[ID_DA_MATRICULA]';
```

## Fluxos implementados ✅

- ✅ Matrícula sempre ATIVA (nunca trava)
- ✅ StatusFinanceiro independente (ADIMPLENTE, PENDENTE_TAXA, INADIMPLENTE)
- ✅ Link de checkout copiado automaticamente (método cartão)
- ✅ Página de checkout adaptada por método
- ✅ Cobrança AVULSA com descrição "Taxa de matrícula"
- ✅ Justificativa de isenção registrada
- ✅ UI intuitiva com alertas explicativos

## Próximos passos (fora do escopo)

- ⏳ Integração real com Asaas (QR Code PIX, processamento cartão)
- ⏳ Webhook para atualizar statusFinanceiro automaticamente
- ⏳ Portal do aluno (visualizar e pagar taxa)
- ⏳ Listagem de matrículas com filtro por statusFinanceiro
