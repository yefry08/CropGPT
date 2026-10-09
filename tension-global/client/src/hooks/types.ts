import type { Action, ChatMsg, GameState, RoomInfo, Role, Side } from '@tg/shared';

export interface OnlineInfo {
  code: string;
  info: (RoomInfo & { role: Role }) | null;
  connected: boolean;
  chat: ChatMsg[];
  sendChat: (t: string) => void;
}

export interface GameController {
  state: GameState;
  me: Side | null;
  /** Devuelve un mensaje de error o null si todo fue bien. */
  send: (a: Action) => Promise<string | null>;
  online?: OnlineInfo;
  aiThinking?: boolean;
  /** Pausa la IA mientras hay ventanas abiertas (solo partida local). */
  setPaused?: (p: boolean) => void;
}
