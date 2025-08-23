import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import LogoutButton from '../../app/portal/logout-button';

vi.mock('next-auth/react', () => ({ signOut: vi.fn() }));
import { signOut } from 'next-auth/react';

describe('LogoutButton', () => {
  it('chama signOut ao clicar', () => {
    const { getByText } = render(<LogoutButton />);
    fireEvent.click(getByText(/sair/i));
    expect(signOut).toHaveBeenCalled();
  });
});
