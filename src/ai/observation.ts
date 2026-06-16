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

  // Im Duell/Stechen legen alle ihre Karte verdeckt: die laufende Lage ist erst
  // sichtbar, wenn alle gelegt haben. Bis dahin kämpft die KI „blind“ – sie darf
  // die bereits gelegten Karten dieser Lage weder sehen noch mitzählen.
  const battleConcealed = !!state.trick?.isStechen

  const playedCards: Card[] = []
  for (const trick of state.completedTricks) {
    for (const layer of trick.layers) for (const pc of layer) playedCards.push(pc.card)
  }
  if (state.trick) {
    for (const layer of state.trick.layers) for (const pc of layer) playedCards.push(pc.card)
    if (!battleConcealed) {
      for (const pc of state.trick.currentLayer) playedCards.push(pc.card)
    }
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
    currentLayerPlays: state.trick && !battleConcealed ? state.trick.currentLayer.slice() : [],
    contenders: state.trick ? state.trick.contenders.slice() : [],
    amContender: state.trick ? state.trick.contenders.includes(playerId) : false,
    myBid: me.bid,
    myTricksWon: me.tricksWon,
    legalBids: state.phase === 'bidding' ? legalBids(state, playerId) : [],
    legalPlays: state.phase === 'playing' ? legalPlays(state, playerId) : [],
  }
}

/**
 * Platzhalter für verdeckte Karten in einem redigierten Zustand. Der Wert ist
 * bewusst kein gültiger Rang/Farbe – er wird nie aufgedeckt gerendert (nur an
 * Stellen, die ohnehin `faceDown` zeichnen), trägt also keinerlei Information.
 */
export const HIDDEN_CARD = { suit: 'hidden', rank: 'hidden' } as unknown as Card

export function isHiddenCard(card: Card): boolean {
  return (card as { suit: string }).suit === 'hidden'
}

/**
 * Baut einen vollständigen, aber **redigierten** `GameState` aus Sicht von
 * `forSeat`. Anders als `buildView` (für die KI) behält das Ergebnis exakt die
 * `GameState`-Form, sodass die bestehenden UI-Komponenten es unverändert
 * rendern – ideal, um jedem entfernten Spieler nur seine legale Sicht zu senden.
 *
 * Es gelten dieselben Geheimhaltungsregeln wie in `buildView`:
 *  - fremde Hände werden verdeckt (Anzahl bleibt erhalten),
 *  - in der 1-Karten-Runde ist die eigene Karte verdeckt, die fremden offen,
 *  - eine laufende Stechen-Lage bleibt verdeckt,
 *  - der Seed wird entfernt (sonst liesse sich das Geben rekonstruieren).
 */
export function redactState(state: GameState, forSeat: number): GameState {
  const redacted = structuredClone(state)
  const isOne = state.isOneCardRound

  for (const p of redacted.players) {
    if (p.id === forSeat) {
      // Eigene Karte in der 1-Karten-Runde verdecken; sonst Hand sichtbar lassen.
      if (isOne) p.hand = p.hand.map(() => HIDDEN_CARD)
    } else if (!isOne) {
      // Fremde Hand verdecken, aber die Anzahl (öffentlich) erhalten.
      p.hand = p.hand.map(() => HIDDEN_CARD)
    }
    // 1-Karten-Runde + fremder Spieler: Karte bleibt offen sichtbar (legal).
  }

  // Laufende Stechen-Lage verdeckt halten (Positionen/Spieler bleiben erhalten).
  if (redacted.trick?.isStechen) {
    redacted.trick.currentLayer = redacted.trick.currentLayer.map((pc) => ({
      playerId: pc.playerId,
      card: HIDDEN_CARD,
    }))
  }

  redacted.seed = 0
  redacted.config = { ...redacted.config, seed: 0, humanIndex: forSeat }
  return redacted
}
