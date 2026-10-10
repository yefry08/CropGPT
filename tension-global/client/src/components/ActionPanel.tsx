import {
  CARD,
  COUNTRY,
  TECH_MIN_OPS,
  TECH_NAMES,
  TECH_NAMES_EN,
  applyAction,
  cardName,
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
import { useLang } from '../i18n';

export interface PendingUI {
  kind: 'influence' | 'coup' | 'free';
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
  const { lang, tr } = useLang();
  const techNames = lang === 'en' ? TECH_NAMES_EN : TECH_NAMES;
  if (pending) {
    const rest = pending.total - pending.spent;
    return (
      <div className="actions pending">
        <div className="act-title">
          {pending.cardName} · <b>{pending.hint}</b>
        </div>
        {pending.kind !== 'coup' && (
          <div className="plan-list">
            {pending.placements.length === 0 && <span className="muted">{tr('Haz clic en un país del mapa.', 'Click a country on the map.')}</span>}
            {pending.placements.map((p, i) => (
              <span key={i} className="plan-chip">
                {countryName(p.c, state.era, lang)} {pending.mode === 'remove' ? '−' : '+'}
                {p.n}
              </span>
            ))}
            <span className="plan-left">
              {pending.kind === 'influence' ? `Ops: ${pending.spent}/${pending.total}` : `${tr('Puntos', 'Points')}: ${pending.spent}/${pending.total}`}
            </span>
          </div>
        )}
        {pending.kind === 'coup' && (
          <div className="plan-list">
            {pending.target ? (
              <CoupOdds state={state} me={me} c={pending.target} ops={pending.total} />
            ) : (
              <span className="muted">{tr('Elige un país con influencia rival.', 'Pick a country with rival influence.')}</span>
            )}
          </div>
        )}
        <div className="act-btns">
          {pending.kind !== 'coup' && (
            <>
              <button disabled={!pending.placements.length || busy} onClick={onUndo}>
                {tr('Deshacer', 'Undo')}
              </button>
              <button disabled={!pending.placements.length || busy} onClick={onClear}>
                {tr('Vaciar', 'Clear')}
              </button>
            </>
          )}
          <button className="primary" disabled={busy || (pending.kind === 'coup' ? !pending.target : false)} onClick={onConfirm}>
            {pending.kind === 'coup'
              ? tr('Ejecutar golpe', 'Launch coup')
              : rest > 0 && pending.hasOptions
                ? tr(`Confirmar (sobran ${rest})`, `Confirm (${rest} unused)`)
                : tr('Confirmar', 'Confirm')}
          </button>
          {!pending.hasOptions && (
            <button disabled={busy} onClick={onSkip}>
              {tr('Omitir', 'Skip')}
            </button>
          )}
        </div>
      </div>
    );
  }

  if (waitingFor && waitingFor !== me) {
    return <div className="actions idle">{waitingFor === 'W' ? tr('Esperando a Occidente…', 'Waiting for the West…') : tr('Esperando al Bloque Oriental…', 'Waiting for the Eastern Bloc…')}</div>;
  }
  if (!card) {
    return <div className="actions idle">{myTurn ? tr('Es tu turno: elige una carta de tu mano.', 'Your turn: pick a card from your hand.') : tr('Espera tu turno.', 'Wait for your turn.')}</div>;
  }
  const def = CARD[card];
  if (!def) return null;
  const rival = def.owner === other(me);
  const evBlock = eventBlockedReason(me, card, lang);
  const techBlock = techBlockedReason(state, me, card, lang);
  const isScore = def.kind === 'score';
  const evLoses = !evBlock && myTurn && loses(state, me, { type: 'playEvent', card });
  const evTension = !evBlock && lowersTension(def);
  const idx = state.tech[me];
  const limit = state.tech[me] < state.tech[other(me)] ? 4 : 3;
  const rivalLines = rival ? describeEffects(def, state.era, lang) : [];
  return (
    <div className="actions">
      <div className="act-title">
        <b>{cardName(card, lang)}</b> · {isScore ? tr('puntuación', 'scoring') : `${def.ops} ops`}
      </div>
      <div className="act-btns">
        {isScore ? (
          <button className="primary" disabled={!myTurn || busy} onClick={() => onPlay({ type: 'playScore', card })}>
            {tr('Puntuar región', 'Score region')}
          </button>
        ) : (
          <>
            <button className={evLoses ? 'danger' : ''} disabled={!myTurn || busy || !!evBlock} title={evBlock ?? tr('Activa el evento de la carta', 'Trigger the card’s event')} onClick={() => onPlay({ type: 'playEvent', card })}>
              {tr('Evento', 'Event')}
            </button>
            <button disabled={!myTurn || busy} onClick={() => onPlay({ type: 'playOps', card, kind: 'influence' })} title={tr('Colocar influencia con los ops de la carta', 'Place influence with the card’s ops')}>
              {tr('Influencia', 'Influence')}
            </button>
            <button disabled={!myTurn || busy} onClick={() => onPlay({ type: 'playOps', card, kind: 'coup' })} title={tr('Golpe: 1d6 + ops − 2×estabilidad', 'Coup: 1d6 + ops − 2×stability')}>
              {tr('Golpe', 'Coup')}
            </button>
            <button
              disabled={!myTurn || busy || !!techBlock}
              title={techBlock ?? tr(`${techNames[idx]}: éxito con ${limit} o menos`, `${techNames[idx]}: success on ${limit} or less`)}
              onClick={() => onPlay({ type: 'playTech', card })}
            >
              {tr('Tecnología', 'Technology')}
            </button>
          </>
        )}
      </div>
      <div className="warns">
        {!isScore && rival && (
          <div className="warn rival">
            {tr('⚠ Carta del rival: si la juegas por ', '⚠ Rival card: if you play it for ')}
            <b>{tr('operaciones', 'operations')}</b>
            {tr(' se activa primero su evento: ', ', its event triggers first: ')}
            {rivalLines.join(' ')}
          </div>
        )}
        {!isScore && rival && lowersTension(def) && (
          <div className="warn nuc">{tr('☢ Ese evento baja la Tensión (nunca por debajo de 2 al activarse así).', '☢ That event lowers Tension (never below 2 when triggered this way).')}</div>
        )}
        {evLoses && <div className="warn lose">{tr('☢ Si lo juegas como evento la Tensión llegaría a 1 y perderías.', '☢ Playing it as an event would take Tension to 1 and you would lose.')}</div>}
        {!evLoses && evTension && myTurn && <div className="warn nuc">{tr(`☢ El evento baja la Tensión: ahora es ${state.tension}.`, `☢ The event lowers Tension: it is now ${state.tension}.`)}</div>}
        {!isScore && state.tension <= 2 && (
          <div className="warn nuc">
            {tr(
              `☢ Tensión ${state.tension}: un golpe en país clave la llevaría a ${state.tension - 1}${state.tension - 1 <= 1 ? ' y perderías' : ''}.`,
              `☢ Tension ${state.tension}: a coup in a key country would take it to ${state.tension - 1}${state.tension - 1 <= 1 ? ' and you would lose' : ''}.`,
            )}
          </div>
        )}
        {!isScore && !techBlock && (
          <div className="info">
            {tr(
              `Tecnología: «${techNames[idx]}» exige ${TECH_MIN_OPS[idx]}+ ops; éxito con ${limit} o menos (1d6). La carta se descarta sin activar su evento.`,
              `Technology: “${techNames[idx]}” needs ${TECH_MIN_OPS[idx]}+ ops; success on ${limit} or less (1d6). The card is discarded without triggering its event.`,
            )}
          </div>
        )}
        {!isScore && techBlock && <div className="info">{tr('Tecnología no disponible', 'Technology unavailable')}: {techBlock}.</div>}
        {!isScore && coupBonus(state, me) > 0 && (
          <div className="info">{tr(`Capacidad de IA: +${coupBonus(state, me)} ops a tu primer golpe de este turno.`, `AI Capability: +${coupBonus(state, me)} ops to your first coup this turn.`)}</div>
        )}
      </div>
    </div>
  );
}

function CoupOdds({ state, me, c, ops }: { state: GameState; me: Side; c: CountryId; ops: number }) {
  const { lang, tr } = useLang();
  const bonus = coupBonus(state, me);
  const rows = [1, 2, 3, 4, 5, 6].map((d) => coupStrength(d, ops, bonus, c));
  const have = state.influence[c][other(me)];
  const need = rows.findIndex((r) => r > 0);
  return (
    <span className="odds">
      <b>{countryName(c, state.era, lang)}</b> ({tr('estab.', 'stab.')} {COUNTRY[c].stab}, {tr('rival', 'rival')} {have}): 1d6 + {ops}
      {bonus ? ` + ${bonus} ${tr('IA', 'AI')}` : ''} − {2 * COUNTRY[c].stab} →{' '}
      {rows.map((r, i) => (
        <i key={i} className={r > 0 ? 'ok' : 'no'} title={`${tr('dado', 'die')} ${i + 1}: ${r}`}>
          {r}
        </i>
      ))}
      {need < 0 ? tr(' · imposible', ' · impossible') : tr(` · éxito con ${need + 1}+`, ` · success on ${need + 1}+`)}
      {COUNTRY[c].key && <em>{tr(' · país clave: Tensión −1', ' · key country: Tension −1')}</em>}
    </span>
  );
}
