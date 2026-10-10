import { useState } from 'react';
import type { ChatMsg, RoomInfo, Role, Side } from '@tg/shared';
import { useLang } from '../i18n';
import { ChatPanel } from './Panels';

export function Lobby({
  info,
  role,
  chat,
  onSend,
  onSide,
  onReady,
  onExit,
  connected,
  error,
  p2pHost,
}: {
  info: RoomInfo | null;
  role: Role | null;
  chat: ChatMsg[];
  onSend: (t: string) => void;
  onSide: (s: Side | null) => Promise<string | null>;
  onReady: (r: boolean) => Promise<string | null>;
  onExit: () => void;
  connected: boolean;
  error: string | null;
  p2pHost?: boolean;
}) {
  const { tr } = useLang();
  const [msg, setMsg] = useState<string | null>(null);
  const [copied, setCopied] = useState('');
  const code = info?.code ?? '······';
  const base = `${location.origin}${location.pathname}`;
  const linkPlayer = `${base}?sala=${code}`;
  const linkSpec = `${base}?sala=${code}&espectador=1`;
  const copy = async (text: string, k: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(k);
      setTimeout(() => setCopied(''), 1600);
    } catch {
      window.prompt(tr('Copia el enlace:', 'Copy the link:'), text);
    }
  };
  const wrap = async (p: Promise<string | null>) => setMsg(await p);
  const mine = role === 'W' || role === 'E' ? role : null;
  const seat = (s: Side) => info?.seats[s] ?? null;
  const me = mine ? seat(mine) : null;

  return (
    <div className="lobby">
      <div className="lobby-main">
        <button className="link back" onClick={onExit}>
          ← {tr('Salir', 'Leave')}
        </button>
        <div className="home-kicker">{tr('SALA', 'ROOM')}</div>
        <div className="room-code" aria-label={tr('Código de sala', 'Room code')}>
          {code.split('').map((c, i) => (
            <span key={i}>{c}</span>
          ))}
        </div>
        {p2pHost && (
          <div className="conn-banner">{tr('Tu navegador hospeda la sala: mantén esta pestaña abierta mientras dure la partida. Si la cierras, la partida queda guardada y continúa al volver a abrir el enlace.', 'Your browser hosts the room: keep this tab open for the whole game. If you close it, the game is saved and resumes when you reopen the link.')}</div>
        )}
        {!connected && !error && <div className="conn-banner">{tr('Reconectando…', 'Reconnecting…')}</div>}
        {error && <div className="conn-banner warn">{error}</div>}
        <div className="row">
          <button onClick={() => copy(linkPlayer, 'p')}>{copied === 'p' ? tr('¡Copiado!', 'Copied!') : tr('Copiar enlace de la sala', 'Copy room link')}</button>
          <button onClick={() => copy(linkSpec, 's')}>{copied === 's' ? tr('¡Copiado!', 'Copied!') : tr('Copiar enlace de espectador', 'Copy spectator link')}</button>
        </div>

        {!info && <div className="muted">{tr('Conectando con la sala…', 'Connecting to the room…')}</div>}
        {info && (
        <div className="seats">
          {(['W', 'E'] as Side[]).map((s) => {
            const st = seat(s);
            const isMine = mine === s;
            return (
              <div key={s} className={`seat ${s === 'W' ? 'w' : 'e'}${isMine ? ' mine' : ''}`}>
                <h3>{s === 'W' ? tr('Occidente', 'West') : tr('Bloque Oriental', 'Eastern Bloc')}</h3>
                <div className="seat-name">
                  {st ? (
                    <>
                      {st.name} {isMine && tr('(tú)', '(you)')}
                      <span className={`dot ${st.connected ? 'on' : ''}`} title={st.connected ? tr('Conectado', 'Connected') : tr('Desconectado', 'Disconnected')} />
                    </>
                  ) : (
                    <em>{tr('Libre', 'Free')}</em>
                  )}
                </div>
                {st?.ready && <div className="ready">✔ {tr('Listo', 'Ready')}</div>}
                {role !== 'spectator' && !st && <button onClick={() => wrap(onSide(s))}>{tr('Elegir este bando', 'Take this side')}</button>}
                {isMine && !info?.started && <button onClick={() => wrap(onSide(null))}>{tr('Dejar el asiento', 'Leave the seat')}</button>}
              </div>
            );
          })}
        </div>
        )}

        {role === 'spectator' ? (
          <p className="muted">{tr('Estás como espectador. Verás la partida en cuanto empiece (sin las manos de los jugadores).', 'You are a spectator. You will see the game as soon as it starts (without the players’ hands).')}</p>
        ) : (
          <button className="primary big" disabled={!mine} onClick={() => wrap(onReady(!me?.ready))}>
            {me?.ready ? tr('Cancelar «Listo»', 'Cancel “Ready”') : mine ? tr('Estoy listo', 'I’m ready') : tr('Elige un bando primero', 'Pick a side first')}
          </button>
        )}
        {msg && <div className="toast inline">{msg}</div>}
        <p className="muted">
          {info?.spectators ? tr(`${info.spectators} espectador(es) conectado(s). `, `${info.spectators} spectator(s) connected. `) : ''}
          {tr('La partida empieza cuando ambos bandos están ocupados y listos.', 'The game starts when both sides are taken and ready.')}
        </p>
      </div>
      <div className="lobby-chat">
        <h3>{tr('Chat de la sala', 'Room chat')}</h3>
        <ChatPanel msgs={chat} onSend={onSend} />
      </div>
    </div>
  );
}
