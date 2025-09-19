"use client";
import { usePathname } from 'next/navigation';
import CardHeader from '@/components/layout/CardHeader';

export default function HeaderGate() {
  const pathname = usePathname();
  const showHeader = !pathname?.startsWith('/login');
  if (!showHeader) return null;
  return (
    <div>
  <CardHeader />
      <div className="h-16" />
    </div>
  );
}
