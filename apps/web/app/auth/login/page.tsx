"use client";
// Rota canônica de login.
import LoginClient from '../../(auth)/login/client';

export default function LoginPage() {
	return (
		<div className="min-h-screen w-full flex items-center justify-center bg-[#3C0269]">
			<LoginClient />
		</div>
	);
}