import { useEffect, useState } from 'react';
import { ERA_EN, ERA_INFO, type Era, type GameState, type Side } from '@tg/shared';
import { useLang } from '../i18n';
import { RulesPanel } from './Panels';

export function EraModal({ era, state, onClose }: { era: Era; state: GameState; onClose: () => void }) {
  const { lang, tr } = useLang();
  const base = ERA_INFO[era];
  const info = lang === 'en' ? { ...base, ...ERA_EN[era] } : base;
  const prevEra = (era - 1) as Era;
  const prev = era > 1 ? (lang === 'en' ? { ...ERA_INFO[prevEra], ...ERA_EN[prevEra] } : ERA_INFO[prevEra]) : null;
  return (
    <div className="modal-back" role="dialog" aria-modal="true" aria-label={`Era ${era}`}>
      <div className="modal era-modal">
        <div className="era-num">ERA {era}</div>
        <h2>{info.title}</h2>
        <div className="era-years">{info.years}</div>
        <p className="era-lead">{info.lead}</p>
        {prev && (
          <>
            <h4>
              {tr('Resumen de la era anterior', 'Previous era recap')} · {prev.title}
            </h4>
            <ul>
              {prev.recap.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
          </>
        )}
        <h4>{tr('Cambios en la partida', 'Game changes')}</h4>
        <ul className="era-changes">
          {info.changes.map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ul>
        <div className="era-score">
          {tr('Marcador', 'Score')}:{' '}
          <b className={state.vp > 0 ? 'w' : state.vp < 0 ? 'e' : ''}>
            {state.vp > 0 ? `+${state.vp}` : state.vp} {tr('PV', 'VP')}
          </b>{' '}
          · {tr('Tensión', 'Tension')} <b>{state.tension}</b>
        </div>
        <button className="primary" onClick={onClose} autoFocus>
          {tr('Continuar', 'Continue')}
        </button>
      </div>
    </div>
  );
}

export function GameOverModal({ state, me, onExit }: { state: GameState; me: Side | null; onExit: () => void }) {
  const { lang, tr } = useLang();
  const w = state.winner;
  const title =
    w === 'draw' ? tr('Empate', 'Draw') : w === 'W' ? tr('Victoria de Occidente', 'Victory for the West') : tr('Victoria del Bloque Oriental', 'Victory for the Eastern Bloc');
  const mine = me && w && w !== 'draw' ? (w === me ? tr('¡Has ganado!', 'You won!') : tr('Has perdido.', 'You lost.')) : '';
  return (
    <div className="modal-back" role="dialog" aria-modal="true">
      <div className={`modal over-modal ${w === 'W' ? 'w' : w === 'E' ? 'e' : ''}`}>
        <div className="era-num">{tr('FIN DE LA PARTIDA', 'GAME OVER')}</div>
        <h2>{title}</h2>
        {mine && <div className="over-mine">{mine}</div>}
        <p>{lang === 'en' ? state.endReasonEn ?? state.endReason : state.endReason}</p>
        <div className="era-score">
          {tr('Marcador final', 'Final score')}: <b>{state.vp > 0 ? `+${state.vp}` : state.vp} {tr('PV', 'VP')}</b> · {tr('Tensión', 'Tension')} {state.tension}
        </div>
        <button className="primary" onClick={onExit}>
          {tr('Volver al menú', 'Back to menu')}
        </button>
      </div>
    </div>
  );
}

export function RulesModal({ onClose }: { onClose: () => void }) {
  const { tr } = useLang();
  return (
    <div className="modal-back" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="modal rules-modal" onClick={(e) => e.stopPropagation()}>
        <h2>{tr('Cómo se juega', 'How to play')}</h2>
        <RulesPanel />
        <button className="primary" onClick={onClose}>
          {tr('Cerrar', 'Close')}
        </button>
      </div>
    </div>
  );
}

export interface DiceEvent {
  id: number;
  value: number;
  label: string;
  labelEn?: string;
  side?: Side;
}

export function DiceOverlay({ queue, onNext }: { queue: DiceEvent[]; onNext: () => void }) {
  const { lang } = useLang();
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
      <div className="dice-label">{lang === 'en' ? cur.labelEn ?? cur.label : cur.label}</div>
    </div>
  );
}
