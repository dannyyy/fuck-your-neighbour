import { rankStrength, type Card } from '../game/cards'

const byStrengthAsc = (a: Card, b: Card) => rankStrength(a.rank) - rankStrength(b.rank)

export function lowestCard(hand: Card[]): Card {
  return [...hand].sort(byStrengthAsc)[0]
}

export function highestCard(hand: Card[]): Card {
  const sorted = [...hand].sort(byStrengthAsc)
  return sorted[sorted.length - 1]
}

/**
 * Heuristische Kartenwahl, die exakt auf das (Rest-)Ziel zusteuert.
 *
 * @param hand               spielbare Karten
 * @param contenderCards     bereits gelegte Karten der Wettkämpfer dieser Lage
 * @param isContender        kämpft dieser Spieler um den Stich (oder wirft nur ab)?
 * @param target             noch gewünschte Stiche (bid − bereits gemacht)
 * @param maxUnseen          stärkster Rang, den ein Gegner noch halten könnte
 *                           (für „sicheren Stich anspielen“); undefined = ignorieren
 */
export function chooseTactical(
  hand: Card[],
  contenderCards: Card[],
  isContender: boolean,
  target: number,
  maxUnseen?: number,
): Card {
  const wantWin = target > 0

  // Reiner Abwurf (kein Wettkämpfer): will man noch Stiche, tiefe Karten behalten
  // → niedrigste abwerfen; sonst hohe Karten loswerden → höchste abwerfen.
  if (!isContender) {
    return wantWin ? lowestCard(hand) : highestCard(hand)
  }

  const best = contenderCards.reduce((m, c) => Math.max(m, rankStrength(c.rank)), -1)
  const leading = contenderCards.length === 0

  if (leading) {
    if (!wantWin) return lowestCard(hand)
    // Sicheren Stich „kassieren“, ohne die stärkste Karte zu verschwenden.
    if (maxUnseen !== undefined) {
      const sure = hand.filter((c) => rankStrength(c.rank) > maxUnseen)
      if (sure.length) return lowestCard(sure)
    }
    return highestCard(hand)
  }

  if (wantWin) {
    const winners = hand.filter((c) => rankStrength(c.rank) > best)
    if (winners.length) return lowestCard(winners) // billigst gewinnen
    return lowestCard(hand) // kann nicht gewinnen → tiefste abwerfen
  }

  // Ducken: höchste Karte spielen, die sicher unter der Spitze bleibt.
  const safe = hand.filter((c) => rankStrength(c.rank) < best)
  if (safe.length) return highestCard(safe)
  return lowestCard(hand) // erzwungener Stich → wenigstens tief halten
}
