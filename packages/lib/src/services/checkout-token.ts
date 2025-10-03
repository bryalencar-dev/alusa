import { createSecretKey } from 'crypto';
import { SignJWT, jwtVerify } from 'jose';

const CHECKOUT_TOKEN_TTL_HOURS = 24;

export interface GenerateCheckoutTokenParams {
  matriculaId: string;
  checkoutLinkId: string;
  expiresInHours?: number;
}

export interface CheckoutTokenPayload {
  matriculaId: string;
  checkoutLinkId: string;
  exp: number;
  iat: number;
}

function getSecret() {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) throw new Error('NEXTAUTH_SECRET não configurado.');
  return createSecretKey(secret, 'utf-8');
}

export async function generateCheckoutToken(params: GenerateCheckoutTokenParams) {
  const now = Math.floor(Date.now() / 1000);
  const ttlHours = params.expiresInHours ?? CHECKOUT_TOKEN_TTL_HOURS;
  const exp = now + ttlHours * 60 * 60;

  const token = await new SignJWT({
    matriculaId: params.matriculaId,
    checkoutLinkId: params.checkoutLinkId,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt(now)
    .setExpirationTime(exp)
    .sign(getSecret());

  return {
    token,
    expiresAt: new Date(exp * 1000),
  };
}

export async function validateCheckoutToken(token: string): Promise<CheckoutTokenPayload> {
  try {
    const { payload, protectedHeader } = await jwtVerify(token, getSecret(), {
      algorithms: ['HS256'],
    });
    if (protectedHeader.alg !== 'HS256') {
      throw new Error('Algoritmo inválido.');
    }
    const matriculaId = payload.matriculaId;
    const checkoutLinkId = payload.checkoutLinkId;
    if (typeof matriculaId !== 'string' || typeof checkoutLinkId !== 'string') {
      throw new Error('Payload inválido.');
    }
    return {
      matriculaId,
      checkoutLinkId,
      exp: Number(payload.exp ?? 0),
      iat: Number(payload.iat ?? 0),
    };
  } catch (error) {
    const err = error as Error;
    throw new Error(`Checkout token inválido: ${err.message}`);
  }
}
