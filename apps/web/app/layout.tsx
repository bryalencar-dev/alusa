import './globals.css';
import type { Metadata } from 'next';
import React from 'react';

export const metadata: Metadata = {
	title: 'Alusa Portal',
	description: 'Portal Alusa'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
	return (
		<html lang="pt-BR">
			<body style={{ margin: 0, background: '#f9fafb', color: '#111827', minHeight: '100vh' }}>{children}</body>
		</html>
	);
}
