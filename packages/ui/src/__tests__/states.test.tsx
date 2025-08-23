import React from 'react';
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { LoadingSkeleton, ErrorState, EmptyState } from '@alusa/ui';

describe('UI States Components', () => {
  it('renders LoadingSkeleton', () => {
    const { container } = render(<LoadingSkeleton variant="card" />);
    expect(container.firstChild).toBeTruthy();
  });
  it('renders ErrorState', () => {
    const { getByRole } = render(<ErrorState message="Erro" />);
    expect(getByRole('alert')).toBeTruthy();
  });
  it('renders EmptyState', () => {
    const { getByRole } = render(<EmptyState title="Nada" message="Vazio" />);
    expect(getByRole('status')).toBeTruthy();
  });
});
