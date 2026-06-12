import { rankStrength, type Suit } from './cards'
import { seatOrderFrom } from './seating'
import type { PlayedCard } from './types'

/** Farb-Rangfolge für den optionalen Erben-Tiebreak (tief → hoch). */
const SUIT_TIEBREAK_ORDER: Record<Suit, number> = {
  rosen: 0,
  eichel: 1,
  schilten: 2,
  schellen: 3,
}

/**
 * Wer hat unter den Wettkämpfern (`contenders`) in dieser Lage den höchsten Rang?
 * Gibt alle Spieler mit dem Spitzenrang zurück (bei Gleichstand mehrere).
 */
export function topContenders(layerCards: PlayedCard[], contenders: number[]): number[] {
  const set = new Set(contenders)
  const cards = layerCards.filter((pc) => set.has(pc.playerId))
  let max = -1
  for (const pc of cards) max = Math.max(max, rankStrength(pc.card.rank))
  return cards.filter((pc) => rankStrength(pc.card.rank) === max).map((pc) => pc.playerId)
}

/**
 * Erben (Stechen bei der letzten Karte): die Spitzenkarten sind gleich und es gibt
 * keine Karten zum Stechen mehr → die darunterliegende Karte gewinnt.
 *
 * Wir betrachten nur die Karten der Wettkämpfer: der höchste Rang (die Gleichstands-
 * Spitze) „vererbt“, der nächsttiefere Rang gewinnt. Ist auch dieser gleich, geht es
 * rekursiv tiefer. Bleibt am Ende keine tiefere Karte (alle gleichrangig), entscheidet
 * je nach `tiebreak` der dem Anspieler nächste Spieler ('seat', Standard) oder die
 * höhere Farbe ('suit': Rosen < Eichel < Schilten < Schellen).
 */
export function erbenWinner(
  layerCards: PlayedCard[],
  contenders: number[],
  leader: number,
  numPlayers: number,
  tiebreak: 'seat' | 'suit' = 'seat',
): number {
  const set = new Set(contenders)
  let pool = layerCards.filter((pc) => set.has(pc.playerId))
  let lastGroup = pool

  while (pool.length > 0) {
    let max = -1
    for (const pc of pool) max = Math.max(max, rankStrength(pc.card.rank))
    const group = pool.filter((pc) => rankStrength(pc.card.rank) === max)
    if (group.length === 1) return group[0].playerId
    lastGroup = group
    pool = pool.filter((pc) => rankStrength(pc.card.rank) !== max)
  }

  // Unterste Lage weiterhin gleichrangig → konfigurierter Tiebreak.
  if (tiebreak === 'suit') {
    let winner = lastGroup[0]
    for (const pc of lastGroup) {
      if (SUIT_TIEBREAK_ORDER[pc.card.suit] > SUIT_TIEBREAK_ORDER[winner.card.suit]) winner = pc
    }
    return winner.playerId
  }

  const tied = new Set(lastGroup.map((pc) => pc.playerId))
  for (const seat of seatOrderFrom(leader, numPlayers)) {
    if (tied.has(seat)) return seat
  }
  return leader
}
