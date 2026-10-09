import { randomBytes, randomInt } from 'node:crypto';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import express from 'express';
import { Server, type Socket } from 'socket.io';
import {
  applyAction,
  createGame,
  viewFor,
  type Action,
  type ChatMsg,
  type ClientToServer,
  type GameState,
  type JoinResult,
  type Role,
  type RoomInfo,
  type ServerToClient,
  type Side,
} from '@tg/shared';

interface Member {
  token: string;
  name: string;
  sid: string | null;
  side: Side | null;
  spectator: boolean;
  ready: boolean;
}

interface Room {
  code: string;
  members: Map<string, Member>;
  state: GameState | null;
  chat: ChatMsg[];
  chatSeq: number;
  lastActive: number;
}

const PORT = Number(process.env.PORT ?? 3001);
const rooms = new Map<string, Room>();
const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

const app = express();
app.disable('x-powered-by');
app.get('/healthz', (_req, res) => res.json({ ok: true, rooms: rooms.size }));

const candidates = [process.env.STATIC_DIR, path.resolve(process.cwd(), 'dist/public'), path.resolve(process.cwd(), '../dist/public'), path.resolve(process.cwd(), '../client/dist')].filter(
  (x): x is string => !!x,
);
const staticDir = candidates.find((d) => fs.existsSync(path.join(d, 'index.html')));
if (staticDir) {
  app.use(express.static(staticDir, { maxAge: '1h', index: false }));
  app.get('*', (_req, res) => res.sendFile(path.join(staticDir, 'index.html')));
} else {
  app.get('/', (_req, res) => res.type('text').send('Servidor de Tensión Global en marcha. Compila el cliente con `npm run build`.'));
}

const server = http.createServer(app);
const io = new Server<ClientToServer, ServerToClient>(server, {
  cors: { origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : true },
  maxHttpBufferSize: 1e5,
});

// ——— Utilidades ———
function newCode(): string {
  for (let i = 0; i < 50; i++) {
    let c = '';
    for (let j = 0; j < 6; j++) c += CODE_CHARS[randomInt(CODE_CHARS.length)];
    if (!rooms.has(c)) return c;
  }
  throw new Error('sin códigos libres');
}

const cleanName = (n: unknown): string => String(n ?? '').replace(/[\u0000-\u001f<>]/g, '').trim().slice(0, 20) || 'Jugador';

function roleOf(m: Member): Role {
  return m.spectator ? 'spectator' : m.side ?? 'pending';
}

function seatOf(room: Room, side: Side): Member | null {
  for (const m of room.members.values()) if (m.side === side && !m.spectator) return m;
  return null;
}

function info(room: Room): RoomInfo {
  const seat = (s: Side) => {
    const m = seatOf(room, s);
    return m ? { name: m.name, connected: m.sid !== null, ready: m.ready } : null;
  };
  return {
    code: room.code,
    seats: { W: seat('W'), E: seat('E') },
    started: room.state !== null,
    spectators: [...room.members.values()].filter((m) => m.spectator && m.sid).length,
    waiting: [...room.members.values()].filter((m) => !m.spectator && !m.side && m.sid).map((m) => m.name),
  };
}

function sendInfo(room: Room) {
  const base = info(room);
  for (const m of room.members.values()) if (m.sid) io.to(m.sid).emit('room:info', { ...base, role: roleOf(m) });
}

function sendState(room: Room, only?: Member) {
  if (!room.state) return;
  const targets = only ? [only] : [...room.members.values()];
  for (const m of targets) {
    if (!m.sid) continue;
    io.to(m.sid).emit('game:state', viewFor(room.state, m.spectator ? null : m.side));
  }
}

function pushChat(room: Room, name: string, role: Role, text: string) {
  const msg: ChatMsg = { id: ++room.chatSeq, at: Date.now(), name, role, text };
  room.chat.push(msg);
  if (room.chat.length > 100) room.chat.shift();
  for (const m of room.members.values()) if (m.sid) io.to(m.sid).emit('chat:msg', msg);
}

function attach(socket: Socket<ClientToServer, ServerToClient>, room: Room, m: Member) {
  m.sid = socket.id;
  socket.data.code = room.code;
  socket.data.token = m.token;
  void socket.join(room.code);
  room.lastActive = Date.now();
  sendInfo(room);
  socket.emit('chat:history', room.chat);
  sendState(room, m);
}

function maybeStart(room: Room) {
  if (room.state) return;
  const w = seatOf(room, 'W');
  const e = seatOf(room, 'E');
  if (w && e && w.ready && e.ready) {
    room.state = createGame(randomBytes(4).readInt32LE(0));
    pushChat(room, 'Sistema', 'spectator', 'La partida ha comenzado. El Bloque Oriental juega primero.');
    sendInfo(room);
    sendState(room);
  }
}

function find(socket: Socket<ClientToServer, ServerToClient>): { room: Room; m: Member } | null {
  const room = rooms.get(socket.data.code as string);
  const m = room?.members.get(socket.data.token as string);
  return room && m ? { room, m } : null;
}

// ——— Sockets ———
io.on('connection', (socket) => {
  socket.on('room:create', (p, cb) => {
    try {
      const side: Side = p?.side === 'E' ? 'E' : 'W';
      const code = newCode();
      const room: Room = { code, members: new Map(), state: null, chat: [], chatSeq: 0, lastActive: Date.now() };
      const m: Member = { token: randomBytes(16).toString('hex'), name: cleanName(p?.name), sid: null, side, spectator: false, ready: false };
      room.members.set(m.token, m);
      rooms.set(code, room);
      attach(socket, room, m);
      cb({ ok: true, code, token: m.token, role: side });
    } catch (e) {
      cb({ ok: false, error: 'No se pudo crear la sala' });
    }
  });

  socket.on('room:join', (p, cb) => {
    const code = String(p?.code ?? '').toUpperCase().trim();
    const room = rooms.get(code);
    if (!room) return cb({ ok: false, error: 'La sala no existe o ha caducado' });
    let m = p.token ? room.members.get(p.token) : undefined;
    if (m) {
      // Reconexión: el asiento se conserva.
      if (m.sid && m.sid !== socket.id) io.sockets.sockets.get(m.sid)?.disconnect(true);
      m.name = cleanName(p.name || m.name);
    } else {
      const spectator = !!p.spectator || room.state !== null;
      m = { token: randomBytes(16).toString('hex'), name: cleanName(p.name), sid: null, side: null, spectator, ready: false };
      room.members.set(m.token, m);
      if (spectator) pushChat(room, 'Sistema', 'spectator', `${m.name} mira la partida como espectador.`);
    }
    attach(socket, room, m);
    const res: JoinResult = { ok: true, code, token: m.token, role: roleOf(m) };
    cb(res);
  });

  socket.on('room:side', (p, cb) => {
    const f = find(socket);
    if (!f) return cb({ ok: false, error: 'No estás en una sala' });
    const { room, m } = f;
    if (room.state) return cb({ ok: false, error: 'La partida ya empezó' });
    if (m.spectator) return cb({ ok: false, error: 'Eres espectador' });
    const side = p?.side === 'W' || p?.side === 'E' ? p.side : null;
    if (side) {
      const other = seatOf(room, side);
      if (other && other.token !== m.token) return cb({ ok: false, error: 'Ese bando ya está elegido' });
    }
    m.side = side;
    m.ready = false;
    sendInfo(room);
    cb({ ok: true });
  });

  socket.on('room:ready', (p, cb) => {
    const f = find(socket);
    if (!f) return cb({ ok: false, error: 'No estás en una sala' });
    const { room, m } = f;
    if (room.state) return cb({ ok: false, error: 'La partida ya empezó' });
    if (!m.side) return cb({ ok: false, error: 'Elige un bando primero' });
    m.ready = !!p?.ready;
    cb({ ok: true });
    sendInfo(room);
    maybeStart(room);
  });

  socket.on('game:action', (p, cb) => {
    const f = find(socket);
    if (!f) return cb({ ok: false, error: 'No estás en una sala' });
    const { room, m } = f;
    if (!room.state) return cb({ ok: false, error: 'La partida no ha empezado' });
    if (!m.side || m.spectator) return cb({ ok: false, error: 'Los espectadores no pueden jugar' });
    try {
      room.state = applyAction(room.state, m.side, p.action as Action);
      room.lastActive = Date.now();
      cb({ ok: true });
      sendState(room);
      if (room.state.phase === 'over') sendInfo(room);
    } catch (e) {
      cb({ ok: false, error: e instanceof Error ? e.message : 'Acción inválida' });
    }
  });

  let lastChat = 0;
  socket.on('chat:send', (p) => {
    const f = find(socket);
    if (!f) return;
    const now = Date.now();
    if (now - lastChat < 400) return;
    lastChat = now;
    const text = String(p?.text ?? '').replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, 300);
    if (!text) return;
    f.room.lastActive = now;
    pushChat(f.room, f.m.name, roleOf(f.m), text);
  });

  socket.on('disconnect', () => {
    const f = find(socket);
    if (!f) return;
    const { room, m } = f;
    if (m.sid === socket.id) {
      m.sid = null;
      if (!room.state && m.spectator) room.members.delete(m.token);
      if (!m.spectator && m.side) pushChat(room, 'Sistema', 'spectator', `${m.name} se desconectó. La partida sigue; puede reconectarse.`);
      sendInfo(room);
    }
  });
});

// Limpieza de salas abandonadas.
setInterval(() => {
  const now = Date.now();
  for (const [code, room] of rooms) {
    const anyone = [...room.members.values()].some((m) => m.sid);
    const idle = now - room.lastActive;
    if ((!anyone && idle > 30 * 60_000) || idle > 12 * 3600_000) rooms.delete(code);
  }
}, 5 * 60_000).unref();

server.listen(PORT, () => console.log(`Tensión Global escuchando en el puerto ${PORT}${staticDir ? ` (cliente: ${staticDir})` : ''}`));
