import Peer, { type DataConnection } from 'peerjs';
import { RoomHost, type RoomSnapshot } from '@tg/shared';

/**
 * Modo online sin servidor: el navegador de quien crea la sala ejecuta la sala (RoomHost) y los
 * demás se conectan a él por WebRTC (PeerJS, con su servidor público de señalización).
 * Ambos «sockets» imitan la parte de la API de Socket.IO que usa useOnline.
 */
export interface SockLike {
  connected: boolean;
  on(ev: string, h: (...a: any[]) => void): void;
  emit(ev: string, p?: unknown, cb?: (r: any) => void): void;
  timeout(ms: number): { emit(ev: string, p: unknown, cb: (err: unknown, r?: any) => void): void };
  removeAllListeners(): void;
  disconnect(): void;
}

const PEER_PREFIX = 'tensionglobal-v1-';
const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const hostKey = (code: string) => `tg-p2p-host-${code}`;

function rnd(n: number): Uint32Array {
  return crypto.getRandomValues(new Uint32Array(n));
}
const randomToken = () => Array.from(rnd(4), (x) => x.toString(16).padStart(8, '0')).join('');
const randomCode = () => Array.from(rnd(6), (x) => CODE_CHARS[x % CODE_CHARS.length]).join('');

export function loadHostRoom(code: string): RoomSnapshot | null {
  try {
    const raw = localStorage.getItem(hostKey(code));
    return raw ? (JSON.parse(raw) as RoomSnapshot) : null;
  } catch {
    return null;
  }
}

abstract class BaseSock implements SockLike {
  connected = false;
  private handlers = new Map<string, ((...a: any[]) => void)[]>();
  on(ev: string, h: (...a: any[]) => void) {
    this.handlers.set(ev, [...(this.handlers.get(ev) ?? []), h]);
  }
  protected fire(ev: string, ...args: unknown[]) {
    for (const h of this.handlers.get(ev) ?? []) h(...args);
  }
  removeAllListeners() {
    this.handlers.clear();
  }
  abstract emit(ev: string, p?: unknown, cb?: (r: any) => void): void;
  abstract disconnect(): void;
  timeout(ms: number) {
    return {
      emit: (ev: string, p: unknown, cb: (err: unknown, r?: any) => void) => {
        let done = false;
        const t = setTimeout(() => {
          if (!done) {
            done = true;
            cb(new Error('timeout'));
          }
        }, ms);
        this.emit(ev, p, (r) => {
          if (done) return;
          done = true;
          clearTimeout(t);
          cb(null, r);
        });
      },
    };
  }
}

/** Anfitrión: su navegador es la sala. */
class HostSocket extends BaseSock {
  private peer: Peer | null = null;
  private conns = new Map<string, DataConnection>();
  private room: RoomHost;
  private closed = false;

  constructor(private code: string, snap: RoomSnapshot | null) {
    super();
    this.room = new RoomHost(
      code,
      {
        send: (connId, ev, data) => {
          if (connId === 'host') queueMicrotask(() => this.fire(ev, data));
          else this.conns.get(connId)?.send({ k: 'ev', ev, d: data });
        },
        random: randomToken,
        seed: () => rnd(1)[0] | 0,
        persist: (s) => {
          try {
            localStorage.setItem(hostKey(this.code), JSON.stringify(s));
          } catch {
            /* almacenamiento lleno */
          }
        },
      },
      snap ?? undefined,
    );
    this.connected = true;
    queueMicrotask(() => this.fire('connect'));
    // Al cerrar o recargar la pestaña se libera el id en el servidor de señalización para poder retomarlo enseguida.
    addEventListener('pagehide', this.release);
    this.startPeer();
  }

  private release = () => this.peer?.destroy();

  private startPeer() {
    if (this.closed) return;
    const peer = new Peer(PEER_PREFIX + this.code, { debug: 0 });
    this.peer = peer;
    peer.on('connection', (conn) => {
      const id = `c${randomToken().slice(0, 10)}`;
      conn.on('open', () => this.conns.set(id, conn));
      conn.on('data', (raw) => {
        const msg = raw as { k: string; ev: string; p: unknown; id?: number };
        if (msg?.k !== 'emit' || typeof msg.ev !== 'string' || msg.ev === 'room:create') return;
        this.room.handle(id, msg.ev, msg.p, msg.id != null ? (r) => conn.send({ k: 'ack', id: msg.id, r }) : undefined);
      });
      const drop = () => {
        if (this.conns.get(id) === conn) {
          this.conns.delete(id);
          this.room.disconnect(id);
        }
      };
      conn.on('close', drop);
      conn.on('error', drop);
    });
    peer.on('disconnected', () => setTimeout(() => !peer.destroyed && !this.closed && peer.reconnect(), 2000));
    peer.on('error', (e: { type?: string }) => {
      // 'unavailable-id': el servidor de señalización aún guarda la sesión anterior de esta sala.
      if (['unavailable-id', 'network', 'server-error', 'socket-error', 'socket-closed'].includes(e?.type ?? '')) {
        peer.destroy();
        setTimeout(() => this.startPeer(), e?.type === 'unavailable-id' ? 2500 : 4000);
      }
    });
  }

  emit(ev: string, p?: unknown, cb?: (r: any) => void) {
    if (ev === 'room:create') {
      const r = this.room.create('host', p as { name: string; side: 'W' | 'E' });
      queueMicrotask(() => cb?.(r));
      return;
    }
    this.room.handle('host', ev, p, cb ? (r) => queueMicrotask(() => cb(r)) : undefined);
  }

  disconnect() {
    this.closed = true;
    this.connected = false;
    removeEventListener('pagehide', this.release);
    this.peer?.destroy();
  }
}

/** Invitado o espectador: se conecta al navegador del anfitrión. */
class GuestSocket extends BaseSock {
  private peer: Peer;
  private conn: DataConnection | null = null;
  private pending = new Map<number, (r: any) => void>();
  private seq = 0;
  private closed = false;
  private retry: ReturnType<typeof setTimeout> | null = null;

  constructor(private code: string) {
    super();
    this.peer = new Peer({ debug: 0 });
    this.peer.on('open', () => this.dial());
    this.peer.on('disconnected', () => setTimeout(() => !this.peer.destroyed && !this.closed && this.peer.reconnect(), 2000));
    this.peer.on('error', (e: { type?: string }) => {
      if (e?.type === 'peer-unavailable') {
        this.fire('connect_error', new Error('El anfitrión no está conectado: la sala solo está abierta mientras su pestaña siga abierta. Reintentando…'));
      }
      this.scheduleRetry();
    });
  }

  private dial() {
    if (this.closed || this.peer.disconnected || this.peer.destroyed) return;
    const conn = this.peer.connect(PEER_PREFIX + this.code, { reliable: true, serialization: 'json' });
    this.conn = conn;
    conn.on('open', () => {
      this.connected = true;
      this.fire('connect');
    });
    conn.on('data', (raw) => {
      const msg = raw as { k: string; ev?: string; d?: unknown; id?: number; r?: unknown };
      if (msg?.k === 'ev' && msg.ev) this.fire(msg.ev, msg.d);
      else if (msg?.k === 'ack' && msg.id != null) {
        this.pending.get(msg.id)?.(msg.r);
        this.pending.delete(msg.id);
      }
    });
    const lost = () => {
      if (this.conn !== conn) return;
      this.conn = null;
      if (this.connected) {
        this.connected = false;
        this.fire('disconnect');
      }
      this.scheduleRetry();
    };
    conn.on('close', lost);
    conn.on('error', lost);
  }

  private scheduleRetry() {
    if (this.closed || this.retry) return;
    this.retry = setTimeout(() => {
      this.retry = null;
      if (!this.connected) this.dial();
    }, 4000);
  }

  emit(ev: string, p?: unknown, cb?: (r: any) => void) {
    if (!this.conn || !this.connected) {
      cb?.({ ok: false, error: 'Sin conexión con el anfitrión' });
      return;
    }
    const id = cb ? ++this.seq : undefined;
    if (cb && id) this.pending.set(id, cb);
    this.conn.send({ k: 'emit', ev, p, id });
  }

  disconnect() {
    this.closed = true;
    this.connected = false;
    if (this.retry) clearTimeout(this.retry);
    this.peer.destroy();
  }
}

export type P2PRole = 'host' | 'guest';

export function makeP2PSocket(intent: { t: 'create' } | { t: 'join'; code: string }): { sock: SockLike; role: P2PRole } {
  if (intent.t === 'create') return { sock: new HostSocket(randomCode(), null), role: 'host' };
  const snap = loadHostRoom(intent.code);
  if (snap) return { sock: new HostSocket(intent.code, snap), role: 'host' };
  return { sock: new GuestSocket(intent.code), role: 'guest' };
}
