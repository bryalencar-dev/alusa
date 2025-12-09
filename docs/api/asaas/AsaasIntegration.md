# Documentação — Integração com Asaas

---

## 1. Visão Geral
A integração com o Asaas permite a automação de processos financeiros, como criação de cobranças, gestão de pagamentos, antecipação de recebíveis, e suporte ao Pix. Esta documentação cobre os principais endpoints e fluxos utilizados no sistema.

---

## 2. Endpoints Principais

### 2.1. Criação de Links de Pagamento
- **Endpoint**: `POST /v3/paymentLinks`
- **Descrição**: Cria um link de pagamento que permite aos clientes pagar em parcelas utilizando cartões de crédito.
- **Exemplo de Requisição**:
```json
{
  "billingType": "CREDIT_CARD",
  "chargeType": "INSTALLMENT",
  "name": "Venda de eletrônicos",
  "description": "Qualquer produto em até 10x de R$ 50,00",
  "value": 500.00,
  "maxInstallmentCount": 10,
  "notificationEnabled": false
}
```
- **Exemplo de Resposta**:
```json
{
  "id": "plink_abcdef1234567890",
  "object": "paymentLink",
  "dateCreated": "2023-10-27T10:05:00.000Z",
  "paymentLinkUrl": "https://www.asaas.com/pay/plink_abcdef1234567890"
}
```

### 2.2. Cobranças via Boleto
- **Endpoint**: `POST /v3/lean/payments`
- **Descrição**: Cria um plano de pagamento parcelado via boleto.
- **Exemplo de Requisição**:
```json
{
  "customer": "cus_000005219613",
  "billingType": "BOLETO",
  "value": 2000.00,
  "dueDate": "2023-07-21",
  "installmentCount": 10,
  "installmentValue": 200.00
}
```
- **Exemplo de Resposta**:
```json
{
  "installment": "24ef7e81-7961-41b7-bd28-90e25ad2c3d7"
}
```

### 2.3. Integração com Pix
- **Descrição**: Suporte para pagamentos via Pix, incluindo geração de QR Codes dinâmicos e estáticos.
- **Métodos Disponíveis**:
  - Geração de QR Code Dinâmico
  - Registro de Chaves Pix
  - Criação de QR Code Estático

### 2.4. Gestão de Webhooks
- **Endpoint**: `GET /v3/webhooks`
- **Descrição**: Lista todos os webhooks configurados na conta Asaas.

### 2.5. Antecipação de Recebíveis
- **Endpoint**: `POST /v3/anticipations`
- **Descrição**: Solicita a antecipação de pagamentos ou parcelas.
- **Exemplo de Requisição**:
```json
{
  "payment": "pay_626366773834"
}
```
- **Exemplo de Resposta**:
```json
{
  "isDocumentationRequired": true
}
```

---

## 3. Fluxos Implementados

### 3.1. Criação de Cobranças
1. O sistema cria uma cobrança utilizando o endpoint `POST /v3/lean/payments`.
2. O cliente recebe o boleto gerado e realiza o pagamento.
3. O status do pagamento é atualizado automaticamente via webhook configurado.

### 3.2. Pagamentos via Pix
1. O sistema gera um QR Code dinâmico para o cliente.
2. O cliente realiza o pagamento via Pix.
3. O status do pagamento é atualizado automaticamente.

### 3.3. Antecipação de Recebíveis
1. O sistema solicita a antecipação de um pagamento utilizando o endpoint `POST /v3/anticipations`.
2. O Asaas processa a solicitação e retorna o status da antecipação.

---

## 4. Boas Práticas
- Sempre valide os dados antes de enviar para a API.
- Utilize webhooks para manter o status dos pagamentos atualizado em tempo real.
- Respeite os limites de parcelamento e valores definidos pelo Asaas.
- Garanta que os URLs de callback estejam configurados corretamente.

---

## 5. Referências
- [Documentação Oficial do Asaas](https://docs.asaas.com)
- [Exemplos de Integração](https://docs.asaas.com/docs/exemplos)

---

## 6. Observações
- Certifique-se de que as credenciais da API estejam seguras.
- Teste todos os fluxos em ambiente de homologação antes de ir para produção.
- Consulte a documentação oficial para detalhes adicionais sobre os endpoints e parâmetros disponíveis.