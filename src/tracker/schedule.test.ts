import { describe, expect, it } from 'vitest'
import { cardSchedule, maxCardsPerRound } from './schedule'

describe('maxCardsPerRound (36er-Deck, max. 6)', () => {
  it('2–6 Spieler → 6 Karten (wie im digitalen Spiel)', () => {
    for (let n = 2; n <= 6; n++) expect(maxCardsPerRound(n)).toBe(6)
  })

  it('7 Spieler → 5, 8 Spieler → 4 (Deck-Grenze)', () => {
    expect(maxCardsPerRound(7)).toBe(5)
    expect(maxCardsPerRound(8)).toBe(4)
  })
})

describe('cardSchedule (hoch→1→hoch, symmetrisch)', () => {
  it('für ≤6 Spieler 11 Runden wie das digitale Spiel', () => {
    expect(cardSchedule(4)).toEqual([6, 5, 4, 3, 2, 1, 2, 3, 4, 5, 6])
  })

  it('8 Spieler → 4→1→4 = 7 Runden', () => {
    expect(cardSchedule(8)).toEqual([4, 3, 2, 1, 2, 3, 4])
  })

  it('Summe ist symmetrisch und enthält die 1 genau einmal', () => {
    const s = cardSchedule(7)
    expect(s).toEqual([5, 4, 3, 2, 1, 2, 3, 4, 5])
    expect(s.filter((c) => c === 1)).toHaveLength(1)
  })
})
