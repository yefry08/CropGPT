import { useCallback, useEffect, useRef, useState } from 'react';
import { io, type Socket } from 'socket.io-client';
import type { Action, ChatMsg, ClientToServer, GameState, JoinResult, Role, RoomInfo, ServerToClient, Side } from '@tg/shared';
import type { GameController } from './types';

type Sock = Socket<ServerToClient, ClientToServer>;

export type Intent =
  | { t: 'create'; name: string; side: Side }
  | { t: 'join'; code: string; name: string; spectator: boolean };

const tokenKey = (code: string) => `tg-token-${code}`;
export const getToken = (code: string): string | undefined => {
  try {
    return localStorage.getItem(tokenKey(code)) ?? undefined;
  } catch {
    return undefined;
  }
};
const setToken = (code: string, token: string) => {
  try {
    localStorage.setItem(tokenKey(code), token);
  } catch {
    /* ignorar */
  }
};
export const clearToken = (code: string) => {
  try {
    localStorage.removeItem(tokenKey(code));
  } catch {
    /* ignorar */
  }
};

export interface OnlineSession {
  status: 'connecting' | 'joined' | 'error';
  error: string | null;
  code: string | null;
  role: Role | null;
  info: (RoomInfo & { role: Role }) | null;
  connected: boolean;
  state: GameState | null;
  chat: ChatMsg[];
  chooseSide: (s: Side | null) => Promise<string | null>;
  setReady: (r: boolean) => Promise<string | null>;
  controller: GameController | null;
  leave: () => void;
}

/** Conexión con el servidor autoritativo. Guarda un token por sala para reconectar. */
export function useOnline(intent: Intent): OnlineSession {
  const [status, setStatus] = useState<OnlineSession['status']>('connecting');
  const [error, setError] = useState<string | null>(null);
  const [code, setCode] = useState<string | null>(intent.t === 'join' ? intent.code.toUpperCase() : null);
  const [role, setRole] = useState<Role | null>(null);
  const [info, setInfo] = useState<(RoomInfo & { role: Role }) | null>(null);
  const [connected, setConnected] = useState(false);
  const [state, setState] = useState<GameState | null>(null);
  const [chat, setChat] = useState<ChatMsg[]>([]);
  const sockRef = useRef<Sock | null>(null);
  const codeRef = useRef<string | null>(code);
  const nameRef = useRef(intent.name);
  const spectRef = useRef(intent.t === 'join' && intent.spectator);

  useEffect(() => {
    const sock: Sock = io({ transports: ['websocket', 'polling'], reconnectionDelay: 800, reconnectionDelayMax: 5000 });
    sockRef.current = sock;

    const handleJoin = (r: JoinResult) => {
      if (!r.ok) {
        setError(r.error ?? 'No se pudo entrar en la sala');
        setStatus('error');
        return;
      }
      codeRef.current = r.code!;
      setCode(r.code!);
      setRole(r.role ?? null);
      if (r.token && r.code) setToken(r.code, r.token);
      setStatus('joined');
      setError(null);
      const url = new URL(location.href);
      url.searchParams.set('sala', r.code!);
      if (r.role === 'spectator') url.searchParams.set('espectador', '1');
      else url.searchParams.delete('espectador');
      history.replaceState(null, '', url);
    };

    sock.on('connect', () => {
      setConnected(true);
      const c = codeRef.current;
      if (c) {
        // Reconexión (o primera unión a una sala existente) con el token guardado.
        sock.emit('room:join', { code: c, name: nameRef.current, token: getToken(c), spectator: spectRef.current }, handleJoin);
      } else if (intent.t === 'create') {
        sock.emit('room:create', { name: intent.name, side: intent.side }, handleJoin);
      }
    });
    sock.on('disconnect', () => setConnected(false));
    sock.on('connect_error', () => {
      setConnected(false);
    });
    sock.on('room:info', (i) => {
      setInfo(i);
      setRole(i.role);
    });
    sock.on('game:state', setState);
    sock.on('chat:history', setChat);
    sock.on('chat:msg', (m) => setChat((c) => [...c.slice(-99), m]));
    return () => {
      sock.removeAllListeners();
      sock.disconnect();
      sockRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const send = useCallback(async (action: Action): Promise<string | null> => {
    const s = sockRef.current;
    if (!s || !s.connected) return 'Sin conexión con el servidor';
    return new Promise((resolve) => {
      s.timeout(8000).emit('game:action', { action }, (err: unknown, r?: { ok: boolean; error?: string }) =>
        resolve(err || !r ? 'El servidor no responde' : r.ok ? null : r.error ?? 'Acción inválida'),
      );
    });
  }, []);

  const emitAck = useCallback(<E extends 'room:side' | 'room:ready'>(ev: E, payload: Parameters<ClientToServer[E]>[0]) => {
    const s = sockRef.current;
    if (!s || !s.connected) return Promise.resolve<string | null>('Sin conexión');
    return new Promise<string | null>((resolve) => {
      (s.timeout(8000) as unknown as { emit: (...a: unknown[]) => void }).emit(ev, payload, (err: unknown, r?: { ok: boolean; error?: string }) =>
        resolve(err || !r ? 'El servidor no responde' : r.ok ? null : r.error ?? 'Error'),
      );
    });
  }, []);

  const sendChat = useCallback((text: string) => sockRef.current?.emit('chat:send', { text }), []);

  const side: Side | null = role === 'W' || role === 'E' ? role : null;
  const controller: GameController | null =
    state && code
      ? { state, me: side, send, online: { code, info, connected, chat, sendChat } }
      : null;

  return {
    status,
    error,
    code,
    role,
    info,
    connected,
    state,
    chat,
    chooseSide: (s) => emitAck('room:side', { side: s }),
    setReady: (r) => emitAck('room:ready', { ready: r }),
    controller,
    leave: () => {
      if (codeRef.current) clearToken(codeRef.current);
    },
  };
}
