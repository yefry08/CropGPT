// The truth behind the figure: one plastics module, in centimetres, litres and grams.
// The same functions run in Node (to write the first readout) and in the page.

export const R = 34; // outer circumradius: 68 cm vertex to vertex
const WALL = 1.6;
const RI = R - WALL / Math.cos(Math.PI / 6);

export const Z = {
  floor: 0, plinth: 3, body: 12, seam: 50, label: 59, entry: 73, led: 84,
  band: 88, bandH: 5, cap: 104, capTop: 108, sill: 15, header: 80, lift: 34,
  tray: 18, trayTop: 20, maxPile: 64,
  plateHome: 82, gland: 87, actuator: 88, gear: 92, beam: 95, beamTop: 98, tof: 92.6, lens: 92,
  dropStart: 70,
};

export const JAMB = 4 / R;
export const CUT0 = 0.4; // fraction of face 0 removed next to the front vertex
export const CUT5 = 0.55; // fraction of face 5 removed next to the front vertex
export const ENTRY_DX = 9;
export const SENSOR_R = 12;
export const PLATE_R = R - 5.5;
export const PLATE_T = 3;

export const CONST = {
  H: Z.maxPile - Z.trayTop, // 44 cm of usable height
  AREA: (3 * Math.sqrt(3) / 2) * RI * RI, // ≈ 2686 cm² inner cross-section
  BOTTLE_CM3: 1200, // a loose 500 ml PET bottle takes about 1.2 L in a bin
  BOTTLE_G: 20,
  RATIO: 0.35, // loose bottles keep 35 % of their volume: a 65 % reduction
  TRIGGER: 0.85, // compact when the pile reaches 85 % of the usable height
  FULL: 0.68, // after compacting, at or above 68 % the module reports itself full
  FILL_RATE: 6, // cm of loose bottles per second in the idle tour
  PLATE_V: 22, // cm/s of plate travel (sped up from the real actuator)
  PLATE_T, PILE_R: R - 6.5,
};

const M = CONST;

export function initial(still) {
  const s = { phase: "fill", t: 0, hc: 0, hl: 0, layers: [], zp: Z.plateHome, bottles: 0, drop: null, dropTimer: 0.4, target: 0, hold: 0, wait: 0 };
  if (!still) return s;
  let hc = 0, added = 0;
  for (let cycle = 0; cycle < 2; cycle++) {
    added += M.TRIGGER * M.H - hc;
    hc += (M.TRIGGER * M.H - hc) * M.RATIO;
    s.layers.push(hc);
  }
  s.hc = hc;
  s.hl = 12;
  s.bottles = Math.round(((added + s.hl) * M.AREA) / M.BOTTLE_CM3);
  return s;
}

export function addBottles(s, n) {
  if (s.phase !== "fill") return s;
  const room = M.TRIGGER * M.H - s.hc - s.hl;
  const dh = Math.min((n * M.BOTTLE_CM3) / M.AREA, Math.max(0, room));
  return { ...s, hl: s.hl + dh, bottles: s.bottles + (dh * M.AREA) / M.BOTTLE_CM3, drop: { z: Z.dropStart, v: 0 } };
}

export function press(s) {
  if (s.phase !== "fill" || s.hl < 2) return s;
  return { ...s, phase: "press", target: s.hl * M.RATIO };
}

export function step(s0, dt) {
  const s = { ...s0, t: s0.t + dt, layers: s0.layers.slice() };
  const top = Z.trayTop + s.hc + s.hl;
  if (s.drop) {
    const v = s.drop.v + 700 * dt;
    const z = s.drop.z - v * dt;
    s.drop = z <= top + 3.4 ? null : { z, v };
  }
  if (s.phase === "fill") {
    const dh = M.FILL_RATE * dt;
    s.hl += dh;
    s.bottles += (dh * M.AREA) / M.BOTTLE_CM3;
    s.dropTimer -= dt;
    if (s.dropTimer <= 0 && !s.drop) { s.drop = { z: Z.dropStart, v: 0 }; s.dropTimer = 0.9; }
    if (s.hc + s.hl >= M.TRIGGER * M.H) { s.hl = M.TRIGGER * M.H - s.hc; s.phase = "press"; s.target = s.hl * M.RATIO; }
  } else if (s.phase === "press") {
    s.zp -= M.PLATE_V * dt;
    const floor = Z.trayTop + s.hc;
    if (s.zp < floor + s.hl) s.hl = Math.max(s.target, s.zp - floor);
    if (s.hl <= s.target + 1e-6) { s.hl = s.target; s.zp = floor + s.target; s.phase = "hold"; s.hold = 0.7; }
  } else if (s.phase === "hold") {
    s.hold -= dt;
    if (s.hold <= 0) { s.hc += s.hl; s.hl = 0; s.layers.push(s.hc); s.phase = "return"; }
  } else if (s.phase === "return") {
    s.zp += M.PLATE_V * dt;
    if (s.zp >= Z.plateHome) { s.zp = Z.plateHome; s.phase = s.hc >= M.FULL * M.H ? "full" : "fill"; s.wait = 0; }
  } else if (s.phase === "full") {
    s.wait += dt;
    if (s.wait > 6) s.phase = "empty";
  } else if (s.phase === "empty") {
    s.hc = Math.max(0, s.hc - 40 * dt);
    s.layers = s.layers.filter((h) => h < s.hc - 0.1);
    if (s.hc <= 0) { s.hc = 0; s.layers = []; s.bottles = 0; s.phase = "fill"; s.dropTimer = 0.6; }
  }
  return s;
}

export function say(s) {
  const top = Z.trayTop + s.hc + s.hl;
  const level = Math.round(((s.hc + s.hl) / M.H) * 100);
  const kg = ((s.bottles * M.BOTTLE_G) / 1000).toFixed(1).replace(".", ",");
  const tof = Math.round(Z.lens - top);
  const name = { fill: "Llenando", press: "Compactando", hold: "Compactando", return: "Placa subiendo", full: "LLENO · alerta enviada", empty: "Recolección" }[s.phase];
  return `${name} · ${level} % · ToF ${tof} cm · ${kg} kg`;
}

export const stepSource = [initial, addBottles, press, step, say].map((f) => f.toString()).join("\n");
