import { describe, expect, it } from 'vitest';
import { RoomHost, type RoomSnapshot } from '../src/room';
import { CARD } from '../src/cards';

function setup() {
  const sent: { conn: string; ev: string; data: any }[] = [];
  let n = 0;
  let snap: RoomSnapshot | null = null;
  const room = new RoomHost('ABC234', {
    send: (conn, ev, data) => sent.push({ conn, ev, data }),
    random: () => `tok${++n}`,
    seed: () => 42,
    persist: (s) => (snap = s),
  });
  const last = (conn: string, ev: string) => [...sent].reverse().find((x) => x.conn === conn && x.ev === ev)?.data;
  const call = (conn: string, ev: string, p: unknown) => {
    let r: any;
    room.handle(conn, ev, p, (x) => (r = x));
    return r;
  };
  return { room, sent, last, call, snap: () => snap };
}

describe('sala P2P (RoomHost)', () => {
  it('crea, une, elige bando, empieza y cada uno ve solo su mano', () => {
    const { room, last, call } = setup();
    const host = room.create('h', { name: 'Ana', side: 'W' });
    expect(host).toMatchObject({ ok: true, role: 'W' });
    const g = call('g', 'room:join', { code: 'ABC234', name: 'Beto' });
    expect(g.role).toBe('pending');
    expect(call('g', 'room:side', { side: 'W' }).ok).toBe(false); // ocupado
    expect(call('g', 'room:side', { side: 'E' }).ok).toBe(true);
    call('h', 'room:ready', { ready: true });
    call('g', 'room:ready', { ready: true });
    expect(room.state).not.toBeNull();
    const vh = last('h', 'game:state');
    const vg = last('g', 'game:state');
    expect(vh.hands.W.every((c: string) => !!CARD[c])).toBe(true);
    expect(vh.hands.E.every((c: string) => c === '?')).toBe(true);
    expect(vg.hands.E.every((c: string) => !!CARD[c])).toBe(true);
    expect(vg.hands.W.every((c: string) => c === '?')).toBe(true);
  });

  it('valida turnos y reconecta con el token', () => {
    const { room, last, call } = setup();
    room.create('h', { name: 'Ana', side: 'W' });
    const g = call('g', 'room:join', { name: 'Beto' });
    call('g', 'room:side', { side: 'E' });
    call('h', 'room:ready', { ready: true });
    call('g', 'room:ready', { ready: true });
    const wCard = last('h', 'game:state').hands.W[0];
    expect(call('h', 'game:action', { action: { type: 'playOps', card: wCard, kind: 'influence' } }).error).toMatch(/turno/);
    room.disconnect('g');
    expect(last('h', 'room:info').seats.E.connected).toBe(false);
    const again = call('g2', 'room:join', { name: 'Beto', token: g.token });
    expect(again.role).toBe('E');
    expect(last('g2', 'game:state').hands.E.length).toBe(7);
  });

  it('espectadores no ven manos ni pueden jugar; la sala se puede restaurar', () => {
    const { room, last, call, snap } = setup();
    room.create('h', { name: 'Ana', side: 'W' });
    call('g', 'room:join', { name: 'Beto' });
    call('g', 'room:side', { side: 'E' });
    call('h', 'room:ready', { ready: true });
    call('g', 'room:ready', { ready: true });
    const s = call('s', 'room:join', { name: 'Eva', spectator: true });
    expect(s.role).toBe('spectator');
    const vs = last('s', 'game:state');
    expect([...vs.hands.W, ...vs.hands.E].every((c: string) => c === '?')).toBe(true);
    expect(call('s', 'game:action', { action: { type: 'skipOps' } }).ok).toBe(false);
    const restored = new RoomHost('ABC234', { send: () => {}, random: () => 'x', seed: () => 1 }, snap()!);
    expect(restored.state?.turn).toBe(1);
    expect(restored.info().seats.W?.name).toBe('Ana');
  });
});
