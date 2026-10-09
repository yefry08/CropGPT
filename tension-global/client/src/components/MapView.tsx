import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { select } from 'd3-selection';
import { zoom, zoomIdentity, type ZoomBehavior, type ZoomTransform } from 'd3-zoom';
import {
  CHIP_OFFSETS,
  COUNTRIES,
  COUNTRY,
  REGION_NAME,
  controller,
  countryName,
  isActive,
  isSuperNeighbor,
  neighborsOf,
  type CountryId,
  type GameState,
  type Region,
  type Side,
} from '@tg/shared';
import { REGION_VIEWS, WORLD_RATIO, buildGeometry, loadWorld, pieceKind, type LandPiece, type MapGeometry } from '../lib/geo';

interface Props {
  state: GameState;
  me: Side | null;
  selectable: Set<CountryId>;
  selected: CountryId | null;
  planned: Record<CountryId, number>;
  plannedSign: 1 | -1;
  onCountry: (id: CountryId) => void;
  resetKey: number;
}

type Own = 'w' | 'e' | 'n';
const T0 = { k: 1, x: 0, y: 0 };

const shortName = (id: CountryId, era: number) => {
  if (id === 'de') return era >= 4 ? 'Alemania' : 'Alem. Occ.';
  if (id === 'yu') return era >= 4 ? 'Serbia' : 'Yugoslavia';
  return COUNTRY[id].short;
};

// ——— Capa de tierra (memoizada: no se repinta al hacer zoom) ———
interface LandProps {
  pieces: LandPiece[];
  geo: MapGeometry;
  era: number;
  own: Record<string, Own>;
  selectable: Set<CountryId>;
  selected: CountryId | null;
  onCountry: (id: CountryId) => void;
  onHover: (id: CountryId | null) => void;
}

const LandLayer = memo(function LandLayer({ pieces, geo, era, own, selectable, selected, onCountry, onHover }: LandProps) {
  const out: JSX.Element[] = [];
  const handlers = (cid: CountryId) => ({
    onClick: () => onCountry(cid),
    onMouseEnter: () => onHover(cid),
    onMouseLeave: () => onHover(null),
  });
  const cls = (cid: CountryId) =>
    `land play o-${own[cid] ?? 'n'}${COUNTRY[cid].key ? ' key' : ''}${selectable.has(cid) ? ' hl' : ''}${selected === cid ? ' sel' : ''}`;
  for (const p of pieces) {
    const d = geo.paths.get(p.key);
    if (!d) continue;
    const { kind, cid } = pieceKind(p, era);
    if (kind === 'play' && cid) {
      if (cid === 'de' && era <= 3) {
        // Alemania dividida: la mitad oriental corresponde a Alemania Oriental.
        out.push(<path key={p.key + 'w'} d={d} clipPath="url(#clipDW)" className={cls('de')} {...handlers('de')} />);
        out.push(<path key={p.key + 'e'} d={d} clipPath="url(#clipDE)" className={cls('dde')} {...handlers('dde')} />);
        out.push(
          <polyline
            key="gerborder"
            points={geo.germanBorder.map((q) => q.join(',')).join(' ')}
            clipPath="url(#clipDEall)"
            className="ger-border"
            pointerEvents="none"
          />,
        );
        out.push(
          <clipPath key="cp-all" id="clipDEall">
            <path d={d} />
          </clipPath>,
        );
        continue;
      }
      out.push(<path key={p.key} d={d} className={cls(cid)} {...handlers(cid)} />);
    } else {
      out.push(<path key={p.key} d={d} className={`land ${kind}`} pointerEvents="none" />);
    }
  }
  return <g>{out}</g>;
});

// ——— Ficha ———
function useFlash(value: number): boolean {
  const prev = useRef(value);
  const [on, setOn] = useState(false);
  useEffect(() => {
    if (prev.current !== value) {
      prev.current = value;
      setOn(true);
      const t = setTimeout(() => setOn(false), 700);
      return () => clearTimeout(t);
    }
  }, [value]);
  return on;
}

interface ChipProps {
  id: CountryId;
  era: number;
  w: number;
  e: number;
  ctl: Own;
  x: number;
  y: number;
  a: number;
  compact: boolean;
  nbW: boolean;
  nbE: boolean;
  hl: boolean;
  sel: boolean;
  planned: number;
  onCountry: (id: CountryId) => void;
  onHover: (id: CountryId | null) => void;
}

const Chip = memo(function Chip({ id, era, w, e, ctl, x, y, a, compact, nbW, nbE, hl, sel, planned, onCountry, onHover }: ChipProps) {
  const def = COUNTRY[id];
  const fw = useFlash(w);
  const fe = useFlash(e);
  const hw = compact ? 24 : 32;
  const hh = compact ? 9 : 16;
  const row = compact ? 0 : 7;
  const circle = compact ? -16 : -23;
  const wx = compact ? -8 : -14;
  const ex = compact ? 9 : 9;
  const bw = compact ? 15 : 21;
  return (
    <g
      transform={`translate(${x.toFixed(1)},${y.toFixed(1)}) scale(${a.toFixed(3)})`}
      data-id={id}
      className={`chip c-${ctl}${hl ? ' hl' : ''}${sel ? ' sel' : ''}${def.key ? ' key' : ''}`}
      onClick={(ev) => {
        ev.stopPropagation();
        onCountry(id);
      }}
      onMouseEnter={() => onHover(id)}
      onMouseLeave={() => onHover(null)}
    >
      <rect className="chip-bg" x={-hw} y={-hh} width={hw * 2} height={hh * 2} rx={4} />
      {!compact && (
        <text className="chip-name" x={def.key ? 3 : 0} y={-4} textAnchor="middle">
          {shortName(id, era)}
        </text>
      )}
      {def.key && (
        <text className="chip-star" x={compact ? -20 : -25} y={compact ? -3 : -4} textAnchor="middle">
          ★
        </text>
      )}
      <circle className="chip-stab" cx={circle} cy={row} r={compact ? 5.5 : 6.5} />
      <text className="chip-stab-t" x={circle} y={row + 3.4} textAnchor="middle">
        {def.stab}
      </text>
      <g>
        <rect className={`chip-w${fw ? ' pop' : ''}`} x={wx} y={row - 6.5} width={bw} height={13} rx={2} />
        <text className="chip-n" x={wx + bw / 2} y={row + 3.6} textAnchor="middle">
          {w}
        </text>
      </g>
      <g>
        <rect className={`chip-e${fe ? ' pop' : ''}`} x={ex} y={row - 6.5} width={bw} height={13} rx={2} />
        <text className="chip-n" x={ex + bw / 2} y={row + 3.6} textAnchor="middle">
          {e}
        </text>
      </g>
      {(nbW || nbE) && (
        <g transform={`translate(${hw - 2},${-hh + 1})`}>
          <circle r={5.5} className={nbW ? 'nb-w' : 'nb-e'} />
          <text className="nb-t" y={2.8} textAnchor="middle">
            {nbW ? 'EU' : nbE ? 'RU' : ''}
          </text>
          <title>{nbW ? 'Vecino de EE.UU.' : 'Vecino de la URSS/Rusia'}</title>
        </g>
      )}
      {planned !== 0 && (
        <g transform={`translate(0,${-hh - 8})`}>
          <rect x={-14} y={-8} width={28} height={14} rx={7} className="chip-plan" />
          <text className="chip-plan-t" y={3} textAnchor="middle">
            {planned > 0 ? `+${planned}` : planned}
          </text>
        </g>
      )}
    </g>
  );
});

// ——— Mapa ———
export function MapView({ state, me, selectable, selected, planned, plannedSign, onCountry, resetKey }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const zoomRef = useRef<ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const tRef = useRef<ZoomTransform>(zoomIdentity);
  const [pieces, setPieces] = useState<LandPiece[] | null>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [t, setT] = useState(T0);
  const [hover, setHover] = useState<CountryId | null>(null);
  const [activeRegion, setActiveRegion] = useState<Region | 'world'>('world');
  const era = state.era;

  useEffect(() => {
    loadWorld().then(setPieces).catch(() => setPieces([]));
  }, []);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setSize({ w: Math.round(el.clientWidth), h: Math.round(el.clientHeight) }));
    ro.observe(el);
    setSize({ w: Math.round(el.clientWidth), h: Math.round(el.clientHeight) });
    return () => ro.disconnect();
  }, []);

  const vw = size.w;
  const vh = size.h;
  // En pantallas verticales el mapa base cubre el alto (se explora con zoom y arrastre).
  const portrait = vw / Math.max(1, vh) < 1.1;
  const mapW = portrait ? Math.max(vw, Math.round(vh * WORLD_RATIO)) : vw;
  const geo = useMemo(() => (pieces && vw > 50 && vh > 50 ? buildGeometry(pieces, mapW, vh) : null), [pieces, vw, vh, mapW]);

  /** Transformación de la vista «Mundo». */
  const worldT = useCallback(
    (g: MapGeometry): ZoomTransform => {
      if (g.w <= vw + 1) return zoomIdentity;
      const cx = g.project([12, 35])[0];
      const tx = Math.min(0, Math.max(vw - g.w, vw / 2 - cx));
      return zoomIdentity.translate(tx, 0);
    },
    [vw],
  );

  // d3-zoom: rueda, pellizco y arrastre.
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg || !geo) return;
    let raf = 0;
    const z = zoom<SVGSVGElement, unknown>()
      .scaleExtent([1, 18])
      .extent([
        [0, 0],
        [vw, vh],
      ])
      .translateExtent([
        [0, 0],
        [geo.w, geo.h],
      ])
      .on('zoom', (ev) => {
        tRef.current = ev.transform;
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(() => setT({ k: ev.transform.k, x: ev.transform.x, y: ev.transform.y }));
      });
    select(svg).call(z).on('dblclick.zoom', null);
    zoomRef.current = z;
    select(svg).call(z.transform, worldT(geo));
    setActiveRegion('world');
    return () => {
      cancelAnimationFrame(raf);
      select(svg).on('.zoom', null);
    };
  }, [geo, resetKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const animTo = useCallback(
    (target: ZoomTransform) => {
      const svg = svgRef.current;
      const z = zoomRef.current;
      if (!svg || !z) return;
      const from = tRef.current;
      const t0 = performance.now();
      const dur = 650;
      const step = (now: number) => {
        const u = Math.min(1, (now - t0) / dur);
        const e = u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2;
        const k = from.k * Math.pow(target.k / from.k, e);
        const x = from.x + (target.x - from.x) * e;
        const y = from.y + (target.y - from.y) * e;
        select(svg).call(z.transform, zoomIdentity.translate(x, y).scale(k));
        if (u < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    },
    [],
  );

  const goTo = useCallback(
    (r: Region | 'world') => {
      if (!geo) return;
      setActiveRegion(r);
      const vb = REGION_VIEWS[r];
      if (!vb) return animTo(worldT(geo));
      const pts = [
        geo.project([vb.lon[0], vb.lat[0]]),
        geo.project([vb.lon[1], vb.lat[0]]),
        geo.project([vb.lon[0], vb.lat[1]]),
        geo.project([vb.lon[1], vb.lat[1]]),
      ];
      const xs = pts.map((p) => p[0]);
      const ys = pts.map((p) => p[1]);
      const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
      const k = Math.max(1, Math.min(18, Math.min(vw / (x1 - x0), vh / (y1 - y0)) * 0.96));
      const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
      let tx = vw / 2 - k * cx;
      let ty = vh / 2 - k * cy;
      tx = Math.min(0, Math.max(vw - k * geo.w, tx));
      ty = Math.min(0, Math.max(vh - k * geo.h, ty));
      animTo(zoomIdentity.translate(tx, ty).scale(k));
    },
    [geo, animTo, vw, vh, worldT],
  );

  const zoomBy = (f: number) => {
    const svg = svgRef.current;
    const z = zoomRef.current;
    if (svg && z) select(svg).call(z.scaleBy, f);
  };

  // Propietarios por país (control).
  const own = useMemo(() => {
    const o: Record<string, Own> = {};
    for (const c of COUNTRIES) {
      if (!isActive(c.id, era)) continue;
      const ctl = controller(state, c.id);
      o[c.id] = ctl === 'W' ? 'w' : ctl === 'E' ? 'e' : 'n';
    }
    return o;
  }, [state.influence, era]); // eslint-disable-line react-hooks/exhaustive-deps

  const focus = hover ?? selected;
  const handleHover = useCallback((id: CountryId | null) => setHover(id), []);

  if (!geo) {
    return (
      <div className="map-wrap" ref={wrapRef}>
        <div className="map-loading">{pieces === null ? 'Cargando mapa…' : 'No se pudo cargar el mapa'}</div>
      </div>
    );
  }

  const a = Math.min(1.12, 0.5 + 0.24 * Math.log2(t.k + 0.6));
  const compact = a < 0.78;
  const offScale = Math.min(t.k, 3);
  const chips = COUNTRIES.filter((c) => isActive(c.id, era)).map((c) => {
    const [px, py] = geo.project(c.anchor);
    const off = CHIP_OFFSETS[c.id] ?? [0, 0];
    const ax = t.x + t.k * px;
    const ay = t.y + t.k * py;
    return { c, ax, ay, x: ax + off[0] * offScale, y: ay + off[1] * offScale, displaced: off[0] !== 0 || off[1] !== 0 };
  });

  const focusDef = focus && isActive(focus, era) ? COUNTRY[focus] : null;
  const focusNb = focusDef ? neighborsOf(focusDef.id, era) : [];
  const infoId = focusDef?.id ?? null;

  return (
    <div className="map-wrap" ref={wrapRef}>
      <svg ref={svgRef} className="map-svg" width={vw} height={vh}>
        <defs>
          <clipPath id="band">
            <rect x={0} y={geo.top} width={geo.w} height={geo.bottom - geo.top} />
          </clipPath>
          <clipPath id="clipDE">
            <path d={geo.germanEastClip} />
          </clipPath>
          <clipPath id="clipDW">
            <path d={`M-1000,-1000H${geo.w + 1000}V${geo.h + 1000}H-1000Z ${geo.germanEastClip}`} clipRule="evenodd" />
          </clipPath>
        </defs>
        <rect className="ocean" x={0} y={0} width={vw} height={vh} />
        <g transform={`translate(${t.x},${t.y}) scale(${t.k})`}>
          <g clipPath="url(#band)">
            <rect className="ocean-band" x={0} y={geo.top} width={geo.w} height={geo.bottom - geo.top} />
            <path className="graticule" d={geo.graticule} />
            {pieces && (
              <LandLayer
                pieces={pieces}
                geo={geo}
                era={era}
                own={own}
                selectable={selectable}
                selected={selected}
                onCountry={onCountry}
                onHover={handleHover}
              />
            )}
          </g>
          {focusDef &&
            focusNb.map((n) => {
              const [x1, y1] = geo.project(focusDef.anchor);
              const [x2, y2] = geo.project(COUNTRY[n].anchor);
              return <line key={n} className="adj" x1={x1} y1={y1} x2={x2} y2={y2} vectorEffect="non-scaling-stroke" />;
            })}
        </g>

        {/* Etiquetas de las superpotencias */}
        {(() => {
          const us = geo.project([-100, 41]);
          const ru = geo.project([88, 62]);
          return (
            <g className="superlabels" pointerEvents="none">
              <text x={t.x + t.k * us[0]} y={t.y + t.k * us[1]} textAnchor="middle" className="sl-w">
                EE.UU.
              </text>
              <text x={t.x + t.k * ru[0]} y={t.y + t.k * ru[1]} textAnchor="middle" className="sl-e">
                {era < 4 ? 'URSS' : 'RUSIA'}
              </text>
            </g>
          );
        })()}

        {/* Líneas guía de fichas desplazadas */}
        <g pointerEvents="none">
          {chips
            .filter((q) => q.displaced)
            .map((q) => (
              <g key={q.c.id}>
                <line className="leader" x1={q.ax} y1={q.ay} x2={q.x} y2={q.y} />
                <circle className="leader-dot" cx={q.ax} cy={q.ay} r={2.2} />
              </g>
            ))}
        </g>

        {/* Fichas */}
        <g>
          {chips
            .filter((q) => q.x > -70 && q.x < vw + 70 && q.y > -40 && q.y < vh + 40)
            .map((q) => {
              const inf = state.influence[q.c.id];
              return (
                <Chip
                  key={q.c.id}
                  id={q.c.id}
                  era={era}
                  w={inf.W}
                  e={inf.E}
                  ctl={own[q.c.id] ?? 'n'}
                  x={q.x}
                  y={q.y}
                  a={a}
                  compact={compact}
                  nbW={isSuperNeighbor('W', q.c.id, era)}
                  nbE={isSuperNeighbor('E', q.c.id, era)}
                  hl={selectable.has(q.c.id)}
                  sel={selected === q.c.id}
                  planned={(planned[q.c.id] ?? 0) * plannedSign}
                  onCountry={onCountry}
                  onHover={handleHover}
                />
              );
            })}
        </g>
      </svg>

      <div className="map-controls">
        {(['world', 'EU', 'ME', 'AS', 'AF', 'AM'] as const).map((r) => (
          <button key={r} className={activeRegion === r ? 'on' : ''} onClick={() => goTo(r)}>
            {r === 'world' ? 'Mundo' : REGION_NAME[r]}
          </button>
        ))}
        <span className="zoom-btns">
          <button onClick={() => zoomBy(1.6)} aria-label="Acercar">
            +
          </button>
          <button onClick={() => zoomBy(1 / 1.6)} aria-label="Alejar">
            −
          </button>
        </span>
      </div>

      {infoId && <CountryInfo state={state} id={infoId} me={me} />}
      <div className="map-legend">
        <span><i className="lg w" /> Occidente</span>
        <span><i className="lg e" /> Bloque Oriental</span>
        <span><i className="lg n" /> Sin control</span>
        <span><i className="lg k" /> País clave</span>
      </div>
    </div>
  );
}

function CountryInfo({ state, id, me }: { state: GameState; id: CountryId; me: Side | null }) {
  const def = COUNTRY[id];
  const inf = state.influence[id];
  const ctl = controller(state, id);
  const nb = neighborsOf(id, state.era);
  return (
    <div className="country-info">
      <div className="ci-title">
        {countryName(id, state.era)} {def.key && <span className="ci-key">★ clave</span>}
      </div>
      <div className="ci-sub">
        {REGION_NAME[def.region]} · Estabilidad {def.stab}
      </div>
      <div className="ci-inf">
        <span className="w">Occidente {inf.W}</span>
        <span className="e">Oriental {inf.E}</span>
      </div>
      <div className="ci-ctl">
        {ctl === 'W' ? 'Controla Occidente' : ctl === 'E' ? 'Controla el Bloque Oriental' : 'Sin control'}
        {me && ctl === (me === 'W' ? 'E' : 'W') ? ' · colocar cuesta 2' : ''}
      </div>
      {(isSuperNeighbor('W', id, state.era) || isSuperNeighbor('E', id, state.era)) && (
        <div className="ci-sub">{isSuperNeighbor('W', id, state.era) ? 'Vecino de EE.UU.' : state.era >= 4 ? 'Vecino de Rusia' : 'Vecino de la URSS'}</div>
      )}
      <div className="ci-nb">Vecinos: {nb.map((n) => COUNTRY[n].short).join(', ') || '—'}</div>
    </div>
  );
}
