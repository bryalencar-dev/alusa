import { loadDecryptedAsaasCredentials } from '../packages/lib/src/asaas/credentials';
import { getAsaasBaseUrl } from '../packages/lib/src/asaas/env';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function restoreCustomer() {
  console.log('\n🔧 Tentando restaurar customer deletado...\n');

  const contaId = '254a5338-d76b-4099-aa87-7cab10f372e9';
  const customerId = 'cus_000007091272';

  try {
    const credentials = await loadDecryptedAsaasCredentials(contaId);

    if (!credentials?.apiKey) {
      console.log('❌ Credenciais não encontradas');
      return;
    }

    const baseUrl = getAsaasBaseUrl(credentials.apiKey);
    const apiUrl = `${baseUrl}/customers/${customerId}/restore`;

    console.log('🔗 Tentando restaurar customer...');
    console.log('   URL:', apiUrl);
    console.log('');

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        access_token: credentials.apiKey,
        'User-Agent': 'Alusa-Platform/1.0',
      },
    });

    if (!response.ok) {
      const text = await response.text();
      console.log('❌ Não foi possível restaurar');
      console.log('   Status:', response.status);
      console.log('   Resposta:', text);
      console.log('');
      console.log('💡 SOLUÇÃO: O customer está deletado e não pode ser restaurado.');
      console.log('   Você tem duas opções:');
      console.log('   1. Criar um novo aluno (com novo responsável)');
      console.log('   2. Alterar o email do responsável para criar um novo customer');
    } else {
      const data = await response.json();
      console.log('✅ Customer restaurado!');
      console.log(JSON.stringify(data, null, 2));
    }
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

restoreCustomer();
