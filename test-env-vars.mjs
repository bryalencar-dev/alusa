/**
 * Script para testar carregamento de variáveis de ambiente
 */

console.log('=== TESTE DE VARIÁVEIS DE AMBIENTE ===\n');

// Verificar se .env.local foi carregado
console.log('1. Variáveis ASAAS_*:');
console.log('   ASAAS_BASE_URL:', process.env.ASAAS_BASE_URL || '❌ AUSENTE');
console.log('   ASAAS_API_KEY:', process.env.ASAAS_API_KEY ? `✅ PRESENTE (${process.env.ASAAS_API_KEY.substring(0, 20)}...)` : '❌ AUSENTE');
console.log('   ASAAS_WEBHOOK_SECRET:', process.env.ASAAS_WEBHOOK_SECRET ? `✅ PRESENTE (${process.env.ASAAS_WEBHOOK_SECRET.length} chars)` : '❌ AUSENTE');
console.log('   FEATURE_ASAAS:', process.env.FEATURE_ASAAS || '❌ AUSENTE');

console.log('\n2. Todas as variáveis que começam com ASAAS_:');
Object.keys(process.env)
  .filter(key => key.startsWith('ASAAS_'))
  .forEach(key => {
    const value = process.env[key];
    const masked = value && value.length > 20 
      ? `${value.substring(0, 10)}...${value.substring(value.length - 10)}`
      : value;
    console.log(`   ${key}: ${masked}`);
  });

console.log('\n3. Carregamento do .env.local:');
console.log('   Next.js carrega automaticamente arquivos .env*');
console.log('   Este script (Node.js puro) NÃO carrega .env.local automaticamente');
console.log('   Para testar, use: node -r dotenv/config test-env-vars.mjs\n');
