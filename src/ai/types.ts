import type { Card } from '../game/cards'
import type { Rng } from '../game/rng'
import type { Difficulty, PlayedCard } from '../game/types'

/**
 * Was ein Spieler legal sehen darf. Die KI trifft Entscheidungen NUR auf Basis
 * dieser Sicht – nie auf den verdeckten Händen der Gegner (Ausnahme: in der
 * 1-Karten-Runde sind die Karten der Gegner offen sichtbar, die eigene nicht).
 */
export interface PlayerView {
  playerId: number
  numPlayers: number
  difficulty: Difficulty
  cardCount: number
  isOneCardRound: boolean
  /** Eigene Hand – null in der 1-Karten-Runde (man sieht die eigene Karte nicht). */
  ownHand: Card[] | null
  /** Offen sichtbare Gegnerkarten (nur 1-Karten-Runde), je Spieler-ID. */
  visibleOpponentCards: Record<number, Card>
  bids: (number | null)[]
  tricksWon: number[]
  handSizes: number[]
  /** Erster Anspieler der Runde (rechts des Gebers). */
  leaderForRound: number
  dealer: number
  /** Alle in dieser Runde bereits gespielten Karten (öffentliches Gedächtnis). */
  playedCards: Card[]
  /** Karten der aktuell laufenden Lage (zur Bestimmung „zu schlagende Karte“). */
  currentLayerPlays: PlayedCard[]
  contenders: number[]
  amContender: boolean
  myBid: number | null
  myTricksWon: number
  legalBids: number[]
  legalPlays: Card[]
}

export interface Ai {
  decideBid(view: PlayerView, rng: Rng): number
  chooseCard(view: PlayerView, rng: Rng): Card
}
