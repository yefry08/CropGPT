import { useEffect, useState } from 'react';
import { ERA_INFO, SIDE_NAME, type Era, type GameState, type Side } from '@tg/shared';
import { RulesPanel } from './Panels';

export function EraModal({ era, state, onClose }: { era: Era; state: GameState; onClose: () => void }) {
  const info = ERA_INFO[era];
  const prev = era > 1 ? ERA_INFO[(era - 1) as Era] : null;
  return (
    <div className="modal-back" role="dialog" aria-modal="true" aria-label={`Era ${era}`}>
      <div className="modal era-modal">
        <div className="era-num">ERA {era}</div>
        <h2>{info.title}</h2>
        <div className="era-years">{info.years}</div>
        <p className="era-lead">{info.lead}</p>
        {prev && (
          <>
            <h4>Resumen de la era anterior · {prev.title}</h4>
            <ul>
              {prev.recap.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
          </>
        )}
        <h4>Cambios en la partida</h4>
        <ul className="era-changes">
          {info.changes.map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ul>
        <div className="era-score">
          Marcador: <b className={state.vp > 0 ? 'w' : state.vp < 0 ? 'e' : ''}>{state.vp > 0 ? `+${state.vp}` : state.vp} PV</b> · Tensión <b>{state.tension}</b>
        </div>
        <button className="primary" onClick={onClose} autoFocus>
          Continuar
        </button>
      </div>
    </div>
  );
}

export function GameOverModal({ state, me, onExit }: { state: GameState; me: Side | null; onExit: () => void }) {
  const w = state.winner;
  const title = w === 'draw' ? 'Empate' : `Victoria de ${SIDE_NAME[w as Side]}`;
  const mine = me && w && w !== 'draw' ? (w === me ? '¡Has ganado!' : 'Has perdido.') : '';
  return (
    <div className="modal-back" role="dialog" aria-modal="true">
      <div className={`modal over-modal ${w === 'W' ? 'w' : w === 'E' ? 'e' : ''}`}>
        <div className="era-num">FIN DE LA PARTIDA</div>
        <h2>{title}</h2>
        {mine && <div className="over-mine">{mine}</div>}
        <p>{state.endReason}</p>
        <div className="era-score">
          Marcador final: <b>{state.vp > 0 ? `+${state.vp}` : state.vp} PV</b> · Tensión {state.tension}
        </div>
        <button className="primary" onClick={onExit}>
          Volver al menú
        </button>
      </div>
    </div>
  );
}

export function RulesModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="modal-back" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="modal rules-modal" onClick={(e) => e.stopPropagation()}>
        <h2>Cómo se juega</h2>
        <RulesPanel />
        <button className="primary" onClick={onClose}>
          Cerrar
        </button>
      </div>
    </div>
  );
}

export interface DiceEvent {
  id: number;
  value: number;
  label: string;
  side?: Side;
}

export function DiceOverlay({ queue, onNext }: { queue: DiceEvent[]; onNext: () => void }) {
  const cur = queue[0];
  const [shown, setShown] = useState(1);
  const [done, setDone] = useState(false);
  useEffect(() => {
    if (!cur) return;
    setDone(false);
    let n = 0;
    const iv = setInterval(() => {
      n++;
      setShown(1 + Math.floor(Math.random() * 6));
      if (n >= 9) {
        clearInterval(iv);
        setShown(cur.value);
        setDone(true);
      }
    }, 80);
    const to = setTimeout(onNext, 2600);
    return () => {
      clearInterval(iv);
      clearTimeout(to);
    };
  }, [cur?.id]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!cur) return null;
  return (
    <div className="dice-overlay" onClick={onNext}>
      <div className={`die s-${cur.side?.toLowerCase() ?? 'n'}${done ? ' done' : ' rolling'}`}>
        <div className="die-face">{shown}</div>
      </div>
      <div className="dice-label">{cur.label}</div>
    </div>
  );
}
