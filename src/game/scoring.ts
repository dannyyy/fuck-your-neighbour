import { HIT_SCORE, MISS_PENALTY } from './constants'

/**
 * Rundenwertung (Nutzer-Regel, überschreibt PDF):
 *   exakte Ansage getroffen → +10 pauschal (unabhängig von der Stichzahl)
 *   daneben               → −5 pro Stich Abweichung
 *
 * Beispiele: 3/3 → +10, 0/0 → +10, 2/0 → 2×(−5) = −10.
 */
export function roundScore(bid: number, tricksWon: number): number {
  if (bid === tricksWon) return HIT_SCORE
  return -MISS_PENALTY * Math.abs(bid - tricksWon)
}
