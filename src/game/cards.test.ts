import { describe, expect, it } from 'vitest'
import {
  RANKS,
  cardId,
  compareByRank,
  createDeck,
  rankStrength,
  type Card,
} from './cards'

describe('Deck', () => {
  it('enthält 36 eindeutige Karten', () => {
    const deck = createDeck()
    expect(deck).toHaveLength(36)
    expect(new Set(deck.map(cardId)).size).toBe(36)
  })

  it('hat 9 Ränge in jeder der 4 Farben', () => {
    expect(RANKS).toHaveLength(9)
  })
})

describe('Rangordnung 6<7<8<10/Banner<Under<Ober<König<9<Ass', () => {
  it('ordnet die Ränge in der vorgegebenen Reihenfolge', () => {
    const ordered: Card['rank'][] = [
      '6',
      '7',
      '8',
      'banner',
      'under',
      'ober',
      'koenig',
      '9',
      'ass',
    ]
    const strengths = ordered.map(rankStrength)
    const sorted = [...strengths].sort((a, b) => a - b)
    expect(strengths).toEqual(sorted)
  })

  it('macht die 9 zur zweithöchsten Karte (direkt unter Ass)', () => {
    expect(rankStrength('9')).toBeGreaterThan(rankStrength('koenig'))
    expect(rankStrength('ass')).toBeGreaterThan(rankStrength('9'))
  })

  it('stellt die 10/Banner unter den Under', () => {
    expect(rankStrength('banner')).toBeLessThan(rankStrength('under'))
    expect(rankStrength('banner')).toBeGreaterThan(rankStrength('8'))
  })

  it('compareByRank: 9 schlägt König, aber nicht Ass', () => {
    const card = (rank: Card['rank']): Card => ({ suit: 'schellen', rank })
    expect(compareByRank(card('9'), card('koenig'))).toBeGreaterThan(0)
    expect(compareByRank(card('9'), card('ass'))).toBeLessThan(0)
    expect(compareByRank(card('banner'), card('under'))).toBeLessThan(0)
  })
})
