import { describe, expect, it } from 'vitest'
import type { Card, Rank, Suit } from '../game/cards'
import { cardId } from '../game/cards'
import { legalBids } from '../game/bidding'
import { createGame, currentActor, nextRound, placeBid, playCard } from '../game/engine'
import { makeRng } from '../game/rng'
import { TOTAL_ROUNDS } from '../game/constants'
import type { GameConfig, GameState } from '../game/types'
import { createAi } from './index'
import { buildView } from './observation'
import { chooseTactical } from './policy'
import type { PlayerView } from './types'

const card = (suit: Suit, rank: Rank): Card => ({ suit, rank })

function baseOneCardView(visible: Record<number, Card>): PlayerView {
  return {
    playerId: 0,
    numPlayers: 3,
    difficulty: 'schwer',
    cardCount: 1,
    isOneCardRound: true,
    ownHand: null,
    visibleOpponentCards: visible,
    bids: [null, null, null],
    tricksWon: [0, 0, 0],
    handSizes: [1, 1, 1],
    leaderForRound: 1,
    dealer: 2,
    erbenResolution: 'lower',
    playedCards: [],
    currentLayerPlays: [],
    contenders: [],
    amContender: false,
    myBid: null,
    myTricksWon: 0,
    legalBids: [0, 1],
    legalPlays: [],
  }
}

describe('chooseTactical', () => {
  it('gewinnt billigst (niedrigster Gewinner)', () => {
    const hand = [card('schellen', 'ass'), card('schellen', '9'), card('schellen', '6')]
    const best = [card('rosen', 'koenig')]
    expect(chooseTactical(hand, best, true, 1).rank).toBe('9') // 9 schlägt König, billiger als Ass
  })

  it('duckt mit der höchsten sicheren Karte', () => {
    const hand = [card('schellen', 'ass'), card('schellen', '8'), card('schellen', '6')]
    const best = [card('rosen', 'koenig')]
    expect(chooseTactical(hand, best, true, 0).rank).toBe('8')
  })

  it('Abwurf als Nicht-Wettkämpfer: niedrigste Karte wenn noch Stiche gewünscht', () => {
    const hand = [card('schellen', 'ass'), card('schellen', '6')]
    expect(chooseTactical(hand, [], false, 2).rank).toBe('6')
  })
})

describe('1-Karten-Runde – Ansage über Wahrscheinlichkeit', () => {
  it('sagt 1 an, wenn alle sichtbaren Gegnerkarten tief sind', () => {
    const ai = createAi('schwer')
    const view = baseOneCardView({ 1: card('schellen', '6'), 2: card('schilten', '7') })
    expect(ai.decideBid(view, makeRng(11))).toBe(1)
  })

  it('sagt 0 an, wenn ein Gegner das Ass offen zeigt (eigene Karte kann nie gewinnen)', () => {
    const ai = createAi('schwer')
    const view = baseOneCardView({ 1: card('schellen', 'ass'), 2: card('schilten', '9') })
    expect(ai.decideBid(view, makeRng(11))).toBe(0)
  })
})

describe('KI – Legalität & Robustheit (volles KI-vs-KI-Spiel)', () => {
  function playFullAiGame(config: GameConfig): GameState {
    const ai = createAi(config.difficulty)
    const rng = makeRng(config.seed + 999)
    let s = createGame(config)
    let guard = 0
    while (s.phase !== 'gameEnd') {
      if (s.phase === 'roundEnd') {
        s = nextRound(s)
        continue
      }
      const actor = currentActor(s)!
      const view = buildView(s, actor.playerId)
      if (actor.kind === 'bid') {
        const bid = ai.decideBid(view, rng)
        expect(legalBids(s, actor.playerId)).toContain(bid) // immer legal
        s = placeBid(s, actor.playerId, bid)
      } else {
        const card = ai.chooseCard(view, rng)
        expect(s.players[actor.playerId].hand.map(cardId)).toContain(cardId(card)) // in der Hand
        s = playCard(s, actor.playerId, card)
      }
      if (++guard > 100000) throw new Error('Endlosschleife')
    }
    return s
  }

  for (const n of [3, 4, 6]) {
    it(`spielt ${n} KIs sauber durch 11 Runden`, () => {
      const config: GameConfig = {
        numPlayers: n,
        difficulty: 'mittel',
        playerNames: Array.from({ length: n }, (_, i) => `KI ${i}`),
        humanIndex: 0,
        seed: 2024 + n,
      }
      const end = playFullAiGame(config)
      expect(end.history).toHaveLength(TOTAL_ROUNDS)
      for (const round of end.history) {
        expect(round.tricks.reduce((a, t) => a + t, 0)).toBe(round.cardCount)
      }
    })
  }

  it('jede Schwierigkeit produziert gültige Ansagen und Karten', () => {
    for (const difficulty of ['leicht', 'mittel', 'schwer'] as const) {
      const config: GameConfig = {
        numPlayers: 4,
        difficulty,
        playerNames: ['A', 'B', 'C', 'D'],
        humanIndex: 0,
        seed: 555,
      }
      expect(() => playFullAiGame(config)).not.toThrow()
    }
  })
})
