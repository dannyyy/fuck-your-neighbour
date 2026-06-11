import { HIT_SCORE, MISS_PENALTY } from './constants'

/**
 * Rundenwertung (Nutzer-Regel, überschreibt PDF):
 *   exakte Ansage getroffen → +10 pauschal (unabhängig von der Stichzahl)
 *   daneben               → −5 pro Stich Abweichung
 *
 * Beispiele: 3/3 → +10, 0/0 → +10, 2/0 → 2×(−5) = −10.
 *
 * Punktewerte sind konfigurierbar (Einstellungsmenü); ohne Angabe gelten die
 * Standardwerte.
 */
export function roundScore(
  bid: number,
  tricksWon: number,
  hitScore: number = HIT_SCORE,
  missPenalty: number = MISS_PENALTY,
): number {
  if (bid === tricksWon) return hitScore
  return -missPenalty * Math.abs(bid - tricksWon)
}
