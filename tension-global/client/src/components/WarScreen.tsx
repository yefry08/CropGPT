import { useEffect, useMemo, useRef, useState } from 'react';
import {
  DOMAIN_BEATS,
  DOMAIN_BONUS,
  DOMAIN_NAME,
  DOMAIN_WHY,
  WAR_CARD,
  WAR_DOMAINS,
  WAR_MAX_ROUNDS,
  createWar,
  makeRng,
  warChoose,
  warPlay,
  warTotal,
  type Domain,
  type WarAILevel,
  type WarBattle,
  type WarState,
} from '@tg/shared';
import { LangSwitch, useLang } from '../i18n';
import { isSoundOn, setSound, sfx } from '../lib/sound';

const ICON: Record<Domain, string> = { land: '⛰', sea: '⚓', air: '✈', cyber: '⌨', space: '🛰' };

function WarCardView({ id, onClick, disabled, highlight, small }: { id: string; onClick?: () => void; disabled?: boolean; highlight?: 'win' | 'lose' | 'tie'; small?: boolean }) {
  const { lang, tr } = useLang();
  const c = WAR_CARD[id];
  return (
    <button className={`wcard d-${c.domain}${highlight ? ` h-${highlight}` : ''}${small ? ' small' : ''}`} onClick={onClick} disabled={disabled}>
      <div className="wc-top">
        <span className="wc-power">{c.power}</span>
        <span className="wc-domain">
          {ICON[c.domain]} {DOMAIN_NAME[c.domain][lang]}
        </span>
        <span className="wc-year">{c.year}</span>
      </div>
      <div className="wc-name">{c.name[lang]}</div>
      {!small && <div className="wc-blurb">{c.blurb[lang]}</div>}
      {!small && (
        <div className="wc-beats">
          +{DOMAIN_BONUS} {tr('contra', 'vs')} {ICON[DOMAIN_BEATS[c.domain]]} {DOMAIN_NAME[DOMAIN_BEATS[c.domain]][lang]}
        </div>
      )}
      <div className="wc-tag">{tr('escenario hipotético', 'hypothetical scenario')}</div>
    </button>
  );
}

function FaceDown({ n }: { n: number }) {
  return (
    <div className="wfacedown" aria-label={`${n}`}>
      {Array.from({ length: Math.min(n, 6) }, (_, i) => (
        <span key={i} style={{ left: i * 7 }} />
      ))}
      <b>{n}</b>
    </div>
  );
}

export function WarScreen({ level, onExit }: { level: WarAILevel; onExit: () => void }) {
  const { lang, tr } = useLang();
  const rand = useMemo(() => makeRng((Math.random() * 2 ** 31) | 0), []);
  const [s, setS] = useState<WarState>(() => createWar((Math.random() * 2 ** 31) | 0));
  const [busy, setBusy] = useState(false);
  const [sound, setSoundState] = useState(isSoundOn());
  const [reveal, setReveal] = useState<WarBattle | null>(null);
  const [help, setHelp] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => void (timer.current && clearTimeout(timer.current)), []);

  const play = (id: string) => {
    if (busy || s.phase !== 'choose') return;
    sfx.select();
    setBusy(true);
    if (!s.atWar) setReveal(null);
    const afterMe = warPlay(s, 'p1', id);
    setS(afterMe);
    // La IA elige sin ver tu carta.
    timer.current = setTimeout(() => {
      const ai = warChoose(s, 'p2', level, rand);
      const next = warPlay(afterMe, 'p2', ai);
      setS(next);
      setBusy(false);
      if (next.atWar) {
        sfx.alarm();
        setReveal(null);
      } else if (next.last) {
        setReveal(next.last);
        if (next.last.winner === 'p1') sfx.place();
        else sfx.event();
      }
      if (next.phase === 'over') sfx.win();
    }, 650);
  };

  const restart = () => {
    setS(createWar((Math.random() * 2 ** 31) | 0));
    setReveal(null);
    setBusy(false);
  };

  const me = warTotal(s, 'p1');
  const ai = warTotal(s, 'p2');
  const clashes = s.atWar ? s.clashes : reveal?.clashes ?? [];
  const lastClash = clashes[clashes.length - 1];
  const pendingMine = s.chosen.p1;
  const resultText = (() => {
    if (s.atWar) return tr('¡EMPATE! Estalla la guerra: cada bando arriesga 3 cartas boca abajo. Elige otra carta.', 'TIE! War breaks out: each side risks 3 face-down cards. Pick another card.');
    if (!reveal) return tr('Elige una carta de tu mano para el próximo choque.', 'Pick a card from your hand for the next clash.');
    const won = reveal.won;
    if (reveal.winner === 'p1') return tr(`Ganas la batalla y te llevas ${won} cartas.`, `You win the battle and take ${won} cards.`);
    if (reveal.winner === 'p2') return tr(`La IA gana la batalla y se lleva ${won} cartas.`, `The AI wins the battle and takes ${won} cards.`);
    return tr('Nadie puede seguir: el botín se reparte.', 'Nobody can continue: the spoils are split.');
  })();
  const why = lastClash
    ? (() => {
        const a = WAR_CARD[lastClash.p1];
        const b = WAR_CARD[lastClash.p2];
        if (DOMAIN_BEATS[a.domain] === b.domain) return `+${DOMAIN_BONUS} ${tr('para ti', 'for you')}: ${DOMAIN_WHY[a.domain][lang]}`;
        if (DOMAIN_BEATS[b.domain] === a.domain) return `+${DOMAIN_BONUS} ${tr('para la IA', 'for the AI')}: ${DOMAIN_WHY[b.domain][lang]}`;
        return '';
      })()
    : '';

  return (
    <div className="war">
      <header className="war-top">
        <button className="tb-title" onClick={() => (s.phase === 'over' || window.confirm(tr('¿Salir de la partida?', 'Leave the game?'))) && onExit()}>
          {tr('GUERRA DE', 'CARD')} <b>{tr('CARTAS', 'WAR')}</b>
        </button>
        <div className="war-score">
          <span className="w">
            {tr('Tú', 'You')} <b>{me}</b>
          </span>
          <span className="vs">
            {tr('Ronda', 'Round')} {Math.min(s.round, WAR_MAX_ROUNDS)}/{WAR_MAX_ROUNDS}
          </span>
          <span className="e">
            {tr('IA', 'AI')} <b>{ai}</b>
          </span>
        </div>
        <div className="war-bar" title={tr('Cartas de cada bando (40 en total)', 'Cards per side (40 in total)')}>
          <div className="wb-me" style={{ width: `${(me / 40) * 100}%` }} />
        </div>
        <div className="tb-actions">
          <LangSwitch />
          <button
            onClick={() => {
              setSound(!sound);
              setSoundState(!sound);
            }}
            aria-label={tr('Sonido', 'Sound')}
          >
            {sound ? '🔊' : '🔇'}
          </button>
          <button onClick={() => setHelp(true)} aria-label={tr('Reglas', 'Rules')}>
            ?
          </button>
        </div>
      </header>

      <div className="war-cycle" title={tr('Cada dominio vence al siguiente: +2', 'Each domain beats the next one: +2')}>
        {WAR_DOMAINS.map((d) => (
          <span key={d}>
            <i className={`dot d-${d}`} />
            {ICON[d]} {DOMAIN_NAME[d][lang]} <em>›</em>
          </span>
        ))}
        <span className="muted">
          {ICON.cyber} {DOMAIN_NAME.cyber[lang]} · {tr('ventaja +2', '+2 edge')}
        </span>
      </div>

      <section className="battlefield">
        <div className="bf-side ai">
          <div className="bf-label">
            {tr('IA', 'AI')} · {tr('mano', 'hand')} {s.hands.p2.length} · {tr('mazo', 'deck')} {s.decks.p2.length + s.won.p2.length}
          </div>
          <div className="bf-slot">
            {busy && !lastClash ? <div className="wcard back thinking">?</div> : lastClash ? <WarCardView id={lastClash.p2} small highlight={lastClash.s2 > lastClash.s1 ? 'win' : lastClash.s2 < lastClash.s1 ? 'lose' : 'tie'} /> : <div className="wcard empty" />}
            {lastClash && <span className="bf-score">{lastClash.s2}</span>}
          </div>
        </div>
        <div className="bf-center">
          {(s.atWar || (reveal && reveal.faceDown > 0)) && <FaceDown n={s.atWar ? s.faceDown : reveal!.faceDown} />}
          <div className={`bf-result${s.atWar ? ' war-alert' : reveal?.winner === 'p1' ? ' good' : reveal?.winner === 'p2' ? ' bad' : ''}`}>{resultText}</div>
          {why && <div className="bf-why">{why}</div>}
          {s.atWar && clashes.length > 0 && (
            <div className="bf-why">
              {tr('En juego', 'At stake')}: {s.pot.length} {tr('cartas', 'cards')}
            </div>
          )}
        </div>
        <div className="bf-side me">
          <div className="bf-slot">
            {pendingMine ? <WarCardView id={pendingMine} small /> : lastClash ? <WarCardView id={lastClash.p1} small highlight={lastClash.s1 > lastClash.s2 ? 'win' : lastClash.s1 < lastClash.s2 ? 'lose' : 'tie'} /> : <div className="wcard empty" />}
            {lastClash && !pendingMine && <span className="bf-score">{lastClash.s1}</span>}
          </div>
          <div className="bf-label">
            {tr('Tú', 'You')} · {tr('mazo', 'deck')} {s.decks.p1.length + s.won.p1.length}
          </div>
        </div>
      </section>

      <section className="war-hand">
        {s.hands.p1.map((id) => (
          <WarCardView key={id} id={id} onClick={() => play(id)} disabled={busy || s.phase !== 'choose'} />
        ))}
      </section>

      {help && (
        <div className="modal-back" onClick={() => setHelp(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>{tr('Guerra de cartas', 'Card War')}</h2>
            <ul>
              <li>{tr('Cada uno empieza con 20 cartas y una mano de 5.', 'Each side starts with 20 cards and a hand of 5.')}</li>
              <li>{tr('En cada ronda ambos eligen una carta a la vez, sin ver la del otro. Gana la de mayor poder y se lleva las dos.', 'Each round both pick a card at the same time, without seeing the other. The higher power wins and takes both.')}</li>
              <li>
                {tr('Ventaja de dominio (+2):', 'Domain edge (+2):')} {WAR_DOMAINS.map((d) => `${DOMAIN_NAME[d][lang]} › ${DOMAIN_NAME[DOMAIN_BEATS[d]][lang]}`).join(' · ')}.
              </li>
              <li>{tr('Empate: ¡guerra! Cada bando pone 3 cartas boca abajo y juega otra; el ganador se lleva todo el botín.', 'Tie: war! Each side puts 3 cards face down and plays another; the winner takes the whole pot.')}</li>
              <li>{tr('Las cartas ganadas vuelven a tu mazo. Pierde quien se queda sin cartas; tras 40 rondas gana quien tenga más.', 'Won cards go back into your deck. Whoever runs out of cards loses; after 40 rounds the side with more cards wins.')}</li>
              <li>{tr('Todas las cartas son escenarios hipotéticos de conflictos futuros, no predicciones.', 'All cards are hypothetical future-conflict scenarios, not predictions.')}</li>
            </ul>
            <button className="primary" onClick={() => setHelp(false)}>
              {tr('Cerrar', 'Close')}
            </button>
          </div>
        </div>
      )}

      {s.phase === 'over' && (
        <div className="modal-back">
          <div className={`modal over-modal ${s.winner === 'p1' ? 'w' : s.winner === 'p2' ? 'e' : ''}`}>
            <div className="era-num">{tr('FIN DE LA GUERRA', 'WAR OVER')}</div>
            <h2>{s.winner === 'p1' ? tr('¡Victoria!', 'Victory!') : s.winner === 'p2' ? tr('Derrota', 'Defeat') : tr('Empate', 'Draw')}</h2>
            <p>
              {tr('Cartas', 'Cards')}: {tr('tú', 'you')} {me} · {tr('IA', 'AI')} {ai} · {s.history.length} {tr('batallas', 'battles')}
            </p>
            <div className="row">
              <button className="primary" onClick={restart}>
                {tr('Otra partida', 'Play again')}
              </button>
              <button onClick={onExit}>{tr('Volver al menú', 'Back to menu')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
