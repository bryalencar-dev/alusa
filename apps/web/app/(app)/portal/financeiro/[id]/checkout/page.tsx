import type { Metadata } from 'next';
import { PortalCheckoutFeature } from '@/features/portal/financeiro/PortalCheckoutFeature';

export const metadata: Metadata = {
  title: 'Checkout | Portal do Aluno',
  description: 'Finalize seu pagamento',
};

export default function PortalCheckoutPage({ params }: { params: { id: string } }) {
  return <PortalCheckoutFeature cobrancaId={params.id} />;
}






