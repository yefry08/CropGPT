import { createRemoteJWKSet, jwtVerify } from 'jose';

/**
 * Verificación opcional de identidad con Neon Auth (Managed Better Auth).
 * Si NEON_AUTH_JWKS_URL no está definida, el servidor funciona sin cuentas (como antes).
 * Los JWT de Neon Auth son EdDSA (Ed25519) y caducan a los 15 minutos.
 */
const JWKS_URL = process.env.NEON_AUTH_JWKS_URL;
const ISSUER = process.env.NEON_AUTH_ISSUER; // opcional

export const authEnabled = !!JWKS_URL;
const jwks = JWKS_URL ? createRemoteJWKSet(new URL(JWKS_URL), { cooldownDuration: 30_000 }) : null;

export interface AuthUser {
  id: string;
  name: string;
}

export async function verifyToken(token: unknown): Promise<AuthUser | null> {
  if (!jwks || typeof token !== 'string' || token.length < 20 || token.length > 4096) return null;
  try {
    const { payload } = await jwtVerify(token, jwks, { algorithms: ['EdDSA'], ...(ISSUER ? { issuer: ISSUER } : {}) });
    if (typeof payload.sub !== 'string' || !payload.sub) return null;
    const raw = String(payload.name ?? (typeof payload.email === 'string' ? payload.email.split('@')[0] : '') ?? '');
    const name = raw.replace(/[\u0000-\u001f<>]/g, '').trim().slice(0, 20) || 'Jugador';
    return { id: payload.sub, name };
  } catch {
    return null;
  }
}
