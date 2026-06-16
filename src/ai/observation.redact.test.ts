import { describe, expect, it } from 'vitest'
import { createGame } from '../game/engine'
import type { GameState } from '../game/types'
import { HIDDEN_CARD, isHiddenCard, redactState } from './observation'

function freshGame(seed = 123): GameState {
  return createGame({
    numPlayers: 4,
    difficulty: 'mittel',
    playerNames: ['A', 'B', 'C', 'D'],
    humanIndex: 0,
    seed,
  })
}

describe('redactState', () => {
  it('verbirgt fremde Hände, behält aber die Anzahl', () => {
    const game = freshGame()
    const view = redactState(game, 1)
    for (const p of view.players) {
      if (p.id === 1) {
        expect(p.hand.every(isHiddenCard)).toBe(false)
        expect(p.hand).toEqual(game.players[1].hand) // eigene Hand sichtbar
      } else {
        expect(p.hand.every(isHiddenCard)).toBe(true)
        expect(p.hand.length).toBe(game.players[p.id].hand.length) // Anzahl bleibt
      }
    }
  })

  it('entfernt den Seed (kein Rekonstruieren des Gebens)', () => {
    const game = freshGame()
    const view = redactState(game, 0)
    expect(view.seed).toBe(0)
    expect(view.config.seed).toBe(0)
    expect(view.config.humanIndex).toBe(0)
  })

  it('lässt öffentliche Felder unverändert', () => {
    const game = freshGame()
    const view = redactState(game, 2)
    expect(view.phase).toBe(game.phase)
    expect(view.dealer).toBe(game.dealer)
    expect(view.cardCount).toBe(game.cardCount)
    expect(view.bidder).toBe(game.bidder)
    expect(view.players.map((p) => p.bid)).toEqual(game.players.map((p) => p.bid))
    expect(view.players.map((p) => p.tricksWon)).toEqual(game.players.map((p) => p.tricksWon))
  })

  it('1-Karten-Runde: eigene Karte verdeckt, fremde offen', () => {
    const base = freshGame()
    const game: GameState = structuredClone(base)
    game.isOneCardRound = true
    for (const p of game.players) p.hand = [p.hand[0]]

    const view = redactState(game, 0)
    expect(view.players[0].hand.every(isHiddenCard)).toBe(true) // eigene verdeckt
    for (const p of view.players) {
      if (p.id !== 0) {
        expect(isHiddenCard(p.hand[0])).toBe(false) // fremde offen
        expect(p.hand[0]).toEqual(game.players[p.id].hand[0])
      }
    }
  })

  it('Stechen: laufende Lage bleibt verdeckt, Positionen erhalten', () => {
    const base = freshGame()
    const game: GameState = structuredClone(base)
    game.phase = 'playing'
    game.trick = {
      leader: 0,
      layers: [],
      currentLayer: [
        { playerId: 0, card: game.players[0].hand[0] },
        { playerId: 1, card: game.players[1].hand[0] },
      ],
      toAct: [2, 3],
      contenders: [0, 1, 2, 3],
      isStechen: true,
    }

    const view = redactState(game, 2)
    expect(view.trick?.currentLayer.map((pc) => pc.playerId)).toEqual([0, 1])
    expect(view.trick?.currentLayer.every((pc) => isHiddenCard(pc.card))).toBe(true)
  })

  it('verdeckte Karten sind serialisierbar und tragen keinen echten Wert', () => {
    const game = freshGame()
    const view = redactState(game, 0)
    const round = JSON.parse(JSON.stringify(view)) as GameState
    expect(round.players[1].hand.every(isHiddenCard)).toBe(true)
    expect(HIDDEN_CARD.suit).not.toMatch(/schellen|schilten|rosen|eichel/)
  })
})
