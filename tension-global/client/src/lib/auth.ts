import { createAuthClient } from '@neondatabase/auth';
import { BetterAuthReactAdapter } from '@neondatabase/auth/react/adapters';

/**
 * Cliente de Neon Auth (Managed Better Auth). Solo existe si se define VITE_NEON_AUTH_URL
 * (la URL de Auth de la rama, p. ej. https://…neonauth…/neondb/auth). Sin ella no hay login.
 */
const URL_ = import.meta.env.VITE_NEON_AUTH_URL as string | undefined;
export const authClient = URL_ ? createAuthClient(URL_, { adapter: BetterAuthReactAdapter() }) : null;

/** JWT de 15 min para el servidor de partidas (se pide uno nuevo en cada conexión). */
export async function getAuthToken(): Promise<string | undefined> {
  if (!authClient) return undefined;
  try {
    const { data } = await authClient.token();
    return data?.token ?? undefined;
  } catch {
    return undefined;
  }
}
