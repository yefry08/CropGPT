import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { GameError, actingSide, applyAction, chooseAction, createGame, makeRng, viewFor, type AILevel, type Action, type GameState, type Side } from '@tg/shared';
import { getLang } from '../i18n';
import type { GameController } from './types';

const SAVE_KEY = 'tg-save-v1';

export interface SavedGame {
  state: GameState;
  side: Side;
  level: AILevel;
}

export function loadSave(): SavedGame | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw) as SavedGame;
    return s?.state?.v === 1 && s.state.phase === 'play' ? s : null;
  } catch {
    return null;
  }
}

export function clearSave() {
  try {
    localStorage.removeItem(SAVE_KEY);
  } catch {
    /* ignorar */
  }
}

/** Partida contra la IA: todo el motor corre en el navegador con @tg/shared. */
export function useLocalGame(side: Side, level: AILevel, resume: SavedGame | null): GameController {
  const [full, setFull] = useState<GameState>(() => resume?.state ?? createGame((Math.random() * 2 ** 31) | 0));
  const [paused, setPaused] = useState(false);
  const rand = useMemo(() => makeRng((Math.random() * 2 ** 31) | 0), []);
  const fullRef = useRef(full);
  fullRef.current = full;
  const ai: Side = side === 'W' ? 'E' : 'W';
  const thinking = full.phase === 'play' && actingSide(full) === ai;

  useEffect(() => {
    try {
      if (full.phase === 'play') localStorage.setItem(SAVE_KEY, JSON.stringify({ state: full, side, level } satisfies SavedGame));
      else clearSave();
    } catch {
      /* almacenamiento lleno o bloqueado */
    }
  }, [full, side, level]);

  useEffect(() => {
    if (!thinking || paused) return;
    const t = setTimeout(() => {
      const cur = fullRef.current;
      if (cur.phase !== 'play' || actingSide(cur) !== ai) return;
      try {
        const a = chooseAction(cur, ai, { level, rand });
        setFull(applyAction(cur, ai, a));
      } catch (e) {
        console.error('Error de la IA', e);
      }
    }, 850);
    return () => clearTimeout(t);
  }, [full, thinking, paused, ai, level, rand]);

  const send = useCallback(
    async (a: Action) => {
      try {
        const cur = fullRef.current;
        if (actingSide(cur) !== side) return getLang() === 'en' ? 'It is not your turn' : 'No es tu turno';
        const next = applyAction(cur, side, a);
        fullRef.current = next;
        setFull(next);
        return null;
      } catch (e) {
        if (e instanceof GameError) return getLang() === 'en' ? e.en : e.message;
        return e instanceof Error ? e.message : getLang() === 'en' ? 'Invalid action' : 'Acción inválida';
      }
    },
    [side],
  );

  const state = useMemo(() => viewFor(full, side), [full, side]);
  return { state, me: side, send, aiThinking: thinking, setPaused };
}
