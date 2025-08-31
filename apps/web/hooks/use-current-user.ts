"use client";
// Hook: abstrai acesso ao usuário atual com tipagem forte e flags de estado.
import { useSession } from 'next-auth/react';

export interface CurrentUser {
  id: string;
  email: string;
  name: string;
  role: string;
  contaId: string | null;
}

export function useCurrentUser() {
  const { data, status } = useSession();
  const user = (data?.user as CurrentUser | undefined) ?? undefined;
  return {
    user,
    loading: status === 'loading',
    authenticated: status === 'authenticated',
    unauthenticated: status === 'unauthenticated'
  };
}

export default useCurrentUser;