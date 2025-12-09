/**
 * @vitest-environment jsdom
 */

/* eslint-disable @typescript-eslint/no-unused-vars */
import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import {
  StatusBadge,
  isStatusPaid,
  isStatusPending,
  isStatusOverdue,
  isStatusFailed,
} from '@/components/ui/status-badge';

describe('StatusBadge', () => {
  describe('Rendering', () => {
    it('deve renderizar badge com status CONFIRMED', () => {
      render(<StatusBadge status="CONFIRMED" />);
      expect(screen.getByText('Pagamento Confirmado')).toBeInTheDocument();
    });

    it('deve renderizar badge com status PENDING', () => {
      render(<StatusBadge status="PENDING" />);
      expect(screen.getByText('Aguardando Pagamento')).toBeInTheDocument();
    });

    it('deve renderizar badge com status OVERDUE', () => {
      render(<StatusBadge status="OVERDUE" />);
      expect(screen.getByText('Atrasado')).toBeInTheDocument();
    });

    it('deve renderizar badge com status FAILED', () => {
      render(<StatusBadge status="FAILED" />);
      expect(screen.getByText('Falha no Pagamento')).toBeInTheDocument();
    });

    it('deve renderizar badge com status REFUNDED', () => {
      render(<StatusBadge status="REFUNDED" />);
      expect(screen.getByText('Reembolsado')).toBeInTheDocument();
    });

    it('deve renderizar badge com status CANCELED', () => {
      render(<StatusBadge status="CANCELED" />);
      expect(screen.getByText('Cancelado')).toBeInTheDocument();
    });

    it('deve renderizar badge com status MANUAL', () => {
      render(<StatusBadge status="MANUAL" />);
      expect(screen.getByText('Pago Manualmente')).toBeInTheDocument();
    });
  });

  describe('Acessibilidade', () => {
    it('deve ter aria-label correto', () => {
      const { container } = render(<StatusBadge status="CONFIRMED" />);
      const badge = container.querySelector('span[aria-label]');
      expect(badge).toHaveAttribute('aria-label', 'Pagamento Confirmado');
    });

    it('deve ter ícone com aria-hidden', () => {
      const { container } = render(<StatusBadge status="CONFIRMED" showIcon />);
      const icon = container.querySelector('svg[aria-hidden]');
      expect(icon).toHaveAttribute('aria-hidden', 'true');
    });
  });

  describe('Ícones', () => {
    it('deve exibir ícone por padrão', () => {
      const { container } = render(<StatusBadge status="CONFIRMED" />);
      const icon = container.querySelector('svg');
      expect(icon).toBeInTheDocument();
    });

    it('deve ocultar ícone quando showIcon=false', () => {
      const { container } = render(<StatusBadge status="CONFIRMED" showIcon={false} />);
      const icon = container.querySelector('svg');
      expect(icon).not.toBeInTheDocument();
    });
  });

  describe('Tamanhos', () => {
    it('deve renderizar tamanho padrão', () => {
      const { container } = render(<StatusBadge status="CONFIRMED" />);
      const badge = container.querySelector('span');
      expect(badge).toHaveClass('px-2.5', 'py-0.5', 'text-xs');
    });

    it('deve renderizar tamanho small', () => {
      const { container } = render(<StatusBadge status="CONFIRMED" size="sm" />);
      const badge = container.querySelector('span');
      expect(badge).toHaveClass('px-2', 'py-0.5', 'text-[10px]');
    });

    it('deve renderizar tamanho large', () => {
      const { container } = render(<StatusBadge status="CONFIRMED" size="lg" />);
      const badge = container.querySelector('span');
      expect(badge).toHaveClass('px-3', 'py-1', 'text-sm');
    });
  });

  describe('Classes CSS', () => {
    it('deve ter classes de cor verde para CONFIRMED', () => {
      const { container } = render(<StatusBadge status="CONFIRMED" />);
      const badge = container.querySelector('span');
      expect(badge).toHaveClass('bg-emerald-100', 'text-emerald-700', 'border-emerald-300');
    });

    it('deve ter classes de cor amarela para PENDING', () => {
      const { container } = render(<StatusBadge status="PENDING" />);
      const badge = container.querySelector('span');
      expect(badge).toHaveClass('bg-yellow-100', 'text-yellow-700', 'border-yellow-300');
    });

    it('deve ter classes de cor vermelha para OVERDUE', () => {
      const { container } = render(<StatusBadge status="OVERDUE" />);
      const badge = container.querySelector('span');
      expect(badge).toHaveClass('bg-red-100', 'text-red-700', 'border-red-300');
    });

    it('deve aceitar classes personalizadas', () => {
      const { container } = render(<StatusBadge status="CONFIRMED" className="custom-class" />);
      const badge = container.querySelector('span');
      expect(badge).toHaveClass('custom-class');
    });
  });

  describe('Status em português', () => {
    it('deve renderizar PAGO corretamente', () => {
      render(<StatusBadge status="PAGO" />);
      expect(screen.getByText('Pago')).toBeInTheDocument();
    });

    it('deve renderizar PENDENTE corretamente', () => {
      render(<StatusBadge status="PENDENTE" />);
      expect(screen.getByText('Pendente')).toBeInTheDocument();
    });

    it('deve renderizar ATRASADO corretamente', () => {
      render(<StatusBadge status="ATRASADO" />);
      expect(screen.getByText('Atrasado')).toBeInTheDocument();
    });

    it('deve renderizar CANCELADO corretamente', () => {
      render(<StatusBadge status="CANCELADO" />);
      expect(screen.getByText('Cancelado')).toBeInTheDocument();
    });
  });
});

describe('Helper Functions', () => {
  describe('isStatusPaid', () => {
    it('deve retornar true para status pagos', () => {
      expect(isStatusPaid('CONFIRMED')).toBe(true);
      expect(isStatusPaid('RECEIVED')).toBe(true);
      expect(isStatusPaid('PAGO')).toBe(true);
      expect(isStatusPaid('MANUAL')).toBe(true);
      expect(isStatusPaid('RECEIVED_IN_CASH')).toBe(true);
    });

    it('deve retornar false para status não pagos', () => {
      expect(isStatusPaid('PENDING')).toBe(false);
      expect(isStatusPaid('OVERDUE')).toBe(false);
      expect(isStatusPaid('FAILED')).toBe(false);
      expect(isStatusPaid('CANCELED')).toBe(false);
    });
  });

  describe('isStatusPending', () => {
    it('deve retornar true para status pendentes', () => {
      expect(isStatusPending('PENDING')).toBe(true);
      expect(isStatusPending('PENDENTE')).toBe(true);
    });

    it('deve retornar false para status não pendentes', () => {
      expect(isStatusPending('CONFIRMED')).toBe(false);
      expect(isStatusPending('OVERDUE')).toBe(false);
      expect(isStatusPending('FAILED')).toBe(false);
    });
  });

  describe('isStatusOverdue', () => {
    it('deve retornar true para status atrasados', () => {
      expect(isStatusOverdue('OVERDUE')).toBe(true);
      expect(isStatusOverdue('ATRASADO')).toBe(true);
    });

    it('deve retornar false para status não atrasados', () => {
      expect(isStatusOverdue('CONFIRMED')).toBe(false);
      expect(isStatusOverdue('PENDING')).toBe(false);
      expect(isStatusOverdue('FAILED')).toBe(false);
    });
  });

  describe('isStatusFailed', () => {
    it('deve retornar true para status de falha', () => {
      expect(isStatusFailed('FAILED')).toBe(true);
    });

    it('deve retornar false para status sem falha', () => {
      expect(isStatusFailed('CONFIRMED')).toBe(false);
      expect(isStatusFailed('PENDING')).toBe(false);
      expect(isStatusFailed('OVERDUE')).toBe(false);
    });
  });
});
