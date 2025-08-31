// Garante que callbackUrl seja um path interno seguro e opcionalmente força fallback.
// Impede open redirect e normaliza barra inicial.
export function safeRedirect(input: string | null | undefined, fallback = '/admin/dashboard'): string {
  if (!input) return fallback;
  try {
    // Rejeita URLs absolutas externas
    if (/^https?:\/\//i.test(input)) return fallback;
    // Deve começar com '/'
    if (!input.startsWith('/')) return fallback;
    // Evita //, /\\, ou tentativa de path traversal
    if (input.includes('..') || /\/\//.test(input)) return fallback;
    return input === '/' ? fallback : input;
  } catch {
    return fallback;
  }
}

export function nextParamToRedirect(param: string | null): string {
  return safeRedirect(param, '/admin/dashboard');
}