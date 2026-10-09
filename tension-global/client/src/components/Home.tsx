import { useState } from 'react';
import type { AILevel, Side } from '@tg/shared';
import { loadSave } from '../hooks/useLocalGame';
import { useAuth } from '../hooks/useAuth';
import { RulesModal } from './Modals';
import { AccountBox } from './AccountBox';

const STATIC = import.meta.env.VITE_STATIC === '1';

export type Start =
  | { t: 'solo'; side: Side; level: AILevel; resume: boolean }
  | { t: 'create'; name: string; side: Side }
  | { t: 'join'; code: string; name: string; spectator: boolean };

const LEVELS: [AILevel, string, string][] = [
  ['easy', 'Fácil', 'Comete errores'],
  ['normal', 'Normal', 'Equilibrada'],
  ['hard', 'Difícil', 'Analiza más a fondo'],
];

export function Home({ onStart, initialCode }: { onStart: (s: Start) => void; initialCode?: string }) {
  const [side, setSide] = useState<Side>('W');
  const [level, setLevel] = useState<AILevel>('normal');
  const [name, setName] = useState(() => {
    try {
      return localStorage.getItem('tg-name') ?? '';
    } catch {
      return '';
    }
  });
  const [code, setCode] = useState(initialCode ?? '');
  const [rules, setRules] = useState(false);
  const auth = useAuth();
  const needLogin = !STATIC && auth.enabled && !auth.user;
  const save = loadSave();
  const nm = () => {
    const n = auth.user?.name ?? (name.trim() || 'Jugador');
    try {
      localStorage.setItem('tg-name', n);
    } catch {
      /* ignorar */
    }
    return n;
  };
  const codeOk = /^[A-Za-z0-9]{6}$/.test(code.trim());

  return (
    <div className="home">
      <div className="home-hero">
        <div className="home-kicker">SALA DE CRISIS · 1947 – 2026</div>
        <h1>
          TENSIÓN <span>GLOBAL</span>
        </h1>
        <p>
          Dos bloques, un mapa y un reloj nuclear. Reparte influencia, provoca golpes, activa eventos históricos y vigila la Tensión… y el Riesgo de la inteligencia
          artificial.
        </p>
      </div>

      <div className="home-grid">
        <section className="panel">
          <h2>Un jugador</h2>
          <div className="seg" role="group" aria-label="Bando">
            <button className={side === 'W' ? 'on w' : 'w'} onClick={() => setSide('W')}>
              Occidente
            </button>
            <button className={side === 'E' ? 'on e' : 'e'} onClick={() => setSide('E')}>
              Bloque Oriental
            </button>
          </div>
          <div className="seg" role="group" aria-label="Dificultad">
            {LEVELS.map(([k, l, d]) => (
              <button key={k} className={level === k ? 'on' : ''} onClick={() => setLevel(k)} title={d}>
                {l}
              </button>
            ))}
          </div>
          <button className="primary big" onClick={() => onStart({ t: 'solo', side, level, resume: false })}>
            Comenzar partida
          </button>
          {save && (
            <button onClick={() => onStart({ t: 'solo', side: save.side, level: save.level, resume: true })}>
              Continuar partida guardada (turno {save.state.turn}, {save.side === 'W' ? 'Occidente' : 'Oriental'})
            </button>
          )}
        </section>

        {!STATIC && (
        <section className="panel">
          <h2>Online 1 contra 1</h2>
          {auth.enabled ? (
            <AccountBox auth={auth} />
          ) : (
            <label>
              Tu nombre
              <input value={name} maxLength={20} onChange={(e) => setName(e.target.value)} placeholder="Jugador" />
            </label>
          )}
          <div className="row">
            <button className="w" disabled={needLogin} onClick={() => onStart({ t: 'create', name: nm(), side: 'W' })}>
              Crear sala · Occidente
            </button>
            <button className="e" disabled={needLogin} onClick={() => onStart({ t: 'create', name: nm(), side: 'E' })}>
              Crear sala · Oriental
            </button>
          </div>
          <label>
            Código de sala
            <input
              value={code}
              maxLength={6}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="ABC123"
              className="code-input"
              autoCapitalize="characters"
            />
          </label>
          <div className="row">
            <button className="primary" disabled={!codeOk || needLogin} onClick={() => onStart({ t: 'join', code: code.trim().toUpperCase(), name: nm(), spectator: false })}>
              Unirse
            </button>
            <button disabled={!codeOk} onClick={() => onStart({ t: 'join', code: code.trim().toUpperCase(), name: nm(), spectator: true })}>
              Ver como espectador
            </button>
          </div>
          {needLogin && <p className="muted">Inicia sesión para crear o unirte a una sala. Para mirar como espectador no hace falta.</p>}
          <p className="muted">Cada jugador elige bando en la sala. Si te desconectas, la partida sigue y puedes volver con el mismo enlace.</p>
        </section>
        )}
      </div>

      <footer className="home-foot">
        <button className="link" onClick={() => setRules(true)}>
          Cómo se juega
        </button>
        <span>10 turnos · 5 eras · 20 PV para ganar al instante</span>
      </footer>
      {rules && <RulesModal onClose={() => setRules(false)} />}
    </div>
  );
}
