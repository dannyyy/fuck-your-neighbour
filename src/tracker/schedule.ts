import { DECK_SIZE } from '../game/constants'

/** Der Tracker erlaubt mehr Mitspieler als das digitale Spiel. */
export const TRACKER_MIN_PLAYERS = 2
export const TRACKER_MAX_PLAYERS = 8

/** Wie im digitalen Spiel werden höchstens 6 Karten pro Runde gegeben. */
const MAX_CARDS_PER_ROUND = 6

/**
 * Höchste Kartenzahl einer Runde: begrenzt durch das 36er-Deck (`floor(36/n)`)
 * und durch die 6-Karten-Obergrenze. Für 2–6 Spieler ergibt das 6 (wie im
 * digitalen Spiel), für 7 Spieler 5 und für 8 Spieler 4.
 */
export function maxCardsPerRound(numPlayers: number): number {
  return Math.max(1, Math.min(MAX_CARDS_PER_ROUND, Math.floor(DECK_SIZE / numPlayers)))
}

/**
 * Fester Spielplan: von der höchsten Kartenzahl auf 1 herunter und wieder
 * hinauf (z. B. 6→1→6 = 11 Runden). Symmetrisch, die 1-Karten-Runde kommt
 * genau einmal vor.
 */
export function cardSchedule(numPlayers: number): number[] {
  const max = maxCardsPerRound(numPlayers)
  const schedule: number[] = []
  for (let c = max; c >= 1; c--) schedule.push(c)
  for (let c = 2; c <= max; c++) schedule.push(c)
  return schedule
}
