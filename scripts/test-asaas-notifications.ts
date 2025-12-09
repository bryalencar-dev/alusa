/**
 * Script para Testar Endpoints de Notificações do Asaas
 * 
 * Este script testa se os endpoints de envio manual de notificações
 * realmente existem na API do Asaas.
 * 
 * Para rodar: npx tsx scripts/test-asaas-notifications.ts
 */

import { getAsaasClient } from '../packages/lib/src/asaas/client';

async function testAsaasNotificationEndpoints() {
  console.log('🧪 Testando Endpoints de Notificações do Asaas...\n');

  const client = getAsaasClient();
  
  // ID de um payment real do seu sandbox (substitua por um válido)
  const testPaymentId = 'pay_TESTE_ID'; // ⚠️ SUBSTITUA POR UM ID REAL
  
  const endpoints = [
    { name: 'sendEmail', path: `/payments/${testPaymentId}/sendEmail` },
    { name: 'sendSms', path: `/payments/${testPaymentId}/sendSms` },
    { name: 'sendWhatsApp', path: `/payments/${testPaymentId}/sendWhatsApp` },
  ];

  for (const endpoint of endpoints) {
    try {
      console.log(`\n📧 Testando: ${endpoint.name}`);
      console.log(`   Endpoint: POST ${endpoint.path}`);
      
      const response = await client.post(endpoint.path, {});
      
      console.log(`   ✅ SUCESSO!`);
      console.log(`   Resposta:`, JSON.stringify(response.data, null, 2));
      
    } catch (error: any) {
      if (error.response) {
        const status = error.response.status;
        const data = error.response.data;
        
        console.log(`   Status: ${status}`);
        console.log(`   Resposta:`, JSON.stringify(data, null, 2));
        
        if (status === 404) {
          console.log(`   ❌ ENDPOINT NÃO EXISTE!`);
        } else if (status === 400 || status === 422) {
          console.log(`   ⚠️ Endpoint existe, mas parâmetros inválidos`);
        } else if (status === 401 || status === 403) {
          console.log(`   ⚠️ Endpoint pode existir, erro de autenticação`);
        } else {
          console.log(`   ❓ Status inesperado: ${status}`);
        }
      } else {
        console.log(`   ❌ ERRO:`, error.message);
      }
    }
  }
  
  console.log('\n\n📋 RESUMO:');
  console.log('─'.repeat(50));
  console.log('Se todos retornaram 404: Endpoints NÃO EXISTEM');
  console.log('Se retornaram 400/422: Endpoints EXISTEM mas precisam de params corretos');
  console.log('Se retornaram sucesso: Endpoints EXISTEM e FUNCIONAM!');
}

testAsaasNotificationEndpoints().catch(console.error);


