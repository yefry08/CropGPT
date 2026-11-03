import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Lang } from '@tg/shared';

export type { Lang };

let current: Lang = detect();

function detect(): Lang {
  try {
    const saved = localStorage.getItem('tg-lang');
    if (saved === 'es' || saved === 'en') return saved;
  } catch {
    /* sin almacenamiento */
  }
  return typeof navigator !== 'undefined' && !navigator.language?.toLowerCase().startsWith('es') ? 'en' : 'es';
}

/** Idioma actual fuera de React (para mensajes de error de los hooks). */
export const getLang = (): Lang => current;

interface Ctx {
  lang: Lang;
  setLang: (l: Lang) => void;
  /** Elige el texto según el idioma: tr('Hola', 'Hello'). */
  tr: (es: string, en: string) => string;
}

const LangCtx = createContext<Ctx>({ lang: current, setLang: () => {}, tr: (es) => es });

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(current);
  const setLang = useCallback((l: Lang) => {
    current = l;
    setLangState(l);
    try {
      localStorage.setItem('tg-lang', l);
    } catch {
      /* ignorar */
    }
  }, []);
  useEffect(() => {
    document.documentElement.lang = lang;
    document.title = lang === 'en' ? 'Global Tension' : 'Tensión Global';
  }, [lang]);
  const value = useMemo(() => ({ lang, setLang, tr: (es: string, en: string) => (lang === 'en' ? en : es) }), [lang, setLang]);
  return <LangCtx.Provider value={value}>{children}</LangCtx.Provider>;
}

export const useLang = () => useContext(LangCtx);

export function LangSwitch({ className }: { className?: string }) {
  const { lang, setLang } = useLang();
  return (
    <span className={`lang-switch ${className ?? ''}`} role="group" aria-label="Idioma / Language">
      <button className={lang === 'es' ? 'on' : ''} onClick={() => setLang('es')} aria-pressed={lang === 'es'}>
        ES
      </button>
      <button className={lang === 'en' ? 'on' : ''} onClick={() => setLang('en')} aria-pressed={lang === 'en'}>
        EN
      </button>
    </span>
  );
}

// Errores fijos del servidor / anfitrión P2P (se envían en español).
const SERVER_ERRORS: Record<string, string> = {
  'No estás en la sala': 'You are not in the room',
  'No estás en una sala': 'You are not in a room',
  'La partida ya empezó': 'The game has already started',
  'Eres espectador': 'You are a spectator',
  'Ese bando ya está elegido': 'That side is already taken',
  'Elige un bando primero': 'Choose a side first',
  'La partida no ha empezado': 'The game has not started',
  'Los espectadores no pueden jugar': 'Spectators cannot play',
  'Evento desconocido': 'Unknown event',
  'La sala no existe o ha caducado': 'The room does not exist or has expired',
  'No se pudo crear la sala': 'Could not create the room',
  'Inicia sesión para crear una sala': 'Sign in to create a room',
  'Inicia sesión para unirte como jugador': 'Sign in to join as a player',
  'Esa plaza pertenece a otra cuenta. Inicia sesión con la correcta.': 'That seat belongs to another account. Sign in with the right one.',
  'Sin conexión con el servidor': 'No connection to the server',
  'Sin conexión con el anfitrión': 'No connection to the host',
  'Sin conexión': 'No connection',
  'El servidor no responde': 'The server is not responding',
  'Acción inválida': 'Invalid action',
  'No es tu turno': 'It is not your turn',
};

/** Traduce un mensaje de error del servidor (usa la versión inglesa si viene incluida). */
export function localizeError(es: string, en?: string): string {
  if (current === 'es') return es;
  return en ?? SERVER_ERRORS[es] ?? es;
}
