import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import * as NextAuthReact from 'next-auth/react';
import AdminDashboardPage from '@/app/admin/dashboard/page';

describe('AdminDashboardPage', () => {
  it('renderiza saudação com nome e role', () => {
    vi.spyOn(NextAuthReact, 'useSession').mockReturnValue({
      data: { user: { name: 'Teste User', role: 'ADMIN' } },
      status: 'authenticated',
      update: () => Promise.resolve({})
    } as unknown as ReturnType<typeof NextAuthReact.useSession>);
    render(<AdminDashboardPage />);
    expect(screen.getByTestId('dashboard-header').textContent).toContain('Teste User');
    expect(screen.getByTestId('dashboard-header').textContent).toContain('ADMIN');
  });
});
