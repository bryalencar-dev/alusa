import { loadDecryptedAsaasCredentials } from '../packages/lib/src/asaas/credentials';
import { getAsaasBaseUrl, isSandboxApiKey } from '../packages/lib/src/asaas/env';

async function checkCustomerInAsaas() {
  console.log('\n🔍 Buscando customer no Asaas...\n');

  const contaId = '254a5338-d76b-4099-aa87-7cab10f372e9'; // ID da conta Bryan Alencar
  const customerId = 'cus_000007091272';

  try {
    const credentials = await loadDecryptedAsaasCredentials(contaId);

    if (!credentials?.apiKey) {
      console.log('❌ Credenciais não encontradas');
      return;
    }

    const isSandbox = isSandboxApiKey(credentials.apiKey);
    const baseUrl = getAsaasBaseUrl(credentials.apiKey);
    const apiUrl = `${baseUrl}/customers/${customerId}`;

    console.log('🌐 URL:', apiUrl);
    console.log('🔑 Sandbox:', isSandbox ? 'SIM' : 'NÃO');
    console.log('');

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        access_token: credentials.apiKey,
        'User-Agent': 'Alusa-Platform/1.0',
      },
    });

    const data = await response.json();

    if (!response.ok) {
      console.log('❌ Customer NÃO existe no Asaas');
      console.log('   Status:', response.status);
      console.log('   Resposta:', JSON.stringify(data, null, 2));
      console.log('');
      console.log('🔧 SOLUÇÃO: Precisamos recriar o customer');
    } else {
      console.log('✅ Customer EXISTE no Asaas!');
      console.log('   ID:', data.id);
      console.log('   Nome:', data.name);
      console.log('   Email:', data.email);
      console.log('   CPF:', data.cpfCnpj);
      console.log('');
      console.log('📋 Resposta completa:');
      console.log(JSON.stringify(data, null, 2));
    }
  } catch (error) {
    console.error('❌ Erro ao buscar customer:', error);
  }
}

checkCustomerInAsaas();
