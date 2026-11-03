// Prueba de integración del login: JWKS local falso + servidor real + clientes Socket.IO.
// Uso: npx tsx scripts/auth-check.ts
import { spawn } from 'node:child_process';
import http from 'node:http';
import { exportJWK, generateKeyPair, SignJWT } from 'jose';
import { io } from 'socket.io-client';

const { publicKey, privateKey } = await generateKeyPair('EdDSA', { crv: 'Ed25519' });
const other = await generateKeyPair('EdDSA', { crv: 'Ed25519' });
const jwk = { ...(await exportJWK(publicKey)), kid: 'k1', alg: 'EdDSA', use: 'sig' };
const jwks = http.createServer((_q, r) => r.setHeader('content-type', 'application/json').end(JSON.stringify({ keys: [jwk] }))).listen(4555);

const sign = (sub: string, name: string, key = privateKey, exp = '15m') =>
  new SignJWT({ name }).setProtectedHeader({ alg: 'EdDSA', kid: 'k1' }).setSubject(sub).setIssuedAt().setExpirationTime(exp).sign(key);

const srv = spawn('npx', ['tsx', 'src/index.ts'], { env: { ...process.env, PORT: '3055', NEON_AUTH_JWKS_URL: 'http://localhost:4555/jwks.json' }, stdio: 'ignore' });
await new Promise((r) => setTimeout(r, 3500));

const connect = (token?: string) =>
  new Promise<ReturnType<typeof io>>((res) => {
    const s = io('http://localhost:3055', { auth: token ? { token } : {}, transports: ['websocket'], forceNew: true });
    s.on('connect', () => res(s));
  });
const emit = (s: ReturnType<typeof io>, ev: string, p: unknown) => new Promise<any>((r) => s.emit(ev, p, r));

let fails = 0;
const check = (name: string, ok: boolean, extra?: unknown) => {
  console.log(`${ok ? 'OK ' : 'FALLO'} ${name}`, ok ? '' : extra ?? '');
  if (!ok) fails++;
};

const cfg = await (await fetch('http://localhost:3055/api/config')).json();
check('/api/config indica authRequired', cfg.authRequired === true, cfg);

const anon = await connect();
let r = await emit(anon, 'room:create', { name: 'x', side: 'W' });
check('crear sala sin sesión → rechazado', !r.ok && /sesión/i.test(r.error), r);

const bad = await connect(await sign('u1', 'Falso', other.privateKey));
r = await emit(bad, 'room:create', { name: 'x', side: 'W' });
check('token firmado con otra clave → rechazado', !r.ok, r);

const expired = await connect(await sign('u1', 'Caducado', privateKey, '-1m'));
r = await emit(expired, 'room:create', { name: 'x', side: 'W' });
check('token caducado → rechazado', !r.ok, r);

const ana = await connect(await sign('user-ana', 'Ana'));
r = await emit(ana, 'room:create', { name: 'IGNORADO', side: 'W' });
check('token válido → sala creada', r.ok && /^[A-Z2-9]{6}$/.test(r.code), r);
const code = r.code, tokenAna = r.token;
let info: any;
ana.on('room:info', (i) => (info = i));
r = await emit(ana, 'room:ready', { ready: false });
await new Promise((r) => setTimeout(r, 200));
check('el nombre sale de la cuenta, no del cliente', info?.seats?.W?.name === 'Ana', info?.seats);

const beto = await connect(await sign('user-beto', 'Beto'));
r = await emit(beto, 'room:join', { code, name: 'x', token: tokenAna });
check('otra cuenta no puede reclamar el asiento de Ana', !r.ok && /otra cuenta/.test(r.error), r);

const ana2 = await connect(await sign('user-ana', 'Ana'));
r = await emit(ana2, 'room:join', { code, name: 'x', token: tokenAna });
check('la misma cuenta recupera su asiento', r.ok && r.role === 'W', r);

r = await emit(anon, 'room:join', { code, name: 'x', spectator: true });
check('espectador sin sesión permitido', r.ok && r.role === 'spectator', r);
r = await emit(await connect(), 'room:join', { code, name: 'x' });
check('jugador sin sesión rechazado', !r.ok, r);

srv.kill();
jwks.close();
console.log(fails ? `\n${fails} comprobaciones fallaron` : '\nTodas las comprobaciones pasaron');
process.exit(fails ? 1 : 0);
