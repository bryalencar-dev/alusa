/**
 * Script para testar sincronização de cartão do Asaas
 * 
 * Uso: npx tsx scripts/test-sync-cartao.ts
 */

import { PrismaClient } from '@prisma/client';
import { getCustomer, getSubscription, getPayment } from '../packages/lib/src/asaas';

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Testando Sincronização de Cartão do Asaas\n');

  // 1. Buscar responsável com assinatura ativa
  const responsavel = await prisma.responsavel.findFirst({
    where: {
      asaasCustomerId: {
        not: null,
      },
      matriculasFinanceiras: {
        some: {
          status: 'ATIVA',
          asaasSubscriptionId: {
            not: null,
          }
        }
      }
    },
    include: {
      matriculasFinanceiras: {
        where: {
          status: 'ATIVA',
          asaasSubscriptionId: {
            not: null,
          }
        },
        take: 1,
        include: {
          aluno: {
            select: {
              nome: true,
              contaId: true,
            }
          },
          cobrancas: {
            where: {
              status: 'PAGO',
              asaasPaymentId: {
                not: null,
              }
            },
            orderBy: {
              dataPagamento: 'desc',
            },
            take: 1,
          }
        }
      }
    }
  });

  if (!responsavel) {
    console.log('❌ Nenhum responsável com assinatura ativa encontrado');
    return;
  }

  console.log('✅ Responsável encontrado:');
  console.log(`   Nome: ${responsavel.nome}`);
  console.log(`   Customer ID: ${responsavel.asaasCustomerId}`);
  console.log(`   Cartão salvo: ${responsavel.asaasCreditCardToken ? '✅ SIM' : '❌ NÃO'}`);
  
  if (responsavel.asaasCreditCardToken) {
    console.log(`   - Bandeira: ${responsavel.creditCardBrand}`);
    console.log(`   - Últimos 4: ${responsavel.creditCardLast4}`);
  }
  
  console.log('');

  const matricula = responsavel.matriculasFinanceiras[0];
  if (!matricula) {
    console.log('❌ Nenhuma matrícula ativa encontrada');
    return;
  }

  console.log('✅ Matrícula encontrada:');
  console.log(`   Aluno: ${matricula.aluno.nome}`);
  console.log(`   Subscription ID: ${matricula.asaasSubscriptionId}`);
  console.log('');

  // 2. Buscar subscription no Asaas
  try {
    const subscription = await getSubscription(matricula.asaasSubscriptionId!, {
      contaId: matricula.aluno.contaId
    });

    console.log('✅ Subscription no Asaas:');
    console.log(`   Billing Type: ${subscription.billingType}`);
    console.log(`   Status: ${subscription.status}`);
    console.log('');
  } catch (error: any) {
    console.error('❌ Erro ao buscar subscription:', error.message);
  }

  // 3. Buscar customer no Asaas
  try {
    const customer = await getCustomer(responsavel.asaasCustomerId!, {
      contaId: matricula.aluno.contaId
    });

    console.log('✅ Customer no Asaas:');
    console.log(`   Nome: ${customer.name}`);
    console.log(`   Tem cartão: ${customer.creditCard ? '✅ SIM' : '❌ NÃO'}`);
    
    if (customer.creditCard) {
      console.log(`   - Token: ${customer.creditCard.creditCardToken}`);
      console.log(`   - Bandeira: ${customer.creditCard.creditCardBrand}`);
      console.log(`   - Últimos 4: ${customer.creditCard.creditCardNumber}`);
    }
    console.log('');
  } catch (error: any) {
    console.error('❌ Erro ao buscar customer:', error.message);
  }

  // 4. Buscar payment da última cobrança paga
  if (matricula.cobrancas && matricula.cobrancas.length > 0) {
    const cobranca = matricula.cobrancas[0];
    
    console.log('✅ Última cobrança paga:');
    console.log(`   ID: ${cobranca.id}`);
    console.log(`   Status: ${cobranca.status}`);
    console.log(`   Forma: ${cobranca.formaPagamento}`);
    console.log(`   Payment ID: ${cobranca.asaasPaymentId}`);
    console.log('');

    try {
      const payment = await getPayment(cobranca.asaasPaymentId!, {
        contaId: matricula.aluno.contaId
      });

      console.log('✅ Payment no Asaas:');
      console.log(`   Billing Type: ${payment.billingType}`);
      console.log(`   Status: ${payment.status}`);
      
      const paymentData = payment as any;
      console.log(`   Tem dados de cartão: ${paymentData.creditCard || paymentData.creditCardBrand ? '✅ SIM' : '❌ NÃO'}`);
      
      if (paymentData.creditCard || paymentData.creditCardBrand) {
        console.log(`   - Bandeira: ${paymentData.creditCardBrand || paymentData.creditCard?.brand}`);
        console.log(`   - Últimos 4: ${paymentData.creditCardNumber || paymentData.creditCard?.number}`);
        console.log(`   - Token: ${paymentData.creditCardToken || 'N/A'}`);
      }
      console.log('');
    } catch (error: any) {
      console.error('❌ Erro ao buscar payment:', error.message);
    }
  } else {
    console.log('⚠️  Nenhuma cobrança paga encontrada');
  }

  console.log('\n📊 Resumo:');
  console.log('==================================');
  console.log(`Cartão no banco local: ${responsavel.asaasCreditCardToken ? '✅' : '❌'}`);
  console.log(`Precisa sincronizar: ${!responsavel.asaasCreditCardToken ? '✅' : '❌'}`);
  console.log('');
  console.log('💡 Para sincronizar, acesse: /conta/forma-pagamento');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());






