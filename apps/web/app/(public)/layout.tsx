import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Checkout - Alusa',
  description: 'Finalize o pagamento da sua matrícula',
};

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">{children}</div>
    </div>
  );
}
