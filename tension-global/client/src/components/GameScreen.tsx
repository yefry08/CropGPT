import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  CARD,
  COUNTRY,
  activeIds,
  accessibleIn,
  actingSide,
  freeTargets,
  other,
  simulatePlacements,
  coupTargets,
  type Action,
  type CardId,
  type CountryId,
  type Era,
  type Placement,
  type Pending,
  type Side,
} from '@tg/shared';
import { isSoundOn, setSound, sfx } from '../lib/sound';
import type { GameController } from '../hooks/types';
import { ActionPanel, type PendingUI } from './ActionPanel';
import { CardView } from './CardView';
import { MapView } from './MapView';
import { DiceOverlay, EraModal, GameOverModal, RulesModal, type DiceEvent } from './Modals';
import { ChatPanel, LogPanel, RulesPanel, ScorePanel } from './Panels';
import { TopBar } from './TopBar';

type Tab = 'log' | 'score' | 'chat' | 'rules';

function addPlacement(list: Placement[], c: CountryId): Placement[] {
  const last = list[list.length - 1];
  if (last && last.c === c) return [...list.slice(0, -1), { c, n: last.n + 1 }];
  return [...list, { c, n: 1 }];
}

function undoPlacement(list: Placement[]): Placement[] {
  const last = list[list.length - 1];
  if (!last) return list;
  return last.n > 1 ? [...list.slice(0, -1), { c: last.c, n: last.n - 1 }] : list.slice(0, -1);
}

export function GameScreen({ ctrl, onExit }: { ctrl: GameController; onExit: () => void }) {
  const { state, me } = ctrl;
  const [sel, setSel] = useState<CardId | null>(null);
  const [placements, setPlacements] = useState<Placement[]>([]);
  const [target, setTarget] = useState<CountryId | null>(null);
  const [inspect, setInspect] = useState<CountryId | null>(null);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>('log');
  const [drawer, setDrawer] = useState(false);
  const [handOpen, setHandOpen] = useState(false);
  const [help, setHelp] = useState(false);
  const [sound, setSoundState] = useState(isSoundOn());
  const [eraModal, setEraModal] = useState<Era | null>(state.turn === 1 && state.round === 1 ? 1 : null);
  const [dice, setDice] = useState<DiceEvent[]>([]);
  const lastSeq = useRef(state.logSeq);
  const lastEra = useRef<Era>(state.era);
  const lastTension = useRef(state.tension);
  const lastVersion = useRef(state.version);
  const [resetKey] = useState(0);

  const acting = actingSide(state);
  const pend: Pending | undefined = state.queue[0];
  const mine = !!me && !!pend && pend.side === me;
  const myTurn = !!me && acting === me && state.phase === 'play';

  const flash = useCallback((m: string) => {
    setToast(m);
    setTimeout(() => setToast((t) => (t === m ? null : t)), 3200);
  }, []);

  // Pausar la IA local mientras hay ventanas abiertas.
  useEffect(() => {
    ctrl.setPaused?.(eraModal !== null || state.phase === 'over');
  }, [eraModal, state.phase]); // eslint-disable-line react-hooks/exhaustive-deps

  // Reacciones a cambios de estado: dados, eras, sonido.
  useEffect(() => {
    if (state.logSeq !== lastSeq.current) {
      const fresh = state.log.filter((l) => l.id > lastSeq.current);
      lastSeq.current = state.logSeq;
      const rolls = fresh.filter((l) => l.dice).map((l) => ({ id: l.id, value: l.dice!.value, label: l.dice!.label, side: l.dice!.side }));
      if (rolls.length) {
        setDice((q) => [...q, ...rolls]);
        sfx.dice();
      }
      if (fresh.some((l) => l.kind === 'inf')) sfx.place();
      if (fresh.some((l) => l.kind === 'event')) sfx.event();
    }
    if (state.era !== lastEra.current) {
      lastEra.current = state.era;
      setEraModal(state.era);
      sfx.era();
    }
    if (state.tension < lastTension.current && state.tension <= 2) sfx.alarm();
    lastTension.current = state.tension;
    if (state.phase === 'over') sfx.win();
  }, [state.logSeq, state.era, state.tension, state.phase]); // eslint-disable-line react-hooks/exhaustive-deps

  // Al cambiar el estado se descartan selecciones locales obsoletas.
  useEffect(() => {
    if (lastVersion.current !== state.version) {
      lastVersion.current = state.version;
      setPlacements([]);
      setTarget(null);
      if (!(me && actingSide(state) === me && !state.queue.length)) setSel(null);
      else if (sel && !state.hands[me!].includes(sel)) setSel(null);
    }
  }, [state.version]); // eslint-disable-line react-hooks/exhaustive-deps

  // ——— Objetivos seleccionables en el mapa ———
  const sim = useMemo(() => {
    if (mine && pend?.kind === 'ops' && pend.mode === 'influence') return simulatePlacements(state, me!, pend.ops, placements);
    return null;
  }, [state, mine, pend, placements, me]);

  const freeSpent = useMemo(() => placements.reduce((a, p) => a + p.n, 0), [placements]);

  const selectable = useMemo(() => {
    const out = new Set<CountryId>();
    if (!mine || !pend || !me) return out;
    if (pend.kind === 'ops' && pend.mode === 'influence' && sim) {
      const left = pend.ops - sim.spent;
      for (const c of activeIds(state.era)) {
        if (!accessibleIn(sim.influence, state.era, me, c)) continue;
        const cost = controlledBy(sim.influence[c], c, other(me)) ? 2 : 1;
        if (cost <= left) out.add(c);
      }
    } else if (pend.kind === 'ops' && pend.mode === 'coup') {
      for (const c of coupTargets(state, me)) out.add(c);
    } else if (pend.kind === 'free') {
      if (freeSpent >= pend.n) return out;
      const per: Record<string, number> = {};
      for (const p of placements) per[p.c] = (per[p.c] ?? 0) + p.n;
      for (const c of freeTargets(state, me, pend.o)) {
        const used = per[c] ?? 0;
        if (used >= (pend.o.max ?? 99)) continue;
        if (pend.o.mode === 'remove' && used >= state.influence[c][other(me)]) continue;
        out.add(c);
      }
    }
    return out;
  }, [mine, pend, sim, state, me, placements, freeSpent]);

  const planned = useMemo(() => {
    const m: Record<CountryId, number> = {};
    for (const p of placements) m[p.c] = (m[p.c] ?? 0) + p.n;
    return m;
  }, [placements]);

  const plannedSign: 1 | -1 = mine && pend?.kind === 'free' && pend.o.mode === 'remove' ? -1 : 1;

  const onCountry = useCallback(
    (id: CountryId) => {
      if (mine && pend) {
        if (!selectable.has(id)) {
          setInspect(id);
          if (pend.kind !== 'free' || freeSpent < pend.n) flash('Ese país no es un objetivo válido ahora.');
          return;
        }
        if (pend.kind === 'ops' && pend.mode === 'coup') setTarget(id);
        else setPlacements((p) => addPlacement(p, id));
        sfx.select();
        setInspect(id);
        return;
      }
      setInspect((cur) => (cur === id ? null : id));
    },
    [mine, pend, selectable, freeSpent, flash],
  );

  const run = useCallback(
    async (a: Action) => {
      setBusy(true);
      const err = await ctrl.send(a);
      setBusy(false);
      if (err) flash(err);
      else {
        setSel(null);
        setPlacements([]);
        setTarget(null);
      }
    },
    [ctrl, flash],
  );

  // ——— Interfaz pendiente ———
  const pendingUI: PendingUI | null = useMemo(() => {
    if (!mine || !pend || !me) return null;
    if (pend.kind === 'ops') {
      const name = CARD[pend.cardId]?.name ?? 'Operaciones';
      if (pend.mode === 'influence') {
        const spent = sim?.spent ?? 0;
        return {
          kind: 'influence',
          total: pend.ops,
          spent,
          placements,
          target: null,
          hasOptions: selectable.size > 0 || placements.length > 0,
          cardName: name,
          hint: `Coloca influencia (${pend.ops} ops; cuesta 2 en países controlados por el rival)`,
        };
      }
      return {
        kind: 'coup',
        total: pend.ops,
        spent: 0,
        placements: [],
        target,
        hasOptions: selectable.size > 0,
        cardName: name,
        hint: 'Elige el país del golpe (con influencia rival)',
      };
    }
    const remove = pend.o.mode === 'remove';
    const max = pend.o.max;
    return {
      kind: 'free',
      total: pend.n,
      spent: freeSpent,
      placements,
      target: null,
      mode: remove ? 'remove' : 'add',
      hasOptions: selectable.size > 0 || placements.length > 0,
      cardName: CARD[pend.cardId]?.name ?? 'Evento',
      hint: `${remove ? 'Quita' : 'Coloca'} hasta ${pend.n} de influencia${max ? ` (máx. ${max} por país)` : ''}`,
    };
  }, [mine, pend, me, sim, placements, selectable, target, freeSpent]);

  const confirm = () => {
    if (!pend) return;
    if (pend.kind === 'ops' && pend.mode === 'coup') {
      if (target) void run({ type: 'commitCoup', target });
    } else if (pend.kind === 'ops') void run({ type: 'commitInfluence', placements });
    else void run({ type: 'resolveFree', placements });
  };

  const hand = me ? state.hands[me] : [];
  const oppHand = me ? state.hands[other(me)].length : state.hands.W.length;

  const banner = (() => {
    if (state.phase === 'over') return null;
    if (mine && pendingUI) return pendingUI.hint;
    if (pend && me && pend.side !== me) return `${pend.side === 'W' ? 'Occidente' : 'El Bloque Oriental'} resuelve «${CARD[pend.cardId]?.name}»…`;
    if (!me) return `Espectador · juega ${acting === 'W' ? 'Occidente' : 'el Bloque Oriental'}`;
    if (!myTurn) return ctrl.aiThinking ? 'La IA está pensando…' : `Turno del ${acting === 'W' ? 'Occidente' : 'Bloque Oriental'}`;
    return null;
  })();

  const online = ctrl.online;
  const oppSeat = online?.info && me ? online.info.seats[other(me)] : null;

  return (
    <div className={`game${drawer ? ' drawer-open' : ''}${handOpen ? ' hand-open' : ''}`}>
      <TopBar
        state={state}
        me={me}
        sound={sound}
        onSound={() => {
          setSound(!sound);
          setSoundState(!sound);
          sfx.select();
        }}
        onHelp={() => setHelp(true)}
        onDrawer={() => setDrawer((d) => !d)}
        onMenu={() => {
          if (state.phase === 'over' || window.confirm(online ? '¿Salir de la sala? Podrás volver con el mismo enlace.' : '¿Volver al menú? La partida se guarda para continuarla.')) onExit();
        }}
      />
      {online && !online.connected && <div className="conn-banner">Sin conexión con el servidor. Reintentando… la partida sigue en el servidor.</div>}
      {online && online.connected && oppSeat && !oppSeat.connected && (
        <div className="conn-banner warn">El rival está desconectado. La partida espera a que vuelva (puede reconectarse con su enlace).</div>
      )}
      <div className="game-main">
        <section className="map-col">
          <MapView
            state={state}
            me={me}
            selectable={selectable}
            selected={target ?? inspect}
            planned={planned}
            plannedSign={plannedSign}
            onCountry={onCountry}
            resetKey={resetKey}
          />
          {banner && <div className={`banner${mine ? ' mine' : ''}`}>{banner}</div>}
          {toast && <div className="toast" role="alert">{toast}</div>}
          <DiceOverlay queue={dice} onNext={() => setDice((q) => q.slice(1))} />

          <div className="hand-dock">
            <button className="hand-handle" onClick={() => setHandOpen((o) => !o)} aria-expanded={handOpen}>
              {handOpen ? '▼' : '▲'} Mano ({hand.length}) · Mazo {state.deck.length} · Rival {oppHand}
            </button>
            {me ? (
              <>
                <ActionPanel
                  state={state}
                  me={me}
                  card={sel}
                  busy={busy}
                  myTurn={myTurn && !pend}
                  pending={pendingUI}
                  waitingFor={pend && pend.side !== me ? pend.side : !myTurn && state.phase === 'play' ? acting : null}
                  onPlay={(a) => {
                    if (a.type === 'playOps' || a.type === 'playEvent' || a.type === 'playTech' || a.type === 'playScore') setHandOpen(false);
                    void run(a);
                  }}
                  onUndo={() => setPlacements(undoPlacement)}
                  onClear={() => setPlacements([])}
                  onConfirm={confirm}
                  onSkip={() => void run({ type: 'skipOps' })}
                />
                <div className="hand">
                  {hand.map((id, i) => (
                    <CardView
                      key={id + i}
                      id={id}
                      era={state.era}
                      selected={sel === id}
                      dim={!myTurn}
                      onClick={() => {
                        sfx.select();
                        setSel((s) => (s === id ? null : id));
                      }}
                    />
                  ))}
                </div>
              </>
            ) : (
              <div className="actions idle">Modo espectador: no ves las manos. Mano de Occidente {state.hands.W.length} · Oriental {state.hands.E.length}.</div>
            )}
          </div>
        </section>

        <aside className="side-col">
          <nav className="tabs">
            {([['log', 'Despachos'], ['score', 'Puntuar'], ...(online ? [['chat', 'Chat']] : []), ['rules', 'Reglas']] as [Tab, string][]).map(([k, label]) => (
              <button key={k} className={tab === k ? 'on' : ''} onClick={() => setTab(k)}>
                {label}
              </button>
            ))}
            <button className="close-drawer" onClick={() => setDrawer(false)} aria-label="Cerrar">
              ✕
            </button>
          </nav>
          <div className="tab-body">
            {tab === 'log' && <LogPanel state={state} />}
            {tab === 'score' && <ScorePanel state={state} me={me} />}
            {tab === 'chat' && online && <ChatPanel msgs={online.chat} onSend={online.sendChat} />}
            {tab === 'rules' && <RulesPanel />}
          </div>
        </aside>
      </div>

      {help && <RulesModal onClose={() => setHelp(false)} />}
      {eraModal && state.phase === 'play' && <EraModal era={eraModal} state={state} onClose={() => setEraModal(null)} />}
      {state.phase === 'over' && <GameOverModal state={state} me={me} onExit={onExit} />}
    </div>
  );
}

/** ¿Controla `side` este país? (para el coste doble de colocar en territorio rival). */
function controlledBy(inf: { W: number; E: number }, c: CountryId, side: Side): boolean {
  const stab = COUNTRY[c].stab;
  const mine = side === 'W' ? inf.W : inf.E;
  const theirs = side === 'W' ? inf.E : inf.W;
  return mine >= stab && mine - theirs >= stab;
}
