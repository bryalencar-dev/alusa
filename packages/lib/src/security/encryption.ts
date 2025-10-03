// IMPLEMENTAÇÃO PROVISÓRIA:
// Para destravar desenvolvimento, usamos "ofuscação" base64 com prefixo.
// TODO: Substituir por AES-256-GCM com WebCrypto ou libs auditadas.

const PREFIX = 'v1:'; // facilita futura rotação

export function encryptSecret(plain: string): string {
  return PREFIX + Buffer.from(plain, 'utf8').toString('base64');
}

export function decryptSecret(encoded: string | null | undefined): string | null {
  if (!encoded) return null;
  if (!encoded.startsWith(PREFIX)) return null; // formato inesperado
  const b64 = encoded.slice(PREFIX.length);
  try {
    return Buffer.from(b64, 'base64').toString('utf8');
  } catch {
    return null;
  }
}
