"use client";
import { signOut } from 'next-auth/react';

export default function LogoutButton() {
  return (
    <button
      onClick={() => { void signOut({ callbackUrl: '/auth/login' }); }}
      className="text-sm border px-3 py-1 rounded hover:bg-gray-50 transition-colors"
      data-testid="logout-btn"
    >
      Sair
    </button>
  );
}