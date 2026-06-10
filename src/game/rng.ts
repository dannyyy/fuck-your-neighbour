/**
 * Deterministischer Zufallsgenerator (mulberry32) mit auslesbarem Zustand,
 * damit Spielzustände reproduzierbar und Tests deterministisch sind.
 */
export interface Rng {
  next(): number // [0, 1)
  int(maxExclusive: number): number
  getState(): number
}

export function makeRng(seed: number): Rng {
  let a = seed >>> 0
  const next = (): number => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
  return {
    next,
    int: (maxExclusive: number) => Math.floor(next() * maxExclusive),
    getState: () => a,
  }
}

/** Fisher-Yates – mutiert das übergebene Array. */
export function shuffleInPlace<T>(array: T[], rng: Rng): T[] {
  for (let i = array.length - 1; i > 0; i--) {
    const j = rng.int(i + 1)
    ;[array[i], array[j]] = [array[j], array[i]]
  }
  return array
}

/** Zufälliger Seed für ein echtes Spiel (nicht für Tests). */
export function randomSeed(): number {
  return (Math.floor(Math.random() * 0xffffffff) >>> 0) || 1
}
