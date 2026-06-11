import { isLegalBid } from './bidding'
import { cardId, createDeck, sameCard, type Card } from './cards'
import { ROUND_CARD_COUNTS, TOTAL_ROUNDS } from './constants'
import { roundScore } from './scoring'
import { makeRng, shuffleInPlace, type Rng } from './rng'
import { nextSeat, seatOrderFrom } from './seating'
import { erbenWinners, topContenders } from './trick'
import type {
  GameConfig,
  GameState,
  PlayedCard,
  PlayerState,
  RoundScore,
  TrickInProgress,
} from './types'

export type Actor =
  | { kind: 'bid'; playerId: number }
  | { kind: 'play'; playerId: number }
  | null

/** Wer ist gerade am Zug – und welche Art von Zug wird erwartet? */
export function currentActor(state: GameState): Actor {
  if (state.phase === 'bidding' && state.bidder !== null) {
    return { kind: 'bid', playerId: state.bidder }
  }
  if (state.phase === 'playing' && state.trick) {
    return { kind: 'play', playerId: state.trick.toAct[0] }
  }
  return null
}

/** Erlaubte Karten – ohne Farbzwang ist jede Handkarte spielbar. */
export function legalPlays(state: GameState, playerId: number): Card[] {
  return state.players[playerId].hand.slice()
}

// ---------------------------------------------------------------------------
// Spielaufbau
// ---------------------------------------------------------------------------

export function createGame(config: GameConfig): GameState {
  const rng = makeRng(config.seed || 1)
  const players: PlayerState[] = Array.from({ length: config.numPlayers }, (_, id) => ({
    id,
    name: config.playerNames[id] ?? `Spieler ${id + 1}`,
    isHuman: id === config.humanIndex,
    hand: [],
    bid: null,
    tricksWon: 0,
    scoreTotal: 0,
    lastRoundBid: null,
  }))

  const state: GameState = {
    config,
    seed: config.seed || 1,
    players,
    roundIndex: 0,
    cardCount: ROUND_CARD_COUNTS[0],
    isOneCardRound: false, // wird in setupRound() korrekt gesetzt
    dealer: rng.int(config.numPlayers),
    phase: 'bidding',
    bidder: null,
    trick: null,
    completedTricks: [],
    history: [],
  }

  setupRound(state, rng)
  state.seed = rng.getState()
  return state
}

function setupRound(state: GameState, rng: Rng): void {
  const n = state.config.numPlayers
  state.cardCount = ROUND_CARD_COUNTS[state.roundIndex]
  state.isOneCardRound = state.cardCount === 1

  const deck = shuffleInPlace(createDeck(), rng)
  let pos = 0
  for (const player of state.players) {
    player.hand = deck.slice(pos, pos + state.cardCount)
    player.bid = null
    player.tricksWon = 0
    pos += state.cardCount
  }

  state.completedTricks = []
  state.trick = null
  state.phase = 'bidding'
  state.bidder = nextSeat(state.dealer, n) // rechts des Gebers beginnt
}

// ---------------------------------------------------------------------------
// Ansage
// ---------------------------------------------------------------------------

export function placeBid(state: GameState, playerId: number, bid: number): GameState {
  if (state.phase !== 'bidding') throw new Error('Ansage ausserhalb der Ansagephase')
  if (state.bidder !== playerId) throw new Error('Spieler ist nicht mit der Ansage dran')
  if (!isLegalBid(state, playerId, bid)) throw new Error(`Unerlaubte Ansage: ${bid}`)

  const next = structuredClone(state)
  next.players[playerId].bid = bid

  const n = next.config.numPlayers
  const allBid = next.players.every((p) => p.bid !== null)
  if (allBid) {
    next.phase = 'playing'
    next.bidder = null
    startTrick(next, nextSeat(next.dealer, n)) // erster Anspieler: rechts des Gebers
  } else {
    next.bidder = nextSeat(playerId, n)
  }
  return next
}

// ---------------------------------------------------------------------------
// Stichspiel (mit Lagen / Stechen)
// ---------------------------------------------------------------------------

function startTrick(state: GameState, leader: number): void {
  const n = state.config.numPlayers
  const withCards = seatOrderFrom(leader, n).filter((id) => state.players[id].hand.length > 0)
  const trick: TrickInProgress = {
    leader,
    layers: [],
    currentLayer: [],
    toAct: withCards,
    contenders: withCards.slice(),
    isStechen: false,
  }
  state.trick = trick
}

export function playCard(state: GameState, playerId: number, card: Card): GameState {
  if (state.phase !== 'playing' || !state.trick) throw new Error('Kein Stich aktiv')
  if (state.trick.toAct[0] !== playerId) throw new Error('Spieler ist nicht am Zug')

  const player = state.players[playerId]
  if (!player.hand.some((c) => sameCard(c, card))) {
    throw new Error(`Karte ${cardId(card)} nicht auf der Hand`)
  }

  const next = structuredClone(state)
  const trick = next.trick!
  const handIndex = next.players[playerId].hand.findIndex((c) => sameCard(c, card))
  next.players[playerId].hand.splice(handIndex, 1)
  trick.currentLayer.push({ playerId, card })
  trick.toAct.shift()

  if (trick.toAct.length === 0) {
    resolveLayer(next)
  }
  return next
}

function resolveLayer(state: GameState): void {
  const n = state.config.numPlayers
  const trick = state.trick!
  trick.layers.push(trick.currentLayer)

  const tiedTop = topContenders(trick.currentLayer, trick.contenders)
  const handsEmpty = state.players.every((p) => p.hand.length === 0)

  if (tiedTop.length === 1) {
    finalizeTrick(state, [tiedTop[0]], trick.layers.length, 'high')
    return
  }

  if (!handsEmpty) {
    // Stechen: alle legen erneut eine Karte; nur die Gleichstands-Spieler kämpfen.
    trick.contenders = tiedTop
    trick.currentLayer = []
    trick.toAct = seatOrderFrom(trick.leader, n).filter(
      (id) => state.players[id].hand.length > 0,
    )
    trick.isStechen = true
    return
  }

  // Letzte Karte + Gleichstand → Erben (Auflösung je nach Regelvariante).
  const resolution = state.config.rules?.erbenResolution ?? 'lower'
  const winners = erbenWinners(trick.currentLayer, trick.contenders, trick.leader, n, resolution)
  finalizeTrick(state, winners, trick.layers.length, 'erben')
}

function finalizeTrick(
  state: GameState,
  winners: number[],
  credit: number,
  resolvedBy: 'high' | 'erben',
): void {
  const trick = state.trick!
  for (const w of winners) state.players[w].tricksWon += credit
  state.completedTricks.push({
    leader: trick.leader,
    layers: trick.layers,
    winners,
    credit,
    resolvedBy,
  })
  state.trick = null

  const handsEmpty = state.players.every((p) => p.hand.length === 0)
  if (handsEmpty) {
    endRound(state)
  } else {
    // Nur der reguläre Einzelsieger spielt an; Erben tritt ausschliesslich auf
    // der letzten Karte auf, danach folgt kein weiterer Stich mehr.
    startTrick(state, winners[0])
  }
}

// ---------------------------------------------------------------------------
// Rundenabschluss & -wechsel
// ---------------------------------------------------------------------------

function endRound(state: GameState): void {
  const rules = state.config.rules
  const deltas = state.players.map((p) =>
    roundScore(p.bid ?? 0, p.tricksWon, rules?.hitScore, rules?.missPenalty),
  )
  state.players.forEach((p, i) => {
    p.scoreTotal += deltas[i]
    p.lastRoundBid = p.bid
  })

  const result: RoundScore = {
    round: state.roundIndex,
    cardCount: state.cardCount,
    bids: state.players.map((p) => p.bid),
    tricks: state.players.map((p) => p.tricksWon),
    deltas,
    totals: state.players.map((p) => p.scoreTotal),
  }
  state.history.push(result)
  state.phase = 'roundEnd'
}

/** Übergang vom Rundenende zur nächsten Runde (oder Spielende). */
export function nextRound(state: GameState): GameState {
  if (state.phase !== 'roundEnd') throw new Error('Runde ist noch nicht abgeschlossen')

  const next = structuredClone(state)
  if (next.roundIndex >= TOTAL_ROUNDS - 1) {
    next.phase = 'gameEnd'
    next.bidder = null
    next.trick = null
    return next
  }

  const rng = makeRng(next.seed)
  next.roundIndex += 1
  next.dealer = nextSeat(next.dealer, next.config.numPlayers)
  setupRound(next, rng)
  next.seed = rng.getState()
  return next
}

// ---------------------------------------------------------------------------
// Abfragen
// ---------------------------------------------------------------------------

export function isGameOver(state: GameState): boolean {
  return state.phase === 'gameEnd'
}

/** Gesamtkarten der Runde – zugleich Summe aller gemachten Stiche (Invariante). */
export function totalTricksThisRound(state: GameState): number {
  return state.cardCount
}

/** Sitze in Spielreihenfolge ab dem aktuellen Stich-Anspieler. */
export function currentTrickCards(state: GameState): PlayedCard[] {
  if (!state.trick) return []
  return [...state.trick.layers.flat(), ...state.trick.currentLayer]
}

export function rankings(state: GameState): PlayerState[] {
  return [...state.players].sort((a, b) => b.scoreTotal - a.scoreTotal)
}
