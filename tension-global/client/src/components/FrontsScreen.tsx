import { useEffect, useRef, useState } from 'react';
import {
  F_COST,
  F_DECISION,
  F_LINE_MAX,
  F_PLAN_MAX,
  F_RESULT,
  F_WEEKS,
  apPerWeek,
  coalitionPower,
  consensus,
  createFronts,
  decisionDelay,
  fBlocked,
  fWon,
  firm,
  frontsAct,
  type FAction,
  type FLevel,
  type FrontsState,
} from '@tg/shared';
import { LangSwitch, useLang } from '../i18n';
import { isSoundOn, setSound, sfx } from '../lib/sound';

function Gauge({ label, sub, value, max, danger, invert }: { label: string; sub: string; value: number; max: number; danger: boolean; invert?: boolean }) {
  const pct = (value / max) * 100;
  return (
    <div className={`fg${danger ? ' danger' : ''}${invert ? ' inv' : ''}`}>
      <div className="fg-head">
        <b>{label}</b>
        <span>{sub}</span>
        <em>
          {value}/{max}
        </em>
      </div>
      <div className="fg-bar">
        <div style={{ width: `${pct}%` }} />
        {!invert && Array.from({ length: max - 1 }, (_, i) => <i key={i} style={{ left: `${((i + 1) / max) * 100}%` }} />)}
      </div>
    </div>
  );
}

export function FrontsScreen({ level, onExit }: { level: FLevel; onExit: () => void }) {
  const { lang, tr } = useLang();
  const [s, setS] = useState<FrontsState>(() => createFronts((Math.random() * 2 ** 31) | 0, level));
  const [sound, setSoundState] = useState(isSoundOn());
  const [help, setHelp] = useState(() => {
    try {
      return !localStorage.getItem('tg-fronts-help');
    } catch {
      return true;
    }
  });
  const [err, setErr] = useState<string | null>(null);
  const logRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight });
  }, [s.log.length]);

  const act = (a: FAction) => {
    const why = fBlocked(s, a, lang);
    if (why) {
      setErr(why);
      return;
    }
    setErr(null);
    const next = frontsAct(s, a);
    if (a.t === 'end') {
      if (next.phase === 'over') (fWon(next) ? sfx.win : sfx.alarm)();
      else if (next.report.some((r) => r.kind === 'bad')) sfx.event();
      else sfx.place();
    } else sfx.select();
    setS(next);
  };
  const closeHelp = () => {
    setHelp(false);
    try {
      localStorage.setItem('tg-fronts-help', '1');
    } catch {
      /* ignorar */
    }
  };

  const delay = decisionDelay(s);
  const btn = (a: FAction, title: string, desc: string, cls = '') => {
    const why = fBlocked(s, a, lang);
    const cost = a.t !== 'focus' && a.t !== 'end' ? F_COST[a.t] : 0;
    return (
      <button className={`fa ${cls}`} disabled={!!why} title={why ?? ''} onClick={() => act(a)}>
        <span className="fa-cost">{'●'.repeat(cost)}</span>
        <b>{title}</b>
        <small>{why ?? desc}</small>
      </button>
    );
  };
  const r = s.result ? F_RESULT[s.result] : null;
  const avgDelay = s.stats.delays.length ? (s.stats.delays.reduce((a, b) => a + b, 0) / s.stats.delays.length).toFixed(1) : '—';

  return (
    <div className="fronts">
      <header className="war-top">
        <button className="tb-title" onClick={() => (s.phase === 'over' || window.confirm(tr('¿Salir de la simulación?', 'Leave the simulation?'))) && onExit()}>
          {tr('DOS', 'TWO')} <b>{tr('FRENTES', 'FRONTS')}</b>
        </button>
        <div className="war-score">
          <span className="vs">
            {tr('Semana', 'Week')} <b>{s.week}</b>/{F_WEEKS}
          </span>
          <span className="fap" title={tr('Puntos de acción de esta semana', 'Action points this week')}>
            {Array.from({ length: apPerWeek(s) }, (_, i) => (
              <i key={i} className={i < s.ap ? 'on' : ''} />
            ))}
          </span>
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

      <div className="fronts-body">
        <section className="fpanel fstatus">
          <Gauge label={tr('Flanco este', 'Eastern flank')} sub={tr('Rusia · corredor de Suwałki', 'Russia · Suwałki corridor')} value={s.line.europe} max={F_LINE_MAX} danger={s.line.europe >= 7} />
          <Gauge label={tr('Estrecho de Taiwán', 'Taiwan Strait')} sub={tr('China · bloqueo e invasión', 'China · blockade and invasion')} value={s.line.pacific} max={F_LINE_MAX} danger={s.line.pacific >= 7} />
          <Gauge label={tr('Unidad aliada', 'Allied unity')} sub={tr('a 0 la alianza se rompe', 'at 0 the alliance breaks')} value={s.unity} max={100} danger={s.unity <= 25} invert />
          <Gauge label={tr('Resiliencia', 'Resilience')} sub={tr('infraestructuras y opinión pública', 'infrastructure and public opinion')} value={s.resilience} max={100} danger={s.resilience < 30} invert />
          <div className="fus">
            <span>{tr('Fuerzas de EE. UU.:', 'US forces:')}</span>
            <div className="seg">
              <button className={s.focus === 'europe' ? 'on w' : 'w'} disabled={s.phase !== 'plan'} onClick={() => act({ t: 'focus', front: 'europe' })}>
                {tr('Europa', 'Europe')}
              </button>
              <button className={s.focus === 'pacific' ? 'on w' : 'w'} disabled={s.phase !== 'plan'} onClick={() => act({ t: 'focus', front: 'pacific' })}>
                {tr('Pacífico', 'Pacific')}
              </button>
            </div>
            <small>{tr('No pueden estar en los dos sitios: −1 a la presión del frente elegido.', 'They cannot be in both places: −1 pressure on the chosen front.')}</small>
          </div>
          <div className="fplan">
            {tr('Plan conjunto', 'Joint plan')}{' '}
            {Array.from({ length: F_PLAN_MAX }, (_, i) => (
              <i key={i} className={i < s.plan ? 'on' : ''} />
            ))}
            {s.deter > 0 && <span className="tag good">{tr(`Disuasión ${s.deter} sem.`, `Deterrence ${s.deter} wk`)}</span>}
            {s.sanctions > 0 && <span className="tag good">{tr(`Sanciones ${s.sanctions} sem.`, `Sanctions ${s.sanctions} wk`)}</span>}
            {s.shield.infra > 0 && <span className="tag">🛡 {tr('infra', 'infra')} ×{s.shield.infra}</span>}
            {s.shield.info > 0 && <span className="tag">🛡 {tr('info', 'info')} ×{s.shield.info}</span>}
          </div>
        </section>

        <section className="fpanel fcouncil">
          <h3>
            {tr('Consejo aliado', 'Allied council')}
            <span className={consensus(s) ? 'ok' : 'bad'}>{consensus(s) ? tr('hay consenso', 'consensus') : tr('sin consenso', 'no consensus')}</span>
          </h3>
          <ul className="fmembers">
            {s.members.map((m) => {
              const why = fBlocked(s, { t: 'diplomacy', member: m.id }, lang);
              return (
                <li key={m.id} className={`r${m.resolve}`}>
                  <span className="fm-name">{m.name[lang]}</span>
                  <span className="fm-pips">
                    {[1, 2, 3].map((i) => (
                      <i key={i} className={i <= m.resolve ? 'on' : ''} />
                    ))}
                  </span>
                  <button disabled={!!why} title={why ?? tr('Diplomacia (1 punto): +1 compromiso', 'Diplomacy (1 point): +1 commitment')} onClick={() => act({ t: 'diplomacy', member: m.id })}>
                    🤝
                  </button>
                </li>
              );
            })}
          </ul>
          {s.pending.length > 0 && (
            <div className="fpending">
              {s.pending.map((p) => (
                <div key={p.kind}>
                  ⏳ {F_DECISION[p.kind].name[lang]} · {tr('votación en', 'vote in')} {p.due - s.week} {tr('sem.', 'wk')}
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="fpanel factions">
          {s.report.length > 0 && s.phase === 'plan' && (
            <div className="freport">
              <div className="fa-label">{tr(`Lo que pasó en la semana ${s.week - 1}`, `What happened in week ${s.week - 1}`)}</div>
              {s.report.map((e, i) => (
                <div key={i} className={`fl ${e.kind}`}>
                  {e.text[lang]}
                </div>
              ))}
            </div>
          )}
          <h3>{tr('Tus decisiones', 'Your moves')}</h3>
          <div className="fa-group">
            <div className="fa-label">{tr(`Toda la alianza · lento (≈${delay} sem.) y vetable`, `Whole alliance · slow (≈${delay} wk) and vetoable`)}</div>
            {btn({ t: 'decision', kind: 'flank' }, F_DECISION.flank.name[lang], F_DECISION.flank.desc[lang], 'slow')}
            {btn({ t: 'decision', kind: 'sanctions' }, F_DECISION.sanctions.name[lang], F_DECISION.sanctions.desc[lang], 'slow')}
          </div>
          <div className="fa-group">
            <div className="fa-label">{tr('Formatos pequeños · inmediatos', 'Small formats · immediate')}</div>
            {btn(
              { t: 'coalition' },
              tr('Coalición de voluntarios', 'Coalition of the willing'),
              tr(`Los ${firm(s)} miembros firmes actúan ya: frente europeo −${coalitionPower(s)}, unidad −2.`, `The ${firm(s)} firm members act now: European front −${coalitionPower(s)}, unity −2.`),
              'fast',
            )}
            {btn({ t: 'pacific' }, tr('Alianza regional del Pacífico', 'Regional Pacific alliance'), tr(`Japón, Australia y Filipinas: frente del Pacífico −${2 + (s.plan >= 3 ? 1 : 0)}.`, `Japan, Australia and the Philippines: Pacific front −${2 + (s.plan >= 3 ? 1 : 0)}.`), 'fast')}
          </div>
          <div className="fa-group">
            <div className="fa-label">{tr('Preparación', 'Preparation')}</div>
            {btn({ t: 'plan' }, tr('Plan conjunto', 'Joint plan'), tr('Dejar de improvisar: debates más cortos, más puntos y formatos más eficaces.', 'Stop improvising: shorter debates, more points and more effective formats.'))}
            {btn({ t: 'protect', area: 'infra' }, tr('Proteger infraestructuras', 'Protect infrastructure'), tr('Bloquea 2 sabotajes (cables, red eléctrica, drones) y +8 resiliencia.', 'Blocks 2 sabotage attacks (cables, grid, drones) and +8 resilience.'))}
            {btn({ t: 'protect', area: 'info' }, tr('Frenar la desinformación', 'Counter disinformation'), tr('Bloquea 2 campañas de desinformación o injerencia y +8 resiliencia.', 'Blocks 2 disinformation or interference campaigns and +8 resilience.'))}
          </div>
          {err && <div className="ferr">{err}</div>}
          <button className="primary big fend" disabled={s.phase !== 'plan'} onClick={() => act({ t: 'end' })}>
            {tr('Terminar semana', 'End week')} {s.ap > 0 ? tr(`(te quedan ${s.ap})`, `(${s.ap} left)`) : ''}
          </button>
        </section>

        <section className="fpanel flog">
          <h3>{tr('Sala de situación', 'Situation room')}</h3>
          <div className="flog-list" ref={logRef}>
            {s.log.map((e, i) => (
              <div key={i} className={`fl ${e.kind}`}>
                {e.kind !== 'info' && <span className="fl-w">{e.week}</span>}
                {e.text[lang]}
              </div>
            ))}
          </div>
        </section>
      </div>

      {help && (
        <div className="modal-back" onClick={closeHelp}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>{tr('Dos Frentes', 'Two Fronts')}</h2>
            <p className="muted">
              {tr(
                'Escenario hipotético inspirado en los wargames sobre una guerra en dos frentes: Rusia ataca el flanco este de la OTAN mientras China bloquea Taiwán. Diriges a Occidente durante 20 semanas.',
                'Hypothetical scenario inspired by wargames about a two-front war: Russia attacks NATO’s eastern flank while China blockades Taiwan. You lead the West for 20 weeks.',
              )}
            </p>
            <ul>
              <li>{tr('Cada semana tienes 3 puntos de acción. Al terminarla, la IA lanza ataques híbridos (sabotajes, drones, desinformación, ofertas económicas) y avanza en los dos frentes.', 'Each week you have 3 action points. When it ends, the AI launches hybrid attacks (sabotage, drones, disinformation, economic offers) and advances on both fronts.')}</li>
              <li>{tr('Pierdes si un frente llega a 10 o si la unidad aliada cae a 0. Si aguantas 20 semanas, ganas (con los dos frentes en 4 o menos, restableces la disuasión).', 'You lose if a front reaches 10 or allied unity drops to 0. Hold for 20 weeks and you win (with both fronts at 4 or less, you restore deterrence).')}</li>
              <li>{tr('Las decisiones de toda la alianza son potentes pero lentas, y basta con que un solo miembro rompa filas para vetarlas. La IA intentará dividir a los aliados mientras debatís.', 'Whole-alliance decisions are powerful but slow, and a single member breaking ranks vetoes them. The AI will try to split the allies while you debate.')}</li>
              <li>{tr('Las coaliciones de voluntarios y las alianzas regionales actúan al momento, aunque con menos fuerza.', 'Coalitions of the willing and regional alliances act at once, though with less force.')}</li>
              <li>{tr('EE. UU. solo puede reforzar un frente. Un plan conjunto preparado pronto evita tener que improvisar.', 'The US can only reinforce one front. A joint plan prepared early saves you from improvising.')}</li>
            </ul>
            <button className="primary" onClick={closeHelp}>
              {tr('A la sala de crisis', 'To the crisis room')}
            </button>
          </div>
        </div>
      )}

      {s.phase === 'over' && r && (
        <div className="modal-back">
          <div className={`modal over-modal ${fWon(s) ? 'w' : 'e'}`}>
            <div className="era-num">
              {tr('FIN DE LA SIMULACIÓN', 'SIMULATION OVER')} · {tr('semana', 'week')} {s.week}
            </div>
            <h2>{r.title[lang]}</h2>
            <p>{r.text[lang]}</p>
            <div className="flessons">
              <div>
                <b>{avgDelay}</b> {tr('semanas de media por decisión de toda la alianza', 'weeks on average per whole-alliance decision')}
              </div>
              <div>
                <b>{s.stats.vetoes}</b> {tr('vetos', 'vetoes')} · <b>{s.stats.decisions}</b> {tr('decisiones aprobadas', 'decisions passed')}
              </div>
              <div>
                <b>{s.stats.coalitions}</b> {tr('acciones de coaliciones de voluntarios', 'coalition-of-the-willing actions')}
              </div>
              <div>
                <b>{s.stats.blocked}</b>/{s.stats.hybrid} {tr('ataques híbridos neutralizados', 'hybrid attacks neutralized')}
              </div>
            </div>
            <div className="row">
              <button
                className="primary"
                onClick={() => {
                  setS(createFronts((Math.random() * 2 ** 31) | 0, level));
                  setErr(null);
                }}
              >
                {tr('Otra simulación', 'Run again')}
              </button>
              <button onClick={onExit}>{tr('Volver al menú', 'Back to menu')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
