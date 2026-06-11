import type { GameRules } from './types'

/** Kartenzahl je Runde – 11 Runden: 6→5→4→3→2→1→2→3→4→5→6. */
export const ROUND_CARD_COUNTS = [6, 5, 4, 3, 2, 1, 2, 3, 4, 5, 6] as const
export const TOTAL_ROUNDS = ROUND_CARD_COUNTS.length

/** Punktevergabe (Nutzer-Regel, überschreibt PDF). */
export const HIT_SCORE = 10 // exakte Ansage getroffen → pauschal +10
export const MISS_PENALTY = 5 // pro Stich Abweichung → −5

/** Standard-Regelsatz, wenn nichts anderes konfiguriert ist. */
export const DEFAULT_RULES: GameRules = {
  doubleZeroRule: true,
  hitScore: HIT_SCORE,
  missPenalty: MISS_PENALTY,
  erbenResolution: 'lower',
}

export const MIN_PLAYERS = 3
export const MAX_PLAYERS = 6

/** 36 Karten im Deck – limitiert die Spielerzahl bei der grössten Runde. */
export const DECK_SIZE = 36
