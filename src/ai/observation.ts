import { legalBids } from '../game/bidding'
import type { Card } from '../game/cards'
import { legalPlays } from '../game/engine'
import { nextSeat } from '../game/seating'
import type { GameState } from '../game/types'
import type { PlayerView } from './types'

/** Baut die legale Sicht eines Spielers aus dem (wahrheitsgemässen) Spielzustand. */
export function buildView(state: GameState, playerId: number): PlayerView {
  const n = state.config.numPlayers
  const isOne = state.isOneCardRound
  const me = state.players[playerId]

  const visibleOpponentCards: Record<number, Card> = {}
  if (isOne) {
    for (const p of state.players) {
      if (p.id !== playerId && p.hand.length > 0) visibleOpponentCards[p.id] = p.hand[0]
    }
  }

  const playedCards: Card[] = []
  for (const trick of state.completedTricks) {
    for (const layer of trick.layers) for (const pc of layer) playedCards.push(pc.card)
  }
  if (state.trick) {
    for (const layer of state.trick.layers) for (const pc of layer) playedCards.push(pc.card)
    for (const pc of state.trick.currentLayer) playedCards.push(pc.card)
  }

  return {
    playerId,
    numPlayers: n,
    difficulty: state.config.difficulty,
    cardCount: state.cardCount,
    isOneCardRound: isOne,
    ownHand: isOne ? null : me.hand.slice(),
    visibleOpponentCards,
    bids: state.players.map((p) => p.bid),
    tricksWon: state.players.map((p) => p.tricksWon),
    handSizes: state.players.map((p) => p.hand.length),
    leaderForRound: nextSeat(state.dealer, n),
    dealer: state.dealer,
    playedCards,
    currentLayerPlays: state.trick ? state.trick.currentLayer.slice() : [],
    contenders: state.trick ? state.trick.contenders.slice() : [],
    amContender: state.trick ? state.trick.contenders.includes(playerId) : false,
    myBid: me.bid,
    myTricksWon: me.tricksWon,
    legalBids: state.phase === 'bidding' ? legalBids(state, playerId) : [],
    legalPlays: state.phase === 'playing' ? legalPlays(state, playerId) : [],
  }
}
