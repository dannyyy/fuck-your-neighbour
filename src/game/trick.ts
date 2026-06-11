import { rankStrength, suitStrength } from './cards'
import { seatOrderFrom } from './seating'
import type { ErbenResolution, PlayedCard } from './types'

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
 * rekursiv tiefer. Bleibt am Ende keine tiefere Karte (alle gleichrangig), gewinnt der
 * dem Anspieler nächste betroffene Spieler.
 */
export function erbenWinner(
  layerCards: PlayedCard[],
  contenders: number[],
  leader: number,
  numPlayers: number,
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

  const tied = new Set(lastGroup.map((pc) => pc.playerId))
  for (const seat of seatOrderFrom(leader, numPlayers)) {
    if (tied.has(seat)) return seat
  }
  return leader
}

/**
 * Auflösung des Gleichstands auf der letzten Karte (Erben) – je nach Regelvariante.
 * Gibt die Liste der Stichgewinner zurück: genau einer (`lower`, `suit`), mehrere
 * (`split`) oder keiner (`none`). Jeder Gewinner erhält die volle Stich-Gutschrift.
 */
export function erbenWinners(
  layerCards: PlayedCard[],
  contenders: number[],
  leader: number,
  numPlayers: number,
  resolution: ErbenResolution,
): number[] {
  switch (resolution) {
    case 'split':
      // Alle gleichauf an der Spitze liegenden Spieler machen den Stich.
      return topContenders(layerCards, contenders)
    case 'none':
      // Niemand macht den Stich.
      return []
    case 'suit': {
      // Höchste Kartenfarbe unter den Spitzenkarten entscheidet (Farben sind eindeutig).
      const tied = new Set(topContenders(layerCards, contenders))
      const cards = layerCards.filter((pc) => tied.has(pc.playerId))
      let winner = cards[0]
      for (const pc of cards) {
        if (suitStrength(pc.card.suit) > suitStrength(winner.card.suit)) winner = pc
      }
      return [winner.playerId]
    }
    case 'lower':
    default:
      return [erbenWinner(layerCards, contenders, leader, numPlayers)]
  }
}
