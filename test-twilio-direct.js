#!/usr/bin/env node
/**
 * Script de teste direto da API Twilio
 * Valida se as variáveis de ambiente estão corretas e testa envio
 */

const Twilio = require('twilio');
require('dotenv').config({ path: '.env.local' });

console.log('\n🔍 VALIDAÇÃO DE CONFIGURAÇÃO TWILIO\n');
console.log('=====================================\n');

// 1. Verificar variáveis de ambiente
console.log('📋 Variáveis de ambiente:');
console.log('  TWILIO_ACCOUNT_SID:', process.env.TWILIO_ACCOUNT_SID ? '✅ Definida' : '❌ AUSENTE');
console.log('  TWILIO_AUTH_TOKEN:', process.env.TWILIO_AUTH_TOKEN ? '✅ Definida' : '❌ AUSENTE');
console.log('  TWILIO_FROM_NUMBER:', process.env.TWILIO_FROM_NUMBER || '❌ AUSENTE');
console.log('  TWILIO_API_KEY_SID:', process.env.TWILIO_API_KEY_SID ? '✅ Definida' : '⚠️ Não definida (opcional)');
console.log('  TWILIO_API_KEY_SECRET:', process.env.TWILIO_API_KEY_SECRET ? '✅ Definida' : '⚠️ Não definida (opcional)');

// Verificar se FROM_NUMBER tem o prefixo correto
const fromNumber = process.env.TWILIO_FROM_NUMBER;
if (fromNumber && !fromNumber.startsWith('whatsapp:')) {
  console.log('\n❌ ERRO: TWILIO_FROM_NUMBER deve começar com "whatsapp:"');
  console.log(`   Valor atual: ${fromNumber}`);
  console.log('   Valor correto: whatsapp:+14155238886');
  process.exit(1);
}

// Verificar se temos credenciais
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const apiKeySid = process.env.TWILIO_API_KEY_SID;
const apiKeySecret = process.env.TWILIO_API_KEY_SECRET;

const hasAuthToken = accountSid && authToken;
const hasApiKey = accountSid && apiKeySid && apiKeySecret;

if (!hasAuthToken && !hasApiKey) {
  console.log('\n❌ ERRO: Credenciais ausentes!');
  console.log('   Você precisa definir:');
  console.log('   - TWILIO_ACCOUNT_SID + TWILIO_AUTH_TOKEN');
  console.log('   OU');
  console.log('   - TWILIO_ACCOUNT_SID + TWILIO_API_KEY_SID + TWILIO_API_KEY_SECRET');
  process.exit(1);
}

console.log('\n✅ Todas as variáveis necessárias estão definidas!\n');

// 2. Criar cliente
console.log('🔧 Criando cliente Twilio...');
let client;
try {
  if (hasApiKey) {
    console.log('   Usando autenticação via API Key');
    client = Twilio(apiKeySid, apiKeySecret, { accountSid });
  } else {
    console.log('   Usando autenticação via Auth Token');
    client = Twilio(accountSid, authToken);
  }
  console.log('✅ Cliente criado com sucesso!\n');
} catch (error) {
  console.log('❌ Erro ao criar cliente:', error.message);
  process.exit(1);
}

// 3. Obter número de teste do argumento ou usar padrão
const testNumber = process.argv[2] || '5597981106749';
const toNumber = testNumber.startsWith('whatsapp:') 
  ? testNumber 
  : `whatsapp:+${testNumber.replace(/\D/g, '')}`;

console.log('📱 Teste de envio:');
console.log('   De:', fromNumber);
console.log('   Para:', toNumber);
console.log('   Mensagem: "🚀 Teste direto via script Node.js"');
console.log('\n⏳ Enviando...\n');

// 4. Enviar mensagem de teste
client.messages
  .create({
    from: fromNumber,
    to: toNumber,
    body: '🚀 Teste direto via script Node.js - Se você recebeu isso, a configuração está CORRETA!'
  })
  .then((message) => {
    console.log('✅ SUCESSO! Mensagem enviada!');
    console.log('\n📊 Detalhes:');
    console.log('   SID:', message.sid);
    console.log('   Status:', message.status);
    console.log('   De:', message.from);
    console.log('   Para:', message.to);
    console.log('   Data:', message.dateCreated);
    console.log('\n💡 Verifique seu WhatsApp agora!');
    console.log('\n🎉 Se a mensagem chegou, sua configuração está 100% correta!');
    console.log('   O problema pode estar no frontend da aplicação.');
  })
  .catch((error) => {
    console.log('❌ ERRO ao enviar mensagem:\n');
    console.log('   Código:', error.code);
    console.log('   Mensagem:', error.message);
    if (error.moreInfo) {
      console.log('   Mais info:', error.moreInfo);
    }
    
    // Diagnósticos comuns
    console.log('\n🔍 Diagnóstico:');
    
    if (error.code === 21211) {
      console.log('   ❌ Número "Para" inválido!');
      console.log('   - Verifique se o número está no formato: whatsapp:+5597981106749');
      console.log('   - Certifique-se que o número está cadastrado no Sandbox Twilio');
      console.log('   - Envie "join <código>" para +1 415 523 8886 via WhatsApp');
    } else if (error.code === 21606) {
      console.log('   ❌ Número "De" (FROM) inválido!');
      console.log('   - Verifique TWILIO_FROM_NUMBER:', fromNumber);
      console.log('   - Deve ser: whatsapp:+14155238886 (para sandbox)');
      console.log('   - Ou seu número verificado com prefixo whatsapp:');
    } else if (error.code === 20003) {
      console.log('   ❌ Credenciais inválidas!');
      console.log('   - Verifique TWILIO_ACCOUNT_SID');
      console.log('   - Verifique TWILIO_AUTH_TOKEN ou API Keys');
      console.log('   - Acesse: https://console.twilio.com');
    } else {
      console.log('   ⚠️ Erro desconhecido. Verifique a documentação Twilio.');
    }
    
    process.exit(1);
  });
