declare module 'sonner' {
	import * as React from 'react';
		export interface ToasterProps { position?: string; richColors?: boolean; closeButton?: boolean; duration?: number }
	export const Toaster: React.FC<ToasterProps>;
	export interface ToastAPI {
		custom(renderer: (id: string) => React.ReactNode, opts?: { duration?: number }): string;
		dismiss(id?: string): void;
	}
	export const toast: ToastAPI;
}