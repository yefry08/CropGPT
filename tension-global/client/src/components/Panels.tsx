import { useEffect, useRef, useState } from 'react';
import {
  CARD,
  REGIONS,
  REGION_NAME,
  REGION_NAME_EN,
  REGION_VALUES,
  STATUS_NAME,
  scoreRegion,
  type ChatMsg,
  type GameState,
  type LogEntry,
  type Region,
  type Side,
} from '@tg/shared';
import { useLang } from '../i18n';

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
  const { lang, tr } = useLang();
  const items = state.log.slice(-160).reverse();
  return (
    <div className="log" role="log" aria-label={tr('Despachos', 'Dispatches')}>
      {items.map((l) => (
        <div key={l.id} className={`log-item k-${l.kind}${l.side ? ` s-${l.side.toLowerCase()}` : ''}`}>
          <span className="log-tag">
            {tr('T', 'T')}
            {l.turn}·{tr('R', 'R')}
            {l.round}
          </span>
          <span className="log-ic">{ICON[l.kind]}</span>
          <span className="log-tx">{lang === 'en' ? l.en ?? l.text : l.text}</span>
        </div>
      ))}
    </div>
  );
}

export function ScorePanel({ state, me }: { state: GameState; me: Side | null }) {
  const { lang, tr } = useLang();
  const rows = REGIONS.map((r) => scoreRegion(state, r));
  const held = (r: Region) => (me ? state.hands[me].some((id) => id !== '?' && CARD[id]?.region === r) : false);
  const total = rows.reduce((a, s) => a + s.net, 0);
  const st = (s: keyof (typeof STATUS_NAME)['es']) => (s === 'none' ? '—' : STATUS_NAME[lang][s]);
  return (
    <div className="scorep">
      <p className="hint">
        {tr('Valor «si se puntuara ahora». Positivo favorece a ', '“If scored now” value. Positive favors ')}
        <b className="w">{tr('Occidente', 'the West')}</b>
        {tr(', negativo al ', ', negative favors ')}
        <b className="e">{tr('Bloque Oriental', 'the Eastern Bloc')}</b>.
      </p>
      <table>
        <thead>
          <tr>
            <th>{tr('Región', 'Region')}</th>
            <th className="w">{tr('Occidente', 'West')}</th>
            <th className="e">{tr('Oriental', 'Eastern')}</th>
            <th>{tr('Neto', 'Net')}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((s) => (
            <tr key={s.region}>
              <td>
                {lang === 'en' ? REGION_NAME_EN[s.region] : REGION_NAME[s.region]}
                {held(s.region) && (
                  <span className="held" title={tr('Tienes su carta de puntuación', 'You hold its scoring card')}>
                    {' '}
                    🂠
                  </span>
                )}
                <div className="sub">
                  {REGION_VALUES[s.region].join('/')} · {s.keyTotal} {tr('claves', 'key')}
                </div>
              </td>
              <td>
                <b>{s.W.total}</b>
                <div className="sub">
                  {st(s.W.status)} · {s.W.controlled}
                  {tr('p', 'c')} {s.W.keyControlled}★
                </div>
              </td>
              <td>
                <b>{s.E.total}</b>
                <div className="sub">
                  {st(s.E.status)} · {s.E.controlled}
                  {tr('p', 'c')} {s.E.keyControlled}★
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
            <td colSpan={3}>{tr('Total si se puntuaran todas', 'Total if all were scored')}</td>
            <td className={total > 0 ? 'w' : total < 0 ? 'e' : ''}>
              <b>{total > 0 ? `+${total}` : total}</b>
            </td>
          </tr>
        </tfoot>
      </table>
      <p className="hint">
        {tr(
          'p = países controlados · ★ = claves controlados. Bonos: +1 por clave y +1 por país controlado vecino de la superpotencia rival.',
          'c = countries controlled · ★ = key countries controlled. Bonuses: +1 per key country and +1 per controlled country bordering the rival superpower.',
        )}
      </p>
    </div>
  );
}

export function ChatPanel({ msgs, onSend, disabled }: { msgs: ChatMsg[]; onSend: (t: string) => void; disabled?: boolean }) {
  const { tr } = useLang();
  const [text, setText] = useState('');
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => {
    end.current?.scrollIntoView({ block: 'end' });
  }, [msgs.length]);
  const sys = (t: string) =>
    tr(t, t
      .replace('La partida ha comenzado. El Bloque Oriental juega primero.', 'The game has started. The Eastern Bloc plays first.')
      .replace(/^(.*) mira la partida como espectador\.$/, '$1 is watching as a spectator.')
      .replace(/^(.*) se desconectó\. La partida sigue; puede reconectarse\.$/, '$1 disconnected. The game continues; they can reconnect.'));
  return (
    <div className="chat">
      <div className="chat-list">
        {msgs.map((m) => (
          <div key={m.id} className={`chat-msg r-${m.role}`}>
            <b>{m.name === 'Sistema' ? tr('Sistema', 'System') : m.name}</b>
            {m.role === 'spectator' && m.name !== 'Sistema' && <em> ({tr('espectador', 'spectator')})</em>}
            <span>{m.name === 'Sistema' ? sys(m.text) : m.text}</span>
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
        <input value={text} onChange={(e) => setText(e.target.value)} maxLength={300} placeholder={tr('Escribe un mensaje…', 'Write a message…')} disabled={disabled} />
        <button disabled={disabled || !text.trim()}>{tr('Enviar', 'Send')}</button>
      </form>
    </div>
  );
}

export function RulesPanel() {
  const { lang } = useLang();
  if (lang === 'en')
    return (
      <div className="rules">
        <h4>Goal</h4>
        <p>
          Reach <b>±20 VP</b> or lead after the final 2026 scoring. 10 turns of 6 rounds; the Eastern Bloc plays first.
        </p>
        <h4>Your turn</h4>
        <p>Pick a card from your hand (7) and play it as:</p>
        <ul>
          <li>
            <b>Event</b>: only your own or neutral cards. Some are removed afterwards.
          </li>
          <li>
            <b>Influence</b>: as many points as ops; 1 per marker (2 if the rival controls the country) in countries where you have influence, their
            neighbors, or neighbors of your superpower. If the card belongs to the rival, <b>its event triggers first</b>.
          </li>
          <li>
            <b>Coup</b>: 1d6 + ops − 2×stability. If positive, remove that much rival influence and add any surplus as yours. In a key country,
            Tension drops 1.
          </li>
          <li>
            <b>Technology</b>: once per turn, with minimum ops; discards the card without triggering its event.
          </li>
          <li>
            <b>Score</b>: region cards. If you still hold one at the end of the turn, it scores automatically.
          </li>
        </ul>
        <h4>Control</h4>
        <p>Your influence ≥ stability and exceeds the rival’s by at least the stability.</p>
        <h4>Tension (5 → 1)</h4>
        <p>
          Rises 1 each turn. At 4 no coups in Europe; at 3 not in Asia either; at 2 not in the Middle East either. If your own action takes it to 1,{' '}
          <b>you lose</b>. A rival event triggered by your operations stops it at 2.
        </p>
        <h4>Region scoring</h4>
        <p>Presence / Domination / Control, plus +1 per key country and +1 per controlled country bordering the rival superpower.</p>
        <h4>AI</h4>
        <p>
          From 1991, <b>AI Risk</b> (0–10) can cause an Incident (≥8 at the end of a turn: the side with more technology loses 3 VP).{' '}
          <b>AI Capability</b> (0–5) adds ops to your first coup each turn.
        </p>
      </div>
    );
  return (
    <div className="rules">
      <h4>Objetivo</h4>
      <p>
        Llega a <b>±20 PV</b> o lidera tras la puntuación final de 2026. 10 turnos de 6 rondas; el Bloque Oriental juega primero.
      </p>
      <h4>Tu turno</h4>
      <p>Elige una carta de tu mano (7) y juégala como:</p>
      <ul>
        <li>
          <b>Evento</b>: solo cartas tuyas o neutrales. Algunas se retiran del juego.
        </li>
        <li>
          <b>Influencia</b>: tantos puntos como ops; 1 por ficha (2 si el rival controla el país) en países donde ya tienes influencia, en sus vecinos o
          en vecinos de tu superpotencia. Si la carta es del rival, <b>su evento se activa primero</b>.
        </li>
        <li>
          <b>Golpe</b>: 1d6 + ops − 2×estabilidad. Si es positivo quitas esa influencia rival y el sobrante pasa a ser tuyo. En país clave baja la
          Tensión 1.
        </li>
        <li>
          <b>Tecnología</b>: una vez por turno, con ops mínimos; descarta sin activar el evento.
        </li>
        <li>
          <b>Puntuar</b>: cartas de región. Si las retienes al final del turno, se puntúan solas.
        </li>
      </ul>
      <h4>Control</h4>
      <p>Tu influencia ≥ estabilidad y supera a la rival en al menos la estabilidad.</p>
      <h4>Tensión (5 → 1)</h4>
      <p>
        Sube 1 cada turno. Con 4 no hay golpes en Europa; con 3 tampoco en Asia; con 2 tampoco en Medio Oriente. Si una acción tuya la lleva a 1,{' '}
        <b>pierdes</b>. Un evento rival activado por ops la deja en 2.
      </p>
      <h4>Puntuación de región</h4>
      <p>Presencia / Dominio / Control, más +1 por país clave y +1 por país controlado vecino de la superpotencia rival.</p>
      <h4>IA</h4>
      <p>
        Desde 1991 el <b>Riesgo de IA</b> (0–10) puede provocar un Incidente (≥8 al final del turno: el bando con más tecnología pierde 3 PV). La{' '}
        <b>Capacidad de IA</b> (0–5) suma ops a tu primer golpe de cada turno.
      </p>
    </div>
  );
}
