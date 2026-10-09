import { useEffect, useRef, useState } from 'react';
import {
  CARD,
  REGIONS,
  REGION_NAME,
  REGION_VALUES,
  scoreRegion,
  type ChatMsg,
  type GameState,
  type LogEntry,
  type Region,
  type Side,
} from '@tg/shared';

const ICON: Record<LogEntry['kind'], string> = {
  info: '·',
  play: '▶',
  event: '⚡',
  inf: '＋',
  coup: '✸',
  war: '⚔',
  tech: '◎',
  score: '★',
  era: '⌛',
  tension: '☢',
  ia: '⌬',
  over: '■',
};

export function LogPanel({ state }: { state: GameState }) {
  const items = state.log.slice(-160).reverse();
  return (
    <div className="log" role="log" aria-label="Despachos">
      {items.map((l) => (
        <div key={l.id} className={`log-item k-${l.kind}${l.side ? ` s-${l.side.toLowerCase()}` : ''}`}>
          <span className="log-tag">
            T{l.turn}·R{l.round}
          </span>
          <span className="log-ic">{ICON[l.kind]}</span>
          <span className="log-tx">{l.text}</span>
        </div>
      ))}
    </div>
  );
}

const STATUS: Record<string, string> = { none: '—', presence: 'Presencia', domination: 'Dominio', control: 'Control' };

export function ScorePanel({ state, me }: { state: GameState; me: Side | null }) {
  const rows = REGIONS.filter((r) => (r === 'AF' || r === 'AM' ? state.era >= 2 || true : true)).map((r) => scoreRegion(state, r));
  const held = (r: Region) => (me ? state.hands[me].some((id) => id !== '?' && CARD[id]?.region === r) : false);
  const total = rows.reduce((a, s) => a + s.net, 0);
  return (
    <div className="scorep">
      <p className="hint">
        Valor «si se puntuara ahora». Positivo favorece a <b className="w">Occidente</b>, negativo al <b className="e">Bloque Oriental</b>.
      </p>
      <table>
        <thead>
          <tr>
            <th>Región</th>
            <th className="w">Occidente</th>
            <th className="e">Oriental</th>
            <th>Neto</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((s) => (
            <tr key={s.region}>
              <td>
                {REGION_NAME[s.region]}
                {held(s.region) && <span className="held" title="Tienes su carta de puntuación"> 🂠</span>}
                <div className="sub">
                  {REGION_VALUES[s.region].join('/')} · {s.keyTotal} claves
                </div>
              </td>
              <td>
                <b>{s.W.total}</b>
                <div className="sub">
                  {STATUS[s.W.status]} · {s.W.controlled}p {s.W.keyControlled}★
                </div>
              </td>
              <td>
                <b>{s.E.total}</b>
                <div className="sub">
                  {STATUS[s.E.status]} · {s.E.controlled}p {s.E.keyControlled}★
                </div>
              </td>
              <td className={s.net > 0 ? 'w' : s.net < 0 ? 'e' : ''}>
                <b>{s.net > 0 ? `+${s.net}` : s.net}</b>
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan={3}>Total si se puntuaran todas</td>
            <td className={total > 0 ? 'w' : total < 0 ? 'e' : ''}>
              <b>{total > 0 ? `+${total}` : total}</b>
            </td>
          </tr>
        </tfoot>
      </table>
      <p className="hint">p = países controlados · ★ = claves controlados. Bonos: +1 por clave y +1 por país controlado vecino de la superpotencia rival.</p>
    </div>
  );
}

export function ChatPanel({ msgs, onSend, disabled }: { msgs: ChatMsg[]; onSend: (t: string) => void; disabled?: boolean }) {
  const [text, setText] = useState('');
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => {
    end.current?.scrollIntoView({ block: 'end' });
  }, [msgs.length]);
  return (
    <div className="chat">
      <div className="chat-list">
        {msgs.map((m) => (
          <div key={m.id} className={`chat-msg r-${m.role}`}>
            <b>{m.name}</b>
            {m.role === 'spectator' && m.name !== 'Sistema' && <em> (espectador)</em>}
            <span>{m.text}</span>
          </div>
        ))}
        <div ref={end} />
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (text.trim()) onSend(text);
          setText('');
        }}
      >
        <input value={text} onChange={(e) => setText(e.target.value)} maxLength={300} placeholder="Escribe un mensaje…" disabled={disabled} />
        <button disabled={disabled || !text.trim()}>Enviar</button>
      </form>
    </div>
  );
}

export function RulesPanel() {
  return (
    <div className="rules">
      <h4>Objetivo</h4>
      <p>Llega a <b>±20 PV</b> o lidera tras la puntuación final de 2026. 10 turnos de 6 rondas; el Bloque Oriental juega primero.</p>
      <h4>Tu turno</h4>
      <p>Elige una carta de tu mano (7) y juégala como:</p>
      <ul>
        <li><b>Evento</b>: solo cartas tuyas o neutrales. Algunas se retiran del juego.</li>
        <li><b>Influencia</b>: tantos puntos como ops; 1 por ficha (2 si el rival controla el país) en países donde ya tienes influencia, en sus vecinos o en vecinos de tu superpotencia. Si la carta es del rival, <b>su evento se activa primero</b>.</li>
        <li><b>Golpe</b>: 1d6 + ops − 2×estabilidad. Si es positivo quitas esa influencia rival y el sobrante pasa a ser tuyo. En país clave baja la Tensión 1.</li>
        <li><b>Tecnología</b>: una vez por turno, con ops mínimos; descarta una carta rival sin activar su evento.</li>
        <li><b>Puntuar</b>: cartas de región. Si las retienes al final del turno, se puntúan solas.</li>
      </ul>
      <h4>Control</h4>
      <p>Tu influencia ≥ estabilidad y supera a la rival en al menos la estabilidad.</p>
      <h4>Tensión (5 → 1)</h4>
      <p>Sube 1 cada turno. Con 4 no hay golpes en Europa; con 3 tampoco en Asia; con 2 tampoco en Medio Oriente. Si una acción tuya la lleva a 1, <b>pierdes</b>. Un evento rival activado por ops la deja en 2.</p>
      <h4>Puntuación de región</h4>
      <p>Presencia / Dominio / Control, más +1 por país clave y +1 por país controlado vecino de la superpotencia rival.</p>
      <h4>IA</h4>
      <p>Desde 1991 el <b>Riesgo de IA</b> (0–10) puede provocar un Incidente (≥8 al final del turno: el bando con más tecnología pierde 3 PV). La <b>Capacidad de IA</b> (0–5) suma ops a tu primer golpe de cada turno.</p>
    </div>
  );
}
