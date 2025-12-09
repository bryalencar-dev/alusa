import { PrismaClient } from '@prisma/client';
import { createAsaasCustomer } from '../packages/lib/src/integrations/asaas/asaas-customer.service';

const prisma = new PrismaClient();

async function recreateCustomer() {
  console.log('\n🔧 Recriando customer no Asaas...\n');

  // Buscar responsável
  const responsavel = await prisma.responsavel.findFirst({
    where: {
      nome: { contains: 'Vera', mode: 'insensitive' },
    },
  });

  if (!responsavel) {
    console.log('❌ Responsável não encontrado');
    await prisma.$disconnect();
    return;
  }

  console.log('👥 Responsável:', responsavel.nome);
  console.log('📄 CPF:', responsavel.cpf);
  console.log('📧 Email:', responsavel.email);
  console.log('💳 Customer ID atual (deletado):', responsavel.asaasCustomerId);
  console.log('');

  try {
    // Limpar o customer ID antigo (deletado)
    await prisma.responsavel.update({
      where: { id: responsavel.id },
      data: { asaasCustomerId: null },
    });

    console.log('✅ Customer ID antigo removido do banco');
    console.log('');

    // Recriar customer no Asaas
    const customerData = {
      name: responsavel.nome,
      email: responsavel.email,
      cpfCnpj: responsavel.cpf.replace(/\D/g, ''),
      phone: responsavel.telefone?.replace(/\D/g, '') || undefined,
      mobilePhone: responsavel.telefone?.replace(/\D/g, '') || undefined,
      postalCode: responsavel.enderecoCep?.replace(/\D/g, ''),
      address: responsavel.enderecoLogradouro || undefined,
      addressNumber: responsavel.enderecoNumero || undefined,
      complement: responsavel.enderecoComplemento || undefined,
      province: responsavel.enderecoBairro || undefined,
      city: responsavel.enderecoCidade || undefined,
      state: responsavel.enderecoUf || undefined,
      externalReference: `responsavel-${responsavel.id}`,
    };

    console.log('📤 Criando novo customer...');

    const contaId = '254a5338-d76b-4099-aa87-7cab10f372e9'; // Bryan Alencar
    const customer = await createAsaasCustomer(
      customerData,
      contaId,
      `responsavel-${responsavel.id}-recreate-${Date.now()}`, // Nova idempotency key
      'RESPONSAVEL',
      responsavel.id,
    );

    console.log('');
    console.log('✅ Customer recriado com sucesso!');
    console.log('   Novo Customer ID:', customer.id);
    console.log('   Nome:', customer.name);
    console.log('   Email:', customer.email);
    console.log('');

    // Atualizar responsável com novo ID
    await prisma.responsavel.update({
      where: { id: responsavel.id },
      data: { asaasCustomerId: customer.id },
    });

    console.log('✅ Banco de dados atualizado com novo Customer ID');
    console.log('');
    console.log('🎉 Pronto! Agora o customer deve aparecer no Asaas');
    console.log('   Acesse: https://sandbox.asaas.com/customerAccount/list');
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

recreateCustomer();
