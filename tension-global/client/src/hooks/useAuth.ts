import { useCallback, useEffect, useState } from 'react';
import { authClient } from '../lib/auth';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
}

export interface AuthState {
  enabled: boolean;
  loading: boolean;
  user: AuthUser | null;
  signIn: (email: string, password: string) => Promise<string | null>;
  signUp: (name: string, email: string, password: string) => Promise<string | null>;
  signOut: () => Promise<void>;
}

const msg = (e: unknown): string => (e as { message?: string } | null)?.message ?? 'No se pudo completar la operación';

export function useAuth(): AuthState {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(!!authClient);

  const refresh = useCallback(async () => {
    if (!authClient) return;
    try {
      const { data } = await authClient.getSession();
      const u = data?.user;
      setUser(u ? { id: u.id, name: u.name || u.email.split('@')[0], email: u.email } : null);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return {
    enabled: !!authClient,
    loading,
    user,
    signIn: async (email, password) => {
      if (!authClient) return 'El login no está configurado';
      try {
        const { error } = await authClient.signIn.email({ email, password });
        if (error) return msg(error);
        await refresh();
        return null;
      } catch (e) {
        return msg(e);
      }
    },
    signUp: async (name, email, password) => {
      if (!authClient) return 'El login no está configurado';
      try {
        const { error } = await authClient.signUp.email({ email, password, name });
        if (error) return msg(error);
        await refresh();
        return null;
      } catch (e) {
        return msg(e);
      }
    },
    signOut: async () => {
      try {
        await authClient?.signOut();
      } finally {
        setUser(null);
      }
    },
  };
}
