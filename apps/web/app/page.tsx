"use client";
import { Button } from '@alusa/ui';

export default function Home() {
  return (
    <main>
      <p className="mb-4">Setup inicial do monorepo Alusa.</p>
  <Button onClick={() => { alert('OK'); }}>Teste UI</Button>
    </main>
  );
}
