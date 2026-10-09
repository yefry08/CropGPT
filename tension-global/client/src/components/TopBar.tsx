import {
  ERA_INFO,
  MAX_CAP,
  SIDE_NAME,
  TECH_MIN_OPS,
  TECH_NAMES,
  TURN_YEAR,
  actingSide,
  type GameState,
  type Side,
} from '@tg/shared';

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
  const info = ERA_INFO[state.era];
  const year = state.phase === 'over' ? 2026 : TURN_YEAR[state.turn];
  const vp = state.vp;
  const pct = ((vp + 20) / 40) * 100;
  const t = state.tension;
  const acting = actingSide(state);
  const nextW = state.tech.W < 8 ? `${TECH_NAMES[state.tech.W]} (${TECH_MIN_OPS[state.tech.W]}+ ops)` : 'completa';
  const nextE = state.tech.E < 8 ? `${TECH_NAMES[state.tech.E]} (${TECH_MIN_OPS[state.tech.E]}+ ops)` : 'completa';
  const aiOn = state.era >= 4;
  const blocked = [
    { k: 'Europa', on: t <= 4 },
    { k: 'Asia', on: t <= 3 },
    { k: 'Medio Oriente', on: t <= 2 },
  ];
  return (
    <header className="topbar">
      <div className="tb-brand">
        <button className="tb-title" onClick={onMenu} title="Volver al menú">
          TENSIÓN <b>GLOBAL</b>
        </button>
        <div className="tb-era">
          <span className="tb-year">{year}</span>
          <span className="tb-eraname">
            Era {state.era} · {info.title}
          </span>
        </div>
        <div className="tb-turn">
          <span>
            Turno <b>{state.turn}</b>/10
          </span>
          <span>
            Ronda <b>{state.round}</b>/6
          </span>
          <span className={`turn-side ${acting === 'W' ? 'w' : 'e'}`}>
            {state.phase === 'over' ? 'Fin' : `Juega ${acting === 'W' ? 'Occidente' : 'Oriental'}${me === acting ? ' (tú)' : ''}`}
          </span>
        </div>
      </div>

      <div className="tb-block vpbox" title="Puntos de victoria: 20 inmediatos o liderar al final de 2026">
        <div className="tb-label">PV</div>
        <div className="vpbar">
          <div className="vpfill-e" />
          <div className="vpfill-w" />
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
          <span className="e">Oriental</span>
          <span className="w">Occidente</span>
        </div>
      </div>

      <div className="tb-block tension" title="Tensión nuclear: 5 calma → 1 guerra. Sube 1 al inicio de cada turno.">
        <div className="tb-label">TENSIÓN</div>
        <div className="tcells">
          {[5, 4, 3, 2, 1].map((n) => (
            <span key={n} className={`tcell t${n}${n === t ? ' cur' : ''}`}>
              {n}
            </span>
          ))}
        </div>
        <div className="tblocks">
          {blocked.map((b) => (
            <span key={b.k} className={b.on ? 'bl on' : 'bl'} title={b.on ? `Sin golpes en ${b.k}` : `Golpes permitidos en ${b.k}`}>
              {b.on ? '✕' : '✓'} {b.k === 'Medio Oriente' ? 'M. Oriente' : b.k}
            </span>
          ))}
        </div>
      </div>

      <div className="tb-block tech" title="Carrera tecnológica (8 hitos)">
        <div className="tb-label">TECNOLOGÍA</div>
        <div className="trow w">
          <span>O</span>
          <Pips n={state.tech.W} total={8} cls="w" title={(i) => TECH_NAMES[i]} />
        </div>
        <div className="trow e">
          <span>B</span>
          <Pips n={state.tech.E} total={8} cls="e" title={(i) => TECH_NAMES[i]} />
        </div>
        <div className="tnext" title={`Occidente: ${nextW} · Oriental: ${nextE}`}>
          {me ? `Sig.: ${me === 'W' ? nextW : nextE}` : `O: ${nextW}`}
        </div>
      </div>

      <div className={`tb-block ai${aiOn ? '' : ' off'}`} title="Riesgo de IA (0–10, activo desde 1991) y Capacidad de IA de cada bando (0–5)">
        <div className="tb-label">IA</div>
        <div className="riskbar" title={aiOn ? `Riesgo ${state.risk}/10` : 'Se activa en la era 4'}>
          {Array.from({ length: 10 }, (_, i) => (
            <i key={i} className={`rk${i < state.risk && aiOn ? ' on' : ''}${i >= 7 ? ' hot' : ''}`} />
          ))}
        </div>
        <div className="riskval">{aiOn ? `Riesgo ${state.risk}${state.risk >= 8 ? ' ⚠' : ''}` : 'Riesgo: desde 1991'}</div>
        <div className="caps">
          <span className="w">
            Cap. O <Pips n={state.cap.W} total={MAX_CAP} cls="w" />
          </span>
          <span className="e">
            Cap. B <Pips n={state.cap.E} total={MAX_CAP} cls="e" />
          </span>
        </div>
      </div>

      <div className="tb-actions">
        <button onClick={onSound} title="Sonido" aria-label="Sonido">
          {sound ? '🔊' : '🔇'}
        </button>
        <button onClick={onHelp} title="Reglas" aria-label="Reglas">
          ?
        </button>
        <button className="only-mobile" onClick={onDrawer} aria-label="Despachos y puntuación" title="Despachos y puntuación">
          ☰
        </button>
      </div>
      <span className="sr-only">{SIDE_NAME.W}</span>
    </header>
  );
}
