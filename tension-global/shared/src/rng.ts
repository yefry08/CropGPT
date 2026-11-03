// PRNG determinista (mulberry32). El estado vive en `state.rng`.

export function rand(s: { rng: number }): number {
  s.rng = (s.rng + 0x6d2b79f5) | 0;
  let t = Math.imul(s.rng ^ (s.rng >>> 15), 1 | s.rng);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

export function d6(s: { rng: number }): number {
  return 1 + Math.floor(rand(s) * 6);
}

export function shuffle<T>(s: { rng: number }, arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand(s) * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Generador independiente (para la IA y el ruido de sus valoraciones). */
export function makeRng(seed: number): () => number {
  const s = { rng: seed | 0 };
  return () => rand(s);
}
