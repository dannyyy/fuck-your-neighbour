import { describe, expect, it } from 'vitest'
import { isLegalBid, legalBids } from './bidding'
import type { GameConfig, GameRules, GameState, PlayerState } from './types'

function makeBiddingState(opts: {
  n: number
  cardCount: number
  dealer: number
  bids?: (number | null)[]
  lastRoundBids?: (number | null)[]
  rules?: GameRules
}): GameState {
  const { n, cardCount, dealer, bids = [], lastRoundBids = [], rules } = opts
  const players: PlayerState[] = Array.from({ length: n }, (_, id) => ({
    id,
    name: `P${id}`,
    isHuman: id === 0,
    hand: [],
    bid: bids[id] ?? null,
    tricksWon: 0,
    scoreTotal: 0,
    lastRoundBid: lastRoundBids[id] ?? null,
  }))
  const config: GameConfig = {
    numPlayers: n,
    difficulty: 'mittel',
    playerNames: players.map((p) => p.name),
    humanIndex: 0,
    seed: 1,
    rules,
  }
  return {
    config,
    seed: 1,
    players,
    roundIndex: 0,
    cardCount,
    isOneCardRound: cardCount === 1,
    dealer,
    phase: 'bidding',
    bidder: dealer,
    trick: null,
    completedTricks: [],
    history: [],
  }
}

describe('legalBids – Basismenge', () => {
  it('erlaubt 0..Kartenzahl für einen Nicht-letzten Bieter', () => {
    const state = makeBiddingState({ n: 4, cardCount: 3, dealer: 3 })
    // Spieler 0 ist nicht der Geber → keine Hook-Beschränkung
    expect(legalBids(state, 0)).toEqual([0, 1, 2, 3])
  })
})

describe('legalBids – Hook-Regel (Summe ≠ Kartenzahl) für den letzten Bieter (Geber)', () => {
  it('verbietet beim Geber den Wert, der die Summe auf die Kartenzahl bringt', () => {
    // 3 Karten, andere haben 1 + 1 = 2 angesagt → verboten: 3 − 2 = 1
    const state = makeBiddingState({
      n: 3,
      cardCount: 3,
      dealer: 2,
      bids: [1, 1, null],
    })
    const legal = legalBids(state, 2)
    expect(legal).not.toContain(1)
    expect(legal).toEqual([0, 2, 3])
    expect(isLegalBid(state, 2, 1)).toBe(false)
    expect(isLegalBid(state, 2, 0)).toBe(true)
  })

  it('verbietet 0, wenn die anderen bereits zusammen die Kartenzahl angesagt haben', () => {
    // 3 Karten, andere 2 + 1 = 3 → verboten: 3 − 3 = 0
    const state = makeBiddingState({
      n: 3,
      cardCount: 3,
      dealer: 2,
      bids: [2, 1, null],
    })
    expect(legalBids(state, 2)).toEqual([1, 2, 3])
  })
})

describe('legalBids – „nicht zweimal in Folge 0“', () => {
  it('verbietet 0, wenn der Spieler in der Vorrunde 0 angesagt hat', () => {
    const state = makeBiddingState({
      n: 4,
      cardCount: 3,
      dealer: 3,
      lastRoundBids: [0, null, null, null],
    })
    expect(legalBids(state, 0)).toEqual([1, 2, 3])
  })

  it('erlaubt 0 wieder, wenn der Spieler in der Vorrunde NICHT 0 hatte', () => {
    const state = makeBiddingState({
      n: 4,
      cardCount: 3,
      dealer: 3,
      lastRoundBids: [2, null, null, null],
    })
    expect(legalBids(state, 0)).toContain(0)
  })
})

describe('legalBids – „nicht zweimal in Folge 0“ greift nicht in der 1-Karten-Runde', () => {
  it('erlaubt 0, obwohl der Spieler in der Vorrunde 0 hatte (nur 1 Karte)', () => {
    const state = makeBiddingState({
      n: 4,
      cardCount: 1,
      dealer: 3,
      lastRoundBids: [0, null, null, null],
    })
    // Spieler 0 ist nicht der Geber → keine Hook-Beschränkung; 0-zweimal greift nicht.
    expect(legalBids(state, 0)).toEqual([0, 1])
  })
})

describe('legalBids – Regel „nicht zweimal 0“ abschaltbar', () => {
  it('erlaubt 0 trotz Vorrunde-0, wenn die Regel deaktiviert ist', () => {
    const state = makeBiddingState({
      n: 4,
      cardCount: 3,
      dealer: 3,
      lastRoundBids: [0, null, null, null],
      rules: { doubleZeroRule: false, hitScore: 10, missPenalty: 5 },
    })
    expect(legalBids(state, 0)).toEqual([0, 1, 2, 3])
  })
})

describe('legalBids – Konfliktfall (Hook hat Vorrang vor „kein 0-zweimal“)', () => {
  it('1-Karten-Runde: Geber müsste 0 sagen (Hook verbietet 1), hatte aber Vorrunde 0 → 0 bleibt erlaubt', () => {
    // 1 Karte, andere haben 0 angesagt → Hook verbietet 1 (Summe würde 1).
    // Geber hatte Vorrunde 0 → „kein 0-zweimal“ würde 0 verbieten → Konflikt → 0 erlaubt.
    const state = makeBiddingState({
      n: 2,
      cardCount: 1,
      dealer: 1,
      bids: [0, null],
      lastRoundBids: [null, 0],
    })
    expect(legalBids(state, 1)).toEqual([0])
  })
})
