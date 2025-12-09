'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { CustomToast } from '@/components/CustomToast';

interface CardData {
  holderName: string;
  number: string;
  expiryMonth: string;
  expiryYear: string;
  ccv: string;
}

interface UseCheckoutFormProps {
  token: string;
  onSuccess?: () => void;
}

export function useCheckoutForm({ token, onSuccess }: UseCheckoutFormProps) {
  const [loading, setLoading] = useState(false);
  const [cardData, setCardData] = useState<CardData>({
    holderName: '',
    number: '',
    expiryMonth: '',
    expiryYear: '',
    ccv: '',
  });

  const updateField = (field: keyof CardData, value: string) => {
    setCardData((prev) => ({ ...prev, [field]: value }));
  };

  const formatCardNumber = (value: string) => {
    const cleaned = value.replace(/\s/g, '');
    const groups = cleaned.match(/.{1,4}/g) || [];
    return groups.join(' ');
  };

  const formatExpiry = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length >= 2) {
      return cleaned.slice(0, 2) + '/' + cleaned.slice(2, 4);
    }
    return cleaned;
  };

  const handleCardNumberChange = (value: string) => {
    const cleaned = value.replace(/\s/g, '');
    if (cleaned.length <= 16) {
      updateField('number', cleaned);
    }
  };

  const handleExpiryChange = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length <= 4) {
      const month = cleaned.slice(0, 2);
      const year = cleaned.slice(2, 4);
      updateField('expiryMonth', month);
      updateField('expiryYear', year);
    }
  };

  const handleCcvChange = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length <= 4) {
      updateField('ccv', cleaned);
    }
  };

  const validate = (): string | null => {
    if (!cardData.holderName.trim()) {
      return 'Nome do titular é obrigatório';
    }
    if (cardData.number.length < 13 || cardData.number.length > 19) {
      return 'Número do cartão inválido';
    }
    if (!cardData.expiryMonth || !cardData.expiryYear) {
      return 'Data de validade inválida';
    }
    const month = parseInt(cardData.expiryMonth);
    if (month < 1 || month > 12) {
      return 'Mês de validade inválido';
    }
    if (!cardData.ccv || cardData.ccv.length < 3) {
      return 'CVV inválido';
    }
    return null;
  };

  const submit = async () => {
    // Validar
    const error = validate();
    if (error) {
      toast.custom(
        (t) => (
          <CustomToast
            variant="error"
            title="Dados inválidos"
            description={error}
            onClose={() => toast.dismiss(t)}
          />
        ),
        { duration: 4000 },
      );
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/checkout/${token}/process`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ cardData }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || result.details || 'Erro ao processar pagamento');
      }

      toast.custom(
        (t) => (
          <CustomToast
            variant="success"
            title="Pagamento processado!"
            description="Seu cartão foi cadastrado e o pagamento está sendo processado."
            onClose={() => toast.dismiss(t)}
          />
        ),
        { duration: 5000 },
      );
      onSuccess?.();
    } catch (err) {
      const error = err as Error;
      console.error('[Checkout Form] Erro:', error);
      toast.custom(
        (t) => (
          <CustomToast
            variant="error"
            title="Erro ao processar"
            description={
              error.message || 'Não foi possível processar o pagamento. Tente novamente.'
            }
            onClose={() => toast.dismiss(t)}
          />
        ),
        { duration: 6000 },
      );
    } finally {
      setLoading(false);
    }
  };

  return {
    cardData,
    loading,
    formatCardNumber,
    formatExpiry,
    handleCardNumberChange,
    handleExpiryChange,
    handleCcvChange,
    updateField,
    submit,
  };
}
