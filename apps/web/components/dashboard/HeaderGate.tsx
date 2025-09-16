"use client";
import { usePathname } from 'next/navigation';
import Header from '@/components/dashboard/Header';

export default function HeaderGate() {
  const pathname = usePathname();
  const showHeader = !pathname?.startsWith('/auth/login');
  if (!showHeader) return null;
  return (
    <div>
      <Header />
      <div className="h-16" />
    </div>
  );
}
