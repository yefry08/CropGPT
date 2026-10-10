import type { Action, GameState, Side } from './types';

export type Role = Side | 'spectator' | 'pending';

export interface SeatInfo {
  name: string;
  connected: boolean;
  ready: boolean;
}

export interface RoomInfo {
  code: string;
  seats: Record<Side, SeatInfo | null>;
  started: boolean;
  spectators: number;
  /** Nombres de los presentes sin asiento. */
  waiting: string[];
}

export interface ChatMsg {
  id: number;
  at: number;
  name: string;
  role: Role;
  text: string;
}

export interface JoinResult {
  ok: boolean;
  error?: string;
  code?: string;
  token?: string;
  role?: Role;
}

/** Eventos cliente → servidor (con acuse). */
export interface ClientToServer {
  'room:create': (p: { name: string; side: Side }, cb: (r: JoinResult) => void) => void;
  'room:join': (p: { code: string; name: string; token?: string; spectator?: boolean }, cb: (r: JoinResult) => void) => void;
  'room:side': (p: { side: Side | null }, cb: (r: { ok: boolean; error?: string }) => void) => void;
  'room:ready': (p: { ready: boolean }, cb: (r: { ok: boolean; error?: string }) => void) => void;
  'game:action': (p: { action: Action }, cb: (r: { ok: boolean; error?: string }) => void) => void;
  'chat:send': (p: { text: string }) => void;
}

/** Eventos servidor → cliente. */
export interface ServerToClient {
  'room:info': (info: RoomInfo & { role: Role }) => void;
  'game:state': (state: GameState) => void;
  'chat:history': (msgs: ChatMsg[]) => void;
  'chat:msg': (msg: ChatMsg) => void;
}
