import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import RegisterPage from './page';
import { redirect } from 'next/navigation';
import { nextParamToRedirect } from '@/lib/safe-redirect';

// Wrapper server-side para redirecionar se autenticado antes de renderizar o client component
export default async function RegisterServer({ searchParams }: { searchParams: { next?: string } }) {
  const session = await getServerSession(authOptions);
  if (session?.user) {
    redirect(nextParamToRedirect(searchParams.next ?? null));
  }
  return <RegisterPage />;
}
