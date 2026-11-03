// Sonido opcional generado con WebAudio (sin archivos externos).
let ctx: AudioContext | null = null;
let enabled = false;
try {
  enabled = localStorage.getItem('tg-sound') === '1';
} catch {
  /* sin almacenamiento */
}

export const isSoundOn = () => enabled;
export function setSound(on: boolean) {
  enabled = on;
  try {
    localStorage.setItem('tg-sound', on ? '1' : '0');
  } catch {
    /* ignorar */
  }
}

function tone(freq: number, dur: number, type: OscillatorType = 'sine', vol = 0.06, delay = 0, slide = 0) {
  if (!enabled) return;
  try {
    ctx ??= new AudioContext();
    const t = ctx.currentTime + delay;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, freq + slide), t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(ctx.destination);
    o.start(t);
    o.stop(t + dur + 0.02);
  } catch {
    /* audio no disponible */
  }
}

export const sfx = {
  select: () => tone(520, 0.06, 'square', 0.03),
  place: () => {
    tone(330, 0.08, 'triangle', 0.07);
    tone(495, 0.1, 'triangle', 0.05, 0.05);
  },
  dice: () => {
    for (let i = 0; i < 6; i++) tone(180 + Math.random() * 260, 0.05, 'square', 0.03, i * 0.08);
  },
  event: () => {
    tone(220, 0.25, 'sawtooth', 0.04);
    tone(330, 0.3, 'sawtooth', 0.03, 0.1);
  },
  alarm: () => {
    tone(740, 0.18, 'square', 0.05);
    tone(520, 0.22, 'square', 0.05, 0.2);
    tone(740, 0.18, 'square', 0.05, 0.4);
  },
  era: () => {
    tone(262, 0.4, 'sine', 0.06);
    tone(330, 0.4, 'sine', 0.06, 0.2);
    tone(392, 0.6, 'sine', 0.06, 0.4);
  },
  win: () => {
    [392, 494, 587, 784].forEach((f, i) => tone(f, 0.3, 'triangle', 0.06, i * 0.15));
  },
};
