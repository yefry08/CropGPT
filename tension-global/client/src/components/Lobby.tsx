import { useState } from 'react';
import type { ChatMsg, RoomInfo, Role, Side } from '@tg/shared';
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
}) {
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
      window.prompt('Copia el enlace:', text);
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
          ← Salir
        </button>
        <div className="home-kicker">SALA</div>
        <div className="room-code" aria-label="Código de sala">
          {code.split('').map((c, i) => (
            <span key={i}>{c}</span>
          ))}
        </div>
        {!connected && <div className="conn-banner">Reconectando con el servidor…</div>}
        {error && <div className="conn-banner warn">{error}</div>}
        <div className="row">
          <button onClick={() => copy(linkPlayer, 'p')}>{copied === 'p' ? '¡Copiado!' : 'Copiar enlace de la sala'}</button>
          <button onClick={() => copy(linkSpec, 's')}>{copied === 's' ? '¡Copiado!' : 'Copiar enlace de espectador'}</button>
        </div>

        <div className="seats">
          {(['W', 'E'] as Side[]).map((s) => {
            const st = seat(s);
            const isMine = mine === s;
            return (
              <div key={s} className={`seat ${s === 'W' ? 'w' : 'e'}${isMine ? ' mine' : ''}`}>
                <h3>{s === 'W' ? 'Occidente' : 'Bloque Oriental'}</h3>
                <div className="seat-name">
                  {st ? (
                    <>
                      {st.name} {isMine && '(tú)'}
                      <span className={`dot ${st.connected ? 'on' : ''}`} title={st.connected ? 'Conectado' : 'Desconectado'} />
                    </>
                  ) : (
                    <em>Libre</em>
                  )}
                </div>
                {st?.ready && <div className="ready">✔ Listo</div>}
                {role !== 'spectator' && !st && <button onClick={() => wrap(onSide(s))}>Elegir este bando</button>}
                {isMine && !info?.started && <button onClick={() => wrap(onSide(null))}>Dejar el asiento</button>}
              </div>
            );
          })}
        </div>

        {role === 'spectator' ? (
          <p className="muted">Estás como espectador. Verás la partida en cuanto empiece (sin las manos de los jugadores).</p>
        ) : (
          <button className="primary big" disabled={!mine} onClick={() => wrap(onReady(!me?.ready))}>
            {me?.ready ? 'Cancelar «Listo»' : mine ? 'Estoy listo' : 'Elige un bando primero'}
          </button>
        )}
        {msg && <div className="toast inline">{msg}</div>}
        <p className="muted">
          {info?.spectators ? `${info.spectators} espectador(es) conectado(s). ` : ''}
          La partida empieza cuando ambos bandos están ocupados y listos.
        </p>
      </div>
      <div className="lobby-chat">
        <h3>Chat de la sala</h3>
        <ChatPanel msgs={chat} onSend={onSend} />
      </div>
    </div>
  );
}
