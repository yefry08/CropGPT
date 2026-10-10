import { useState } from 'react';
import type { AILevel, Side, WarAILevel } from '@tg/shared';
import { loadSave } from '../hooks/useLocalGame';
import { P2P } from '../hooks/useOnline';
import { useAuth } from '../hooks/useAuth';
import { LangSwitch, useLang } from '../i18n';
import { RulesModal } from './Modals';
import { AccountBox } from './AccountBox';

const STATIC = import.meta.env.VITE_STATIC === '1';

export type Start =
  | { t: 'solo'; side: Side; level: AILevel; resume: boolean }
  | { t: 'create'; name: string; side: Side }
  | { t: 'join'; code: string; name: string; spectator: boolean }
  | { t: 'war'; level: WarAILevel };

export function Home({ onStart, initialCode }: { onStart: (s: Start) => void; initialCode?: string }) {
  const { tr } = useLang();
  const [side, setSide] = useState<Side>('W');
  const [level, setLevel] = useState<AILevel>('normal');
  const [warLevel, setWarLevel] = useState<WarAILevel>('normal');
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
    const n = auth.user?.name ?? (name.trim() || tr('Jugador', 'Player'));
    try {
      localStorage.setItem('tg-name', n);
    } catch {
      /* ignorar */
    }
    return n;
  };
  const codeOk = /^[A-Za-z0-9]{6}$/.test(code.trim());
  const LEVELS: [AILevel, string, string][] = [
    ['easy', tr('Fácil', 'Easy'), tr('Comete errores', 'Makes mistakes')],
    ['normal', 'Normal', tr('Equilibrada', 'Balanced')],
    ['hard', tr('Difícil', 'Hard'), tr('Analiza más a fondo', 'Thinks deeper')],
  ];

  return (
    <div className="home">
      <div className="home-top">
        <LangSwitch />
      </div>
      <div className="home-hero">
        <div className="home-kicker">{tr('SALA DE CRISIS · 1947 – 2026', 'CRISIS ROOM · 1947 – 2026')}</div>
        <h1>
          {tr('TENSIÓN', 'GLOBAL')} <span>{tr('GLOBAL', 'TENSION')}</span>
        </h1>
        <p>
          {tr(
            'Dos bloques, un mapa y un reloj nuclear. Reparte influencia, provoca golpes, activa eventos históricos y vigila la Tensión… y el Riesgo de la inteligencia artificial.',
            'Two blocs, one map and a nuclear clock. Spread influence, stage coups, trigger historical events and watch the Tension… and the Risk of artificial intelligence.',
          )}
        </p>
      </div>

      <div className="home-grid">
        <section className="panel">
          <h2>{tr('Un jugador', 'Single player')}</h2>
          <p className="muted">{tr('El juego completo de estrategia en el mapa, contra la IA.', 'The full strategy game on the map, against the AI.')}</p>
          <div className="seg" role="group" aria-label={tr('Bando', 'Side')}>
            <button className={side === 'W' ? 'on w' : 'w'} onClick={() => setSide('W')}>
              {tr('Occidente', 'West')}
            </button>
            <button className={side === 'E' ? 'on e' : 'e'} onClick={() => setSide('E')}>
              {tr('Bloque Oriental', 'Eastern Bloc')}
            </button>
          </div>
          <div className="seg" role="group" aria-label={tr('Dificultad', 'Difficulty')}>
            {LEVELS.map(([k, l, d]) => (
              <button key={k} className={level === k ? 'on' : ''} onClick={() => setLevel(k)} title={d}>
                {l}
              </button>
            ))}
          </div>
          <button className="primary big" onClick={() => onStart({ t: 'solo', side, level, resume: false })}>
            {tr('Comenzar partida', 'Start game')}
          </button>
          {save && (
            <button onClick={() => onStart({ t: 'solo', side: save.side, level: save.level, resume: true })}>
              {tr('Continuar partida guardada', 'Continue saved game')} ({tr('turno', 'turn')} {save.state.turn},{' '}
              {save.side === 'W' ? tr('Occidente', 'West') : tr('Oriental', 'Eastern')})
            </button>
          )}
          <button className="link" onClick={() => setRules(true)}>
            {tr('Cómo se juega', 'How to play')}
          </button>
        </section>

        <section className="panel war-panel">
          <h2>{tr('Guerra de cartas', 'Card War')}</h2>
          <p className="muted">
            {tr(
              'El clásico juego de cartas «Guerra», con decisiones: elige una carta de tu mano, gana la más fuerte y un empate desata una guerra. Cada carta es un conflicto futuro hipotético (2027–2040). Partidas de 5 minutos.',
              'The classic “War” card game, with decisions: pick a card from your hand, the strongest wins, and a tie sparks a war. Every card is a hypothetical future conflict (2027–2040). 5-minute games.',
            )}
          </p>
          <div className="seg" role="group" aria-label={tr('Dificultad', 'Difficulty')}>
            <button className={warLevel === 'easy' ? 'on' : ''} onClick={() => setWarLevel('easy')}>
              {tr('Fácil', 'Easy')}
            </button>
            <button className={warLevel === 'normal' ? 'on' : ''} onClick={() => setWarLevel('normal')}>
              Normal
            </button>
          </div>
          <button className="primary big" onClick={() => onStart({ t: 'war', level: warLevel })}>
            {tr('Jugar a la guerra de cartas', 'Play Card War')}
          </button>
        </section>

        {(!STATIC || P2P) && (
          <section className="panel">
            <h2>{tr('Online 1 contra 1', 'Online 1 vs 1')}</h2>
            {auth.enabled && !STATIC ? (
              <AccountBox auth={auth} />
            ) : (
              <label>
                {tr('Tu nombre', 'Your name')}
                <input value={name} maxLength={20} onChange={(e) => setName(e.target.value)} placeholder={tr('Jugador', 'Player')} />
              </label>
            )}
            <div className="row">
              <button className="w" disabled={needLogin} onClick={() => onStart({ t: 'create', name: nm(), side: 'W' })}>
                {tr('Crear sala · Occidente', 'Create room · West')}
              </button>
              <button className="e" disabled={needLogin} onClick={() => onStart({ t: 'create', name: nm(), side: 'E' })}>
                {tr('Crear sala · Oriental', 'Create room · Eastern')}
              </button>
            </div>
            <label>
              {tr('Código de sala', 'Room code')}
              <input value={code} maxLength={6} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="ABC123" className="code-input" autoCapitalize="characters" />
            </label>
            <div className="row">
              <button className="primary" disabled={!codeOk || needLogin} onClick={() => onStart({ t: 'join', code: code.trim().toUpperCase(), name: nm(), spectator: false })}>
                {tr('Unirse', 'Join')}
              </button>
              <button disabled={!codeOk} onClick={() => onStart({ t: 'join', code: code.trim().toUpperCase(), name: nm(), spectator: true })}>
                {tr('Ver como espectador', 'Watch as spectator')}
              </button>
            </div>
            {needLogin && <p className="muted">{tr('Inicia sesión para crear o unirte a una sala. Para mirar como espectador no hace falta.', 'Sign in to create or join a room. Spectators do not need to.')}</p>}
            {P2P && (
              <p className="muted">
                {tr(
                  'Sin servidor: tu navegador hospeda la sala que crees (mantén la pestaña abierta) y el otro jugador se conecta directamente a ti.',
                  'No server: your browser hosts the room you create (keep the tab open) and the other player connects directly to you.',
                )}
              </p>
            )}
            <p className="muted">
              {tr(
                'Cada jugador elige bando en la sala. Si te desconectas, la partida sigue y puedes volver con el mismo enlace.',
                'Each player picks a side in the room. If you disconnect, the game goes on and you can come back with the same link.',
              )}
            </p>
          </section>
        )}
      </div>

      <footer className="home-foot">
        <span>{tr('10 turnos · 5 eras · 20 PV para ganar al instante', '10 turns · 5 eras · 20 VP for an instant win')}</span>
      </footer>
      {rules && <RulesModal onClose={() => setRules(false)} />}
    </div>
  );
}
