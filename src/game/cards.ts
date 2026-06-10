/**
 * Deutschschweizer Jasskarten und die spielspezifische Rangordnung.
 *
 * Rangordnung (Nutzer-Vorgabe, tief → hoch):
 *   6 < 7 < 8 < 10/Banner < Under < Ober < König < 9 < Ass
 *
 * Die 9 ist also zweithöchste Karte, die 10 (Banner) liegt unter dem Under.
 * Farben haben KEINEN Spielwert (kein Farbzwang) – nur der Rang entscheidet.
 */

export const SUITS = ['schellen', 'schilten', 'rosen', 'eichel'] as const
export type Suit = (typeof SUITS)[number]

/** Ränge in aufsteigender Stärke. Der Array-Index ist die Stärke. */
export const RANKS = ['6', '7', '8', 'banner', 'under', 'ober', 'koenig', '9', 'ass'] as const
export type Rank = (typeof RANKS)[number]

export interface Card {
  suit: Suit
  rank: Rank
}

const STRENGTH: Record<Rank, number> = RANKS.reduce(
  (acc, rank, index) => {
    acc[rank] = index
    return acc
  },
  {} as Record<Rank, number>,
)

/** Stärke eines Rangs (höher = stärker). */
export function rankStrength(rank: Rank): number {
  return STRENGTH[rank]
}

/** Eindeutige ID einer Karte, z. B. "schellen-ass". */
export function cardId(card: Card): string {
  return `${card.suit}-${card.rank}`
}

export function sameCard(a: Card, b: Card): boolean {
  return a.suit === b.suit && a.rank === b.rank
}

/** Vergleich nach Rang: > 0 wenn a stärker als b. */
export function compareByRank(a: Card, b: Card): number {
  return rankStrength(a.rank) - rankStrength(b.rank)
}

/** Vollständiges 36er-Deck. */
export function createDeck(): Card[] {
  const deck: Card[] = []
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({ suit, rank })
    }
  }
  return deck
}
