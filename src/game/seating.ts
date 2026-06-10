/** Sitz-/Reihenfolge-Hilfen. Spiel und Ansage laufen via `nextSeat` reihum. */

export function nextSeat(seat: number, numPlayers: number): number {
  return (seat + 1) % numPlayers
}

/** Reihenfolge der Sitze ab `start` (inkl.), einmal rundum. */
export function seatOrderFrom(start: number, numPlayers: number): number[] {
  return Array.from({ length: numPlayers }, (_, k) => (start + k) % numPlayers)
}

/** Erster Sitz ab `start`, der in `set` enthalten ist (für „nächster zum Anspieler“). */
export function nearestInSet(start: number, numPlayers: number, set: Set<number>): number {
  for (const seat of seatOrderFrom(start, numPlayers)) {
    if (set.has(seat)) return seat
  }
  return start
}
