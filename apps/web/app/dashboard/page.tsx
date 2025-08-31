import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
// Redireciona legado /dashboard para o novo dashboard admin
import { redirect } from 'next/navigation';

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  redirect('/admin/dashboard');
  return (
    <div className="p-8" data-testid="dashboard">
      <h1 className="text-xl font-semibold" data-testid="dashboard-header">Olá, {session?.user.name} (role: {session?.user.role})</h1>
    </div>
  );
}