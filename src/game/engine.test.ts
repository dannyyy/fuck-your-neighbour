import { describe, expect, it } from 'vitest'
import type { Card, Rank, Suit } from './cards'
import {
  createGame,
  currentActor,
  legalPlays,
  nextRound,
  placeBid,
  playCard,
} from './engine'
import { legalBids } from './bidding'
import { seatOrderFrom } from './seating'
import { DEFAULT_RULES, TOTAL_ROUNDS } from './constants'
import type { ErbenResolution, GameConfig, GameState } from './types'

const card = (suit: Suit, rank: Rank): Card => ({ suit, rank })

function makePlayingState(hands: Card[][], leader: number): GameState {
  const n = hands.length
  const players = hands.map((hand, id) => ({
    id,
    name: `P${id}`,
    isHuman: id === 0,
    hand: [...hand],
    bid: 0,
    tricksWon: 0,
    scoreTotal: 0,
    lastRoundBid: null,
  }))
  const cardCount = hands[0].length
  const withCards = seatOrderFrom(leader, n).filter((id) => players[id].hand.length > 0)
  const config: GameConfig = {
    numPlayers: n,
    difficulty: 'mittel',
    playerNames: players.map((p) => p.name),
    humanIndex: 0,
    seed: 1,
  }
  return {
    config,
    seed: 1,
    players,
    roundIndex: 0,
    cardCount,
    isOneCardRound: cardCount === 1,
    dealer: (leader - 1 + n) % n,
    phase: 'playing',
    bidder: null,
    trick: { leader, layers: [], currentLayer: [], toAct: withCards, contenders: withCards.slice(), isStechen: false },
    completedTricks: [],
    history: [],
  }
}

/** Spielt jeden Stich, indem der jeweils am Zug befindliche Spieler hand[0] legt. */
function autoPlayTricks(state: GameState): GameState {
  let s = state
  let guard = 0
  while (s.phase === 'playing') {
    const actor = currentActor(s)!
    s = playCard(s, actor.playerId, s.players[actor.playerId].hand[0])
    if (++guard > 1000) throw new Error('Endlosschleife im Stichspiel')
  }
  return s
}

describe('Stechen – Mehrfach-Gutschrift', () => {
  it('ein Gleichstand → Gewinner erhält 2 Stiche', () => {
    const s = makePlayingState(
      [
        [card('schellen', 'ass'), card('schellen', '6')],
        [card('rosen', 'ass'), card('schellen', '7')],
        [card('schellen', 'koenig'), card('schellen', '8')],
      ],
      0,
    )
    const end = autoPlayTricks(s)
    expect(end.phase).toBe('roundEnd')
    expect(end.players[1].tricksWon).toBe(2)
    expect(end.players[0].tricksWon).toBe(0)
    expect(end.players[2].tricksWon).toBe(0)
    expect(end.completedTricks).toHaveLength(1)
    expect(end.completedTricks[0].credit).toBe(2)
    // Invariante: Summe = Kartenzahl
    expect(end.players.reduce((a, p) => a + p.tricksWon, 0)).toBe(end.cardCount)
  })

  it('zweifacher Gleichstand → Gewinner erhält 3 Stiche', () => {
    const s = makePlayingState(
      [
        [card('schellen', 'ass'), card('schellen', '9'), card('schellen', '6')],
        [card('rosen', 'ass'), card('rosen', '9'), card('schellen', '7')],
        [card('schellen', 'koenig'), card('schellen', '8'), card('schellen', 'banner')],
      ],
      0,
    )
    const end = autoPlayTricks(s)
    expect(end.players[1].tricksWon).toBe(3)
    expect(end.completedTricks[0].credit).toBe(3)
    expect(end.completedTricks[0].resolvedBy).toBe('high')
    expect(end.players.reduce((a, p) => a + p.tricksWon, 0)).toBe(3)
  })
})

describe('Erben (1-Karten-Runde)', () => {
  it('zwei gleiche Spitzen → darunterliegende Karte gewinnt', () => {
    const s = makePlayingState(
      [
        [card('schellen', 'ass')],
        [card('rosen', 'ass')],
        [card('schellen', 'koenig')],
      ],
      0,
    )
    const end = autoPlayTricks(s)
    expect(end.players[2].tricksWon).toBe(1)
    expect(end.completedTricks[0].resolvedBy).toBe('erben')
    expect(end.players.reduce((a, p) => a + p.tricksWon, 0)).toBe(1)
  })
})

describe('Erben-Varianten (letzte Karte, gleiche Spitzenkarten)', () => {
  // A:9 B:7 C:7 D:9, Anspieler 0 – die beiden 9er liegen gleichauf.
  function doubleTieState(resolution: ErbenResolution): GameState {
    const s = makePlayingState(
      [
        [card('rosen', '9')],
        [card('schilten', '7')],
        [card('eichel', '7')],
        [card('schellen', '9')],
      ],
      0,
    )
    s.config.rules = { ...DEFAULT_RULES, erbenResolution: resolution }
    return s
  }

  it('lower: 9er vererben, 7er gleichauf → der dem Anspieler nächste 7er-Spieler (1)', () => {
    const end = autoPlayTricks(doubleTieState('lower'))
    expect(end.completedTricks[0].winners).toEqual([1])
    expect(end.players[1].tricksWon).toBe(1)
    expect(end.completedTricks[0].resolvedBy).toBe('erben')
  })

  it('split: beide 9er-Spieler machen je einen Stich (Σ > Kartenzahl gewollt)', () => {
    const end = autoPlayTricks(doubleTieState('split'))
    expect([...end.completedTricks[0].winners].sort()).toEqual([0, 3])
    expect(end.players[0].tricksWon).toBe(1)
    expect(end.players[3].tricksWon).toBe(1)
    expect(end.players.reduce((a, p) => a + p.tricksWon, 0)).toBe(2)
  })

  it('none: niemand macht den Stich (Σ < Kartenzahl gewollt)', () => {
    const end = autoPlayTricks(doubleTieState('none'))
    expect(end.completedTricks[0].winners).toEqual([])
    expect(end.players.reduce((a, p) => a + p.tricksWon, 0)).toBe(0)
  })

  it('suit: höchste Farbe unter den 9ern gewinnt (Schellen schlägt Rosen)', () => {
    const end = autoPlayTricks(doubleTieState('suit'))
    expect(end.completedTricks[0].winners).toEqual([3])
    expect(end.players[3].tricksWon).toBe(1)
  })
})

describe('legalPlays', () => {
  it('gibt ohne Farbzwang die gesamte Hand zurück', () => {
    const s = makePlayingState(
      [
        [card('schellen', 'ass'), card('rosen', '6')],
        [card('schellen', 'koenig'), card('eichel', '7')],
        [card('schellen', '8'), card('rosen', '9')],
      ],
      0,
    )
    expect(legalPlays(s, 0)).toHaveLength(2)
  })
})

describe('Vollständiges Spiel – Invarianten', () => {
  function autoPlayGame(state: GameState): GameState {
    let s = state
    let guard = 0
    while (s.phase !== 'gameEnd') {
      if (s.phase === 'roundEnd') {
        s = nextRound(s)
        continue
      }
      const actor = currentActor(s)!
      if (actor.kind === 'bid') {
        s = placeBid(s, actor.playerId, legalBids(s, actor.playerId)[0])
      } else {
        s = playCard(s, actor.playerId, s.players[actor.playerId].hand[0])
      }
      if (++guard > 100000) throw new Error('Endlosschleife im Spiel')
    }
    return s
  }

  for (const n of [3, 4, 5, 6]) {
    for (const seed of [1, 42, 1337, 90210]) {
      it(`läuft ${n} Spieler / seed ${seed} sauber durch 11 Runden`, () => {
        const config: GameConfig = {
          numPlayers: n,
          difficulty: 'mittel',
          playerNames: Array.from({ length: n }, (_, i) => `P${i}`),
          humanIndex: 0,
          seed,
        }
        const end = autoPlayGame(createGame(config))
        expect(end.phase).toBe('gameEnd')
        expect(end.history).toHaveLength(TOTAL_ROUNDS)
        // Pro Runde: Summe der gemachten Stiche = Kartenzahl
        for (const round of end.history) {
          const sum = round.tricks.reduce((a, t) => a + t, 0)
          expect(sum).toBe(round.cardCount)
        }
        // Endpunkte = Summe aller Rundendeltas
        end.players.forEach((p, i) => {
          const total = end.history.reduce((a, r) => a + r.deltas[i], 0)
          expect(p.scoreTotal).toBe(total)
        })
      })
    }
  }
})

describe('Negativtests', () => {
  it('lehnt Ansage des falschen Spielers ab', () => {
    const state = createGame({
      numPlayers: 4,
      difficulty: 'mittel',
      playerNames: ['A', 'B', 'C', 'D'],
      humanIndex: 0,
      seed: 7,
    })
    const actor = currentActor(state)!
    const wrong = (actor.playerId + 1) % 4
    expect(() => placeBid(state, wrong, 0)).toThrow()
  })

  it('lehnt eine durch die Hook-Regel verbotene Ansage ab', () => {
    // Geber als Bieter, andere haben so angesagt, dass ein Wert verboten ist.
    const base = createGame({
      numPlayers: 3,
      difficulty: 'mittel',
      playerNames: ['A', 'B', 'C'],
      humanIndex: 0,
      seed: 3,
    })
    const state: GameState = {
      ...structuredClone(base),
      cardCount: 3,
      dealer: 2,
      bidder: 2,
    }
    state.players[0].bid = 1
    state.players[1].bid = 1
    state.players[2].bid = null
    // verboten: 3 − 2 = 1
    expect(legalBids(state, 2)).not.toContain(1)
    expect(() => placeBid(state, 2, 1)).toThrow()
    expect(() => placeBid(state, 2, 0)).not.toThrow()
  })

  it('lehnt das Spielen einer nicht gehaltenen Karte ab', () => {
    const s = makePlayingState(
      [
        [card('schellen', 'ass')],
        [card('rosen', 'ass')],
        [card('schellen', 'koenig')],
      ],
      0,
    )
    expect(() => playCard(s, 0, card('eichel', '6'))).toThrow()
  })

  it('lehnt das Spielen ausserhalb der Reihe ab', () => {
    const s = makePlayingState(
      [
        [card('schellen', 'ass')],
        [card('rosen', 'ass')],
        [card('schellen', 'koenig')],
      ],
      0,
    )
    // Anspieler ist 0 → Spieler 1 ist noch nicht dran
    expect(() => playCard(s, 1, card('rosen', 'ass'))).toThrow()
  })
})
