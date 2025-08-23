declare module 'nodemailer' {
		interface Transporter {
			sendMail(opts: Record<string, unknown>): Promise<unknown>;
		}
	interface CreateTransportOptions {
		host?: string; port?: number; secure?: boolean; auth?: { user: string; pass: string };
	}
	function createTransport(opts: CreateTransportOptions): Transporter;
	const _default: { createTransport: typeof createTransport };
	export { createTransport, Transporter };
	export default _default;
}