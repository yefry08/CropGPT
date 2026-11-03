import { ERA_EN, ERA_INFO, MAX_CAP, TECH_MIN_OPS, TECH_NAMES, TECH_NAMES_EN, TURN_YEAR, actingSide, type GameState, type Side } from '@tg/shared';
import { LangSwitch, useLang } from '../i18n';

function Pips({ n, total, cls, title }: { n: number; total: number; cls: string; title?: (i: number) => string }) {
  return (
    <span className="pips">
      {Array.from({ length: total }, (_, i) => (
        <i key={i} className={`pip ${cls}${i < n ? ' on' : ''}`} title={title?.(i)} />
      ))}
    </span>
  );
}

export function TopBar({
  state,
  me,
  sound,
  onSound,
  onHelp,
  onMenu,
  onDrawer,
}: {
  state: GameState;
  me: Side | null;
  sound: boolean;
  onSound: () => void;
  onHelp: () => void;
  onMenu: () => void;
  onDrawer: () => void;
}) {
  const { lang, tr } = useLang();
  const techNames = lang === 'en' ? TECH_NAMES_EN : TECH_NAMES;
  const eraTitle = lang === 'en' ? ERA_EN[state.era].title : ERA_INFO[state.era].title;
  const year = state.phase === 'over' ? 2026 : TURN_YEAR[state.turn];
  const vp = state.vp;
  const pct = ((vp + 20) / 40) * 100;
  const t = state.tension;
  const acting = actingSide(state);
  const next = (s: Side) => (state.tech[s] < 8 ? `${techNames[state.tech[s]]} (${TECH_MIN_OPS[state.tech[s]]}+ ops)` : tr('completa', 'complete'));
  const aiOn = state.era >= 4;
  const blocked = [
    { k: tr('Europa', 'Europe'), on: t <= 4 },
    { k: 'Asia', on: t <= 3 },
    { k: tr('M. Oriente', 'Mid. East'), on: t <= 2 },
  ];
  const sideLabel = (s: Side) => (s === 'W' ? tr('Occidente', 'West') : tr('Oriental', 'Eastern'));
  return (
    <header className="topbar">
      <div className="tb-brand">
        <button className="tb-title" onClick={onMenu} title={tr('Volver al menú', 'Back to menu')}>
          {tr('TENSIÓN', 'GLOBAL')} <b>{tr('GLOBAL', 'TENSION')}</b>
        </button>
        <div className="tb-era">
          <span className="tb-year">{year}</span>
          <span className="tb-eraname">
            {tr('Era', 'Era')} {state.era} · {eraTitle}
          </span>
        </div>
        <div className="tb-turn">
          <span>
            {tr('Turno', 'Turn')} <b>{state.turn}</b>/10
          </span>
          <span>
            {tr('Ronda', 'Round')} <b>{state.round}</b>/6
          </span>
          <span className={`turn-side ${acting === 'W' ? 'w' : 'e'}`}>
            {state.phase === 'over' ? tr('Fin', 'Over') : `${tr('Juega', 'Playing:')} ${sideLabel(acting)}${me === acting ? tr(' (tú)', ' (you)') : ''}`}
          </span>
        </div>
      </div>

      <div className="tb-block vpbox" title={tr('Puntos de victoria: 20 inmediatos o liderar al final de 2026', 'Victory points: 20 wins at once, or lead at the end of 2026')}>
        <div className="tb-label">{tr('PV', 'VP')}</div>
        <div className="vpbar">
          <div className="vpmid" />
          <div className="vpmark" style={{ left: `${pct}%` }}>
            <span>{vp > 0 ? `+${vp}` : vp}</span>
          </div>
          <div className="vpscale">
            <span>−20</span>
            <span>0</span>
            <span>+20</span>
          </div>
        </div>
        <div className="vp-names">
          <span className="e">{tr('Oriental', 'Eastern')}</span>
          <span className="w">{tr('Occidente', 'West')}</span>
        </div>
      </div>

      <div className="tb-block tension" title={tr('Tensión nuclear: 5 calma → 1 guerra. Sube 1 al inicio de cada turno.', 'Nuclear Tension: 5 calm → 1 war. Rises 1 at the start of each turn.')}>
        <div className="tb-label">{tr('TENSIÓN', 'TENSION')}</div>
        <div className="tcells">
          {[5, 4, 3, 2, 1].map((n) => (
            <span key={n} className={`tcell t${n}${n === t ? ' cur' : ''}`}>
              {n}
            </span>
          ))}
        </div>
        <div className="tblocks">
          {blocked.map((b) => (
            <span key={b.k} className={b.on ? 'bl on' : 'bl'} title={b.on ? tr(`Sin golpes en ${b.k}`, `No coups in ${b.k}`) : tr(`Golpes permitidos en ${b.k}`, `Coups allowed in ${b.k}`)}>
              {b.on ? '✕' : '✓'} {b.k}
            </span>
          ))}
        </div>
      </div>

      <div className="tb-block tech" title={tr('Carrera tecnológica (8 hitos)', 'Technology race (8 milestones)')}>
        <div className="tb-label">{tr('TECNOLOGÍA', 'TECHNOLOGY')}</div>
        <div className="trow w">
          <span>{tr('O', 'W')}</span>
          <Pips n={state.tech.W} total={8} cls="w" title={(i) => techNames[i]} />
        </div>
        <div className="trow e">
          <span>{tr('B', 'E')}</span>
          <Pips n={state.tech.E} total={8} cls="e" title={(i) => techNames[i]} />
        </div>
        <div className="tnext" title={`${sideLabel('W')}: ${next('W')} · ${sideLabel('E')}: ${next('E')}`}>
          {tr('Sig.:', 'Next:')} {next(me ?? 'W')}
        </div>
      </div>

      <div
        className={`tb-block ai${aiOn ? '' : ' off'}`}
        title={tr('Riesgo de IA (0–10, activo desde 1991) y Capacidad de IA de cada bando (0–5)', 'AI Risk (0–10, active from 1991) and each side’s AI Capability (0–5)')}
      >
        <div className="tb-label">{tr('IA', 'AI')}</div>
        <div className="riskbar">
          {Array.from({ length: 10 }, (_, i) => (
            <i key={i} className={`rk${i < state.risk && aiOn ? ' on' : ''}${i >= 7 ? ' hot' : ''}`} />
          ))}
        </div>
        <div className="riskval">{aiOn ? `${tr('Riesgo', 'Risk')} ${state.risk}${state.risk >= 8 ? ' ⚠' : ''}` : tr('Riesgo: desde 1991', 'Risk: from 1991')}</div>
        <div className="caps">
          <span className="w">
            {tr('Cap. O', 'Cap. W')} <Pips n={state.cap.W} total={MAX_CAP} cls="w" />
          </span>
          <span className="e">
            {tr('Cap. B', 'Cap. E')} <Pips n={state.cap.E} total={MAX_CAP} cls="e" />
          </span>
        </div>
      </div>

      <div className="tb-actions">
        <LangSwitch />
        <button onClick={onSound} title={tr('Sonido', 'Sound')} aria-label={tr('Sonido', 'Sound')}>
          {sound ? '🔊' : '🔇'}
        </button>
        <button onClick={onHelp} title={tr('Reglas', 'Rules')} aria-label={tr('Reglas', 'Rules')}>
          ?
        </button>
        <button className="only-mobile" onClick={onDrawer} aria-label={tr('Despachos y puntuación', 'Dispatches and scoring')}>
          ☰
        </button>
      </div>
    </header>
  );
}
