import { applyAction, createGame } from './engine';
import type { ChatMsg, JoinResult, Role, RoomInfo } from './protocol';
import type { Action, GameState, Side } from './types';
import { viewFor } from './view';

/**
 * Lógica de una sala online independiente del transporte. La usa el anfitrión en modo P2P
 * (su navegador hace de servidor). Cada conexión se identifica con un `connId`.
 */
export interface RoomMember {
  token: string;
  name: string;
  conn: string | null;
  side: Side | null;
  spectator: boolean;
  ready: boolean;
}

export interface RoomSnapshot {
  code: string;
  members: RoomMember[];
  state: GameState | null;
  chat: ChatMsg[];
  chatSeq: number;
}

export interface RoomHostIO {
  send: (connId: string, ev: 'room:info' | 'game:state' | 'chat:history' | 'chat:msg', data: unknown) => void;
  /** Genera tokens y semillas (inyectado para poder testear). */
  random: () => string;
  seed: () => number;
  /** Se llama tras cada cambio (para guardar la sala). */
  persist?: (snap: RoomSnapshot) => void;
  now?: () => number;
}

type Ack = (r: unknown) => void;

const cleanName = (n: unknown): string => String(n ?? '').replace(/[\u0000-\u001f<>]/g, '').trim().slice(0, 20) || 'Jugador';

export class RoomHost {
  readonly code: string;
  private members = new Map<string, RoomMember>();
  private byConn = new Map<string, string>();
  state: GameState | null = null;
  private chat: ChatMsg[] = [];
  private chatSeq = 0;
  private lastChat = new Map<string, number>();

  constructor(code: string, private io: RoomHostIO, snap?: RoomSnapshot) {
    this.code = code;
    if (snap) {
      for (const m of snap.members) this.members.set(m.token, { ...m, conn: null });
      this.state = snap.state;
      this.chat = snap.chat;
      this.chatSeq = snap.chatSeq;
    }
  }

  snapshot(): RoomSnapshot {
    return { code: this.code, members: [...this.members.values()].map((m) => ({ ...m, conn: null })), state: this.state, chat: this.chat, chatSeq: this.chatSeq };
  }

  private save() {
    this.io.persist?.(this.snapshot());
  }

  private roleOf(m: RoomMember): Role {
    return m.spectator ? 'spectator' : m.side ?? 'pending';
  }

  private seat(side: Side): RoomMember | null {
    for (const m of this.members.values()) if (m.side === side && !m.spectator) return m;
    return null;
  }

  info(): RoomInfo {
    const seat = (s: Side) => {
      const m = this.seat(s);
      return m ? { name: m.name, connected: m.conn !== null, ready: m.ready } : null;
    };
    const all = [...this.members.values()];
    return {
      code: this.code,
      seats: { W: seat('W'), E: seat('E') },
      started: this.state !== null,
      spectators: all.filter((m) => m.spectator && m.conn).length,
      waiting: all.filter((m) => !m.spectator && !m.side && m.conn).map((m) => m.name),
    };
  }

  private sendInfo() {
    const base = this.info();
    for (const m of this.members.values()) if (m.conn) this.io.send(m.conn, 'room:info', { ...base, role: this.roleOf(m) });
  }

  private sendState(only?: RoomMember) {
    if (!this.state) return;
    for (const m of only ? [only] : this.members.values()) {
      if (m.conn) this.io.send(m.conn, 'game:state', viewFor(this.state, m.spectator ? null : m.side));
    }
  }

  private pushChat(name: string, role: Role, text: string) {
    const msg: ChatMsg = { id: ++this.chatSeq, at: (this.io.now ?? Date.now)(), name, role, text };
    this.chat.push(msg);
    if (this.chat.length > 100) this.chat.shift();
    for (const m of this.members.values()) if (m.conn) this.io.send(m.conn, 'chat:msg', msg);
  }

  private attach(connId: string, m: RoomMember) {
    if (m.conn && m.conn !== connId) this.byConn.delete(m.conn);
    m.conn = connId;
    this.byConn.set(connId, m.token);
    this.sendInfo();
    this.io.send(connId, 'chat:history', this.chat);
    this.sendState(m);
  }

  private memberOf(connId: string): RoomMember | null {
    const t = this.byConn.get(connId);
    return t ? this.members.get(t) ?? null : null;
  }

  /** Crea el asiento del anfitrión (solo la primera vez). */
  create(connId: string, p: { name: string; side: Side }): JoinResult {
    const side: Side = p?.side === 'E' ? 'E' : 'W';
    const m: RoomMember = { token: this.io.random(), name: cleanName(p?.name), conn: null, side, spectator: false, ready: false };
    this.members.set(m.token, m);
    this.attach(connId, m);
    this.save();
    return { ok: true, code: this.code, token: m.token, role: side };
  }

  join(connId: string, p: { code?: string; name: string; token?: string; spectator?: boolean }): JoinResult {
    let m = p?.token ? this.members.get(p.token) : undefined;
    if (m) {
      m.name = cleanName(p.name || m.name);
    } else {
      const spectator = !!p?.spectator || this.state !== null;
      m = { token: this.io.random(), name: cleanName(p?.name), conn: null, side: null, spectator, ready: false };
      this.members.set(m.token, m);
      if (spectator) this.pushChat('Sistema', 'spectator', `${m.name} mira la partida como espectador.`);
    }
    this.attach(connId, m);
    this.save();
    return { ok: true, code: this.code, token: m.token, role: this.roleOf(m) };
  }

  handle(connId: string, ev: string, p: any, ack?: Ack) {
    const reply = (r: unknown) => ack?.(r);
    if (ev === 'room:join') return reply(this.join(connId, p ?? {}));
    const m = this.memberOf(connId);
    if (!m) return reply({ ok: false, error: 'No estás en la sala' });
    switch (ev) {
      case 'room:side': {
        if (this.state) return reply({ ok: false, error: 'La partida ya empezó' });
        if (m.spectator) return reply({ ok: false, error: 'Eres espectador' });
        const side: Side | null = p?.side === 'W' || p?.side === 'E' ? p.side : null;
        if (side) {
          const o = this.seat(side);
          if (o && o.token !== m.token) return reply({ ok: false, error: 'Ese bando ya está elegido' });
        }
        m.side = side;
        m.ready = false;
        this.sendInfo();
        this.save();
        return reply({ ok: true });
      }
      case 'room:ready': {
        if (this.state) return reply({ ok: false, error: 'La partida ya empezó' });
        if (!m.side) return reply({ ok: false, error: 'Elige un bando primero' });
        m.ready = !!p?.ready;
        reply({ ok: true });
        this.sendInfo();
        const w = this.seat('W');
        const e = this.seat('E');
        if (w && e && w.ready && e.ready) {
          this.state = createGame(this.io.seed());
          this.pushChat('Sistema', 'spectator', 'La partida ha comenzado. El Bloque Oriental juega primero.');
          this.sendInfo();
          this.sendState();
        }
        this.save();
        return;
      }
      case 'game:action': {
        if (!this.state) return reply({ ok: false, error: 'La partida no ha empezado' });
        if (!m.side || m.spectator) return reply({ ok: false, error: 'Los espectadores no pueden jugar' });
        try {
          this.state = applyAction(this.state, m.side, p?.action as Action);
          reply({ ok: true });
          this.sendState();
          if (this.state.phase === 'over') this.sendInfo();
          this.save();
        } catch (e) {
          reply({ ok: false, error: e instanceof Error ? e.message : 'Acción inválida' });
        }
        return;
      }
      case 'chat:send': {
        const now = (this.io.now ?? Date.now)();
        if (now - (this.lastChat.get(connId) ?? 0) < 400) return;
        this.lastChat.set(connId, now);
        const text = String(p?.text ?? '').replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, 300);
        if (!text) return;
        this.pushChat(m.name, this.roleOf(m), text);
        this.save();
        return;
      }
      default:
        return reply({ ok: false, error: 'Evento desconocido' });
    }
  }

  disconnect(connId: string) {
    const m = this.memberOf(connId);
    this.byConn.delete(connId);
    if (!m || m.conn !== connId) return;
    m.conn = null;
    if (!this.state && m.spectator) this.members.delete(m.token);
    if (!m.spectator && m.side) this.pushChat('Sistema', 'spectator', `${m.name} se desconectó. La partida sigue; puede reconectarse.`);
    this.sendInfo();
    this.save();
  }
}
