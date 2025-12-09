# Análise do Fluxo de Matrícula e Rematrícula

## 📋 Resumo Executivo

Esta análise examina a coerência do fluxo de matrícula e rematrícula em um sistema baseado em contratos com data de término.

---

## 🔄 Fluxo Atual

### 1. Criação de Matrícula (`criarMatricula`)

**Estado Inicial:**
- `status`: `ATIVA` (default)
- `statusContrato`: `ATIVO` (default no schema)
- `dataInicio`: definida pelo usuário
- `dataFimContrato`: definida pelo usuário
- `dataFim`: `null`

**O que acontece:**
1. Validações de negócio (idade, capacidade, conflitos)
2. Criação da matrícula com `statusContrato = ATIVO`
3. Criação de cobranças (taxa e mensalidade)
4. Integração com Asaas (se habilitado)

**Observação crítica:** Não há lógica que atualiza automaticamente `statusContrato` quando `dataFimContrato` passa.

---

### 2. Rematrícula (`criarRematricula`)

**Elegibilidade:**
```typescript
where: {
  status: { in: [ATIVA, PAUSADA] },
  OR: [
    { statusContrato: ENCERRADO },
    { dataFimContrato: { lte: ate } } // ate = hoje + diasAntecedencia
  ]
}
```

**Validações:**
1. Matrícula anterior deve existir
2. Nova `dataInicio` >= `dataFimContrato` da anterior
3. Se contrato ainda ativo: `dataFimContrato > hoje` E `dataFimContrato > novaDataInicio` → ERRO

**O que acontece:**
1. Cria nova matrícula (herda configurações)
2. **Atualiza matrícula anterior:**
   - `statusContrato = ENCERRADO`
   - `dataFim = dataFimContrato` (ou mantém se já existir)
3. Cria log: `REMATRICULA_GERADA`

---

## ⚠️ Problemas Identificados

### 1. **StatusContrato não é atualizado automaticamente**

**Problema:**
- Quando `dataFimContrato` passa, o `statusContrato` permanece `ATIVO`
- A rematrícula depende de `statusContrato = ENCERRADO` OU `dataFimContrato <= hoje + antecedência`
- Isso cria uma inconsistência: contrato expirado mas status ainda `ATIVO`

**Impacto:**
- Matrículas podem aparecer como elegíveis para rematrícula mesmo com contrato expirado
- Mas a lógica de `podeRenovar` pode bloquear incorretamente

### 2. **Lógica redundante de `podeRenovar`**

```typescript
const contratoExpirado = diasRestantes < 0 || matricula.statusContrato === StatusContrato.ENCERRADO;
const podeRenovar = contratoExpirado || matricula.statusContrato === StatusContrato.ENCERRADO;
```

**Problema:** A segunda condição é redundante. Se `contratoExpirado` já inclui `statusContrato === ENCERRADO`, então `podeRenovar` sempre será `true` quando `contratoExpirado` for `true`.

**Correção sugerida:**
```typescript
const podeRenovar = contratoExpirado;
// ou
const podeRenovar = diasRestantes < 0 || matricula.statusContrato === StatusContrato.ENCERRADO;
```

### 3. **Validação de data de início na rematrícula**

**Código atual:**
```typescript
if (novaDataInicio < matriculaAtual.dataFimContrato) {
  throw new Error('A nova matrícula deve iniciar após o fim do contrato atual.');
}

if (
  matriculaAtual.statusContrato === StatusContrato.ATIVO &&
  matriculaAtual.dataFimContrato > new Date() &&
  matriculaAtual.dataFimContrato > novaDataInicio
) {
  throw new Error('Contrato atual ainda vigente. Ajuste a data de início da rematrícula.');
}
```

**Problema:** A segunda validação é redundante. Se `novaDataInicio >= dataFimContrato`, então `dataFimContrato > novaDataInicio` nunca será verdadeiro.

### 4. **Falta de processo automático de encerramento**

**Problema:** Não há job/cron que:
- Atualize `statusContrato` de `ATIVO` para `ENCERRADO` quando `dataFimContrato` passa
- Isso pode causar inconsistências no banco

---

## ✅ Pontos Positivos

1. **Herança de configurações:** A rematrícula herda corretamente forma de pagamento, descontos, etc.
2. **Validação de datas:** Impede sobreposição de contratos
3. **Logs de auditoria:** Registra a rematrícula no histórico
4. **Transações:** Uso correto de transações para garantir consistência

---

## 🔧 Recomendações

### 1. **Criar processo automático de encerramento**

Sugestão: Job diário que atualiza `statusContrato`:

```typescript
// Exemplo de lógica
await prisma.matricula.updateMany({
  where: {
    statusContrato: StatusContrato.ATIVO,
    dataFimContrato: { lte: new Date() }
  },
  data: {
    statusContrato: StatusContrato.ENCERRADO
  }
});
```

### 2. **Simplificar lógica de `podeRenovar`**

```typescript
const podeRenovar = diasRestantes < 0 || matricula.statusContrato === StatusContrato.ENCERRADO;
```

### 3. **Simplificar validação na rematrícula**

A segunda validação pode ser removida, pois é redundante.

### 4. **Adicionar validação no frontend**

Validar no dialog que `dataInicio >= dataFimContrato` antes de permitir submit.

### 5. **Considerar atualizar `dataFim` automaticamente**

Quando `statusContrato` muda para `ENCERRADO`, atualizar `dataFim` se ainda for `null`:

```typescript
dataFim: matriculaAtual.dataFim ?? matriculaAtual.dataFimContrato
```

---

## 📊 Diagrama de Fluxo

```
[Matrícula Criada]
  statusContrato = ATIVO
  dataFimContrato = X
  
  ↓ (tempo passa)
  
[dataFimContrato < hoje]
  ❌ statusContrato ainda ATIVO (inconsistência)
  
  ↓ (rematrícula)
  
[Busca Elegíveis]
  WHERE statusContrato = ENCERRADO 
     OR dataFimContrato <= hoje + antecedência
  
  ↓ (cria rematrícula)
  
[Nova Matrícula]
  statusContrato = ATIVO
  dataFimContrato = Y
  
[Matrícula Anterior]
  statusContrato = ENCERRADO ✅
  dataFim = dataFimContrato ✅
```

---

## 🎯 Conclusão

**O fluxo está funcionalmente coerente**, mas há **inconsistências de estado** que podem causar problemas:

1. ✅ A rematrícula funciona corretamente quando o contrato está encerrado
2. ⚠️ Mas depende de `dataFimContrato` para encontrar elegíveis, não apenas `statusContrato`
3. ⚠️ Falta processo automático para manter `statusContrato` sincronizado com `dataFimContrato`
4. ⚠️ Lógica redundante que pode ser simplificada

**Recomendação principal:** Implementar processo automático de encerramento de contratos para manter consistência.

