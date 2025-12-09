'use client';

import { Button } from '@/components/ui/button';
import { useCheckoutForm } from './use-checkout-form';

interface CreditCardFormProps {
  token: string;
  isMensalidade: boolean;
  onSuccess: () => void;
}

export function CreditCardForm({ token, isMensalidade, onSuccess }: CreditCardFormProps) {
  const form = useCheckoutForm({ token, onSuccess });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await form.submit();
  };

  // Calcular valor formatado do expiry
  const expiryValue = form.cardData.expiryMonth
    ? `${form.cardData.expiryMonth}${form.cardData.expiryYear ? '/' + form.cardData.expiryYear : ''}`
    : '';

  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
      <h3 className="font-semibold text-slate-900">Dados do Cartão de Crédito</h3>
      <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
        <div>
          <label className="block text-sm font-medium text-slate-700">Número do cartão</label>
          <input
            type="text"
            value={form.formatCardNumber(form.cardData.number)}
            onChange={(e) => form.handleCardNumberChange(e.target.value)}
            placeholder="0000 0000 0000 0000"
            maxLength={19}
            disabled={form.loading}
            className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm placeholder-slate-400 focus:border-brand-accent focus:outline-none focus:ring-1 focus:ring-brand-accent disabled:bg-slate-100 disabled:cursor-not-allowed"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700">Validade</label>
            <input
              type="text"
              value={expiryValue}
              onChange={(e) => form.handleExpiryChange(e.target.value)}
              placeholder="MM/AA"
              maxLength={5}
              disabled={form.loading}
              className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm placeholder-slate-400 focus:border-brand-accent focus:outline-none focus:ring-1 focus:ring-brand-accent disabled:bg-slate-100 disabled:cursor-not-allowed"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">CVV</label>
            <input
              type="text"
              value={form.cardData.ccv}
              onChange={(e) => form.handleCcvChange(e.target.value)}
              placeholder="000"
              maxLength={4}
              disabled={form.loading}
              className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm placeholder-slate-400 focus:border-brand-accent focus:outline-none focus:ring-1 focus:ring-brand-accent disabled:bg-slate-100 disabled:cursor-not-allowed"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Nome no cartão</label>
          <input
            type="text"
            value={form.cardData.holderName}
            onChange={(e) => form.updateField('holderName', e.target.value)}
            placeholder="Nome conforme impresso no cartão"
            disabled={form.loading}
            className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm placeholder-slate-400 focus:border-brand-accent focus:outline-none focus:ring-1 focus:ring-brand-accent disabled:bg-slate-100 disabled:cursor-not-allowed"
          />
        </div>
        <Button className="w-full" type="submit" disabled={form.loading}>
          {form.loading
            ? 'Processando...'
            : isMensalidade
              ? 'Cadastrar Cartão'
              : 'Finalizar Pagamento'}
        </Button>
      </form>
    </div>
  );
}
