import {
  CARD,
  COUNTRY,
  TECH_MIN_OPS,
  TECH_NAMES,
  applyAction,
  countryName,
  coupBonus,
  coupStrength,
  describeEffects,
  eventBlockedReason,
  lowersTension,
  other,
  techBlockedReason,
  type Action,
  type CountryId,
  type GameState,
  type Placement,
  type Side,
} from '@tg/shared';

export interface PendingUI {
  kind: 'influence' | 'coup' | 'free';
  /** Puntos disponibles y usados. */
  total: number;
  spent: number;
  placements: Placement[];
  target: CountryId | null;
  mode?: 'add' | 'remove';
  hasOptions: boolean;
  cardName: string;
  hint: string;
}

interface Props {
  state: GameState;
  me: Side;
  card: string | null;
  busy: boolean;
  myTurn: boolean;
  pending: PendingUI | null;
  waitingFor: Side | null;
  onPlay: (a: Action) => void;
  onUndo: () => void;
  onClear: () => void;
  onConfirm: () => void;
  onSkip: () => void;
}

function loses(state: GameState, me: Side, a: Action): boolean {
  try {
    const s2 = applyAction(state, me, a);
    return s2.phase === 'over' && s2.winner === other(me);
  } catch {
    return false;
  }
}

export function ActionPanel({ state, me, card, busy, myTurn, pending, waitingFor, onPlay, onUndo, onClear, onConfirm, onSkip }: Props) {
  if (pending) {
    const rest = pending.total - pending.spent;
    return (
      <div className="actions pending">
        <div className="act-title">
          {pending.cardName} · <b>{pending.hint}</b>
        </div>
        {pending.kind !== 'coup' && (
          <div className="plan-list">
            {pending.placements.length === 0 && <span className="muted">Haz clic en un país del mapa.</span>}
            {pending.placements.map((p, i) => (
              <span key={i} className="plan-chip">
                {countryName(p.c, state.era)} {pending.mode === 'remove' ? '−' : '+'}
                {p.n}
              </span>
            ))}
            <span className="plan-left">
              {pending.kind === 'influence' ? `Ops: ${pending.spent}/${pending.total}` : `Puntos: ${pending.spent}/${pending.total}`}
            </span>
          </div>
        )}
        {pending.kind === 'coup' && (
          <div className="plan-list">
            {pending.target ? <CoupOdds state={state} me={me} c={pending.target} ops={pending.total} /> : <span className="muted">Elige un país con influencia rival.</span>}
          </div>
        )}
        <div className="act-btns">
          {pending.kind !== 'coup' && (
            <>
              <button disabled={!pending.placements.length || busy} onClick={onUndo}>
                Deshacer
              </button>
              <button disabled={!pending.placements.length || busy} onClick={onClear}>
                Vaciar
              </button>
            </>
          )}
          <button className="primary" disabled={busy || (pending.kind === 'coup' ? !pending.target : false)} onClick={onConfirm}>
            {pending.kind === 'coup' ? 'Ejecutar golpe' : rest > 0 && pending.hasOptions ? `Confirmar (sobran ${rest})` : 'Confirmar'}
          </button>
          {!pending.hasOptions && (
            <button disabled={busy} onClick={onSkip}>
              Omitir
            </button>
          )}
        </div>
      </div>
    );
  }

  if (waitingFor && waitingFor !== me) {
    return <div className="actions idle">Esperando al {waitingFor === 'W' ? 'Occidente' : 'Bloque Oriental'}…</div>;
  }
  if (!card) {
    return <div className="actions idle">{myTurn ? 'Es tu turno: elige una carta de tu mano.' : 'Espera tu turno.'}</div>;
  }
  const def = CARD[card];
  if (!def) return null;
  const rival = def.owner === other(me);
  const evBlock = eventBlockedReason(me, card);
  const techBlock = techBlockedReason(state, me, card);
  const isScore = def.kind === 'score';
  const evLoses = !evBlock && myTurn && loses(state, me, { type: 'playEvent', card });
  const evTension = !evBlock && lowersTension(def);
  const idx = state.tech[me];
  const limit = state.tech[me] < state.tech[other(me)] ? 4 : 3;
  const rivalLines = rival ? describeEffects(def, state.era) : [];
  return (
    <div className="actions">
      <div className="act-title">
        <b>{def.name}</b> · {isScore ? 'puntuación' : `${def.ops} ops`}
      </div>
      <div className="act-btns">
        {isScore ? (
          <button className="primary" disabled={!myTurn || busy} onClick={() => onPlay({ type: 'playScore', card })}>
            Puntuar región
          </button>
        ) : (
          <>
            <button
              className={evLoses ? 'danger' : ''}
              disabled={!myTurn || busy || !!evBlock}
              title={evBlock ?? 'Activa el evento de la carta'}
              onClick={() => onPlay({ type: 'playEvent', card })}
            >
              Evento
            </button>
            <button disabled={!myTurn || busy} onClick={() => onPlay({ type: 'playOps', card, kind: 'influence' })} title="Colocar influencia con los ops de la carta">
              Influencia
            </button>
            <button disabled={!myTurn || busy} onClick={() => onPlay({ type: 'playOps', card, kind: 'coup' })} title="Golpe: 1d6 + ops − 2×estabilidad">
              Golpe
            </button>
            <button
              disabled={!myTurn || busy || !!techBlock}
              title={techBlock ?? `${TECH_NAMES[idx]}: éxito con ${limit} o menos`}
              onClick={() => onPlay({ type: 'playTech', card })}
            >
              Tecnología
            </button>
          </>
        )}
      </div>
      <div className="warns">
        {!isScore && rival && (
          <div className="warn rival">
            ⚠ Carta del rival: si la juegas por <b>operaciones</b> se activa primero su evento: {rivalLines.join(' ')}
          </div>
        )}
        {!isScore && rival && lowersTension(def) && <div className="warn nuc">☢ Ese evento baja la Tensión (nunca por debajo de 2 al activarse así).</div>}
        {evLoses && <div className="warn lose">☢ Si lo juegas como evento la Tensión llegaría a 1 y perderías.</div>}
        {!evLoses && evTension && myTurn && <div className="warn nuc">☢ El evento baja la Tensión: ahora es {state.tension}.</div>}
        {!isScore && state.tension <= 2 && <div className="warn nuc">☢ Tensión {state.tension}: un golpe en país clave la llevaría a {state.tension - 1}{state.tension - 1 <= 1 ? ' y perderías' : ''}.</div>}
        {!isScore && !techBlock && <div className="info">Tecnología: «{TECH_NAMES[idx]}» exige {TECH_MIN_OPS[idx]}+ ops; éxito con {limit} o menos (1d6). La carta se descarta sin activar su evento.</div>}
        {!isScore && techBlock && <div className="info">Tecnología no disponible: {techBlock}.</div>}
        {!isScore && coupBonus(state, me) > 0 && <div className="info">Capacidad de IA: +{coupBonus(state, me)} ops a tu primer golpe de este turno.</div>}
      </div>
    </div>
  );
}

function CoupOdds({ state, me, c, ops }: { state: GameState; me: Side; c: CountryId; ops: number }) {
  const bonus = coupBonus(state, me);
  const rows = [1, 2, 3, 4, 5, 6].map((d) => coupStrength(d, ops, bonus, c));
  const have = state.influence[c][other(me)];
  const need = rows.findIndex((r) => r > 0);
  return (
    <span className="odds">
      <b>{countryName(c, state.era)}</b> (estab. {COUNTRY[c].stab}, rival {have}): 1d6 + {ops}
      {bonus ? ` + ${bonus} IA` : ''} − {2 * COUNTRY[c].stab} →{' '}
      {rows.map((r, i) => (
        <i key={i} className={r > 0 ? 'ok' : 'no'} title={`dado ${i + 1}: ${r}`}>
          {r}
        </i>
      ))}
      {need < 0 ? ' · imposible' : ` · éxito con ${need + 1}+`}
      {COUNTRY[c].key && <em> · país clave: Tensión −1</em>}
    </span>
  );
}
