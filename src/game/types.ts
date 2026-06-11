import type { Card } from './cards'

export type Difficulty = 'leicht' | 'mittel' | 'schwer'

export type Phase = 'bidding' | 'playing' | 'roundEnd' | 'gameEnd'

/**
 * Konfigurierbare Regelvarianten. Die Engine liest diese Werte statt fester
 * Konstanten, damit sich Regeln im Einstellungsmenü an-/abschalten lassen.
 */
export interface GameRules {
  /** „Niemand darf zweimal in Folge 0 ansagen“ (gilt nie in der 1-Karten-Runde). */
  doubleZeroRule: boolean
  /** Punkte bei exakt getroffener Ansage (Standard 10). */
  hitScore: number
  /** Strafe pro Stich Abweichung (Standard 5). */
  missPenalty: number
}

export interface GameConfig {
  numPlayers: number
  difficulty: Difficulty
  /** Anzeigenamen; Index entspricht der Spieler-ID. */
  playerNames: string[]
  /** Index des menschlichen Spielers (üblicherweise 0). */
  humanIndex: number
  seed: number
  /** Aktive Regelvarianten (optional – fehlt sie, gelten die Standardwerte). */
  rules?: GameRules
}

export interface PlayedCard {
  playerId: number
  card: Card
}

export interface PlayerState {
  id: number
  name: string
  isHuman: boolean
  hand: Card[]
  /** Ansage dieser Runde (null = noch nicht angesagt). */
  bid: number | null
  /** In dieser Runde gutgeschriebene Stiche. */
  tricksWon: number
  scoreTotal: number
  /** Ansage der Vorrunde – für die „nicht zweimal 0“-Regel. */
  lastRoundBid: number | null
}

export interface RoundScore {
  round: number
  cardCount: number
  bids: (number | null)[]
  tricks: number[]
  deltas: number[]
  totals: number[]
}

export type TrickResolution = 'high' | 'erben'

export interface TrickRecord {
  leader: number
  layers: PlayedCard[][]
  winner: number
  credit: number
  resolvedBy: TrickResolution
}

/** Ein laufender Stich, der sich über mehrere „Lagen“ (Stechen) erstrecken kann. */
export interface TrickInProgress {
  leader: number
  /** Bereits abgeschlossene Lagen. */
  layers: PlayedCard[][]
  /** Karten der aktuell laufenden Lage (in Spielreihenfolge). */
  currentLayer: PlayedCard[]
  /** Verbleibende Spieler, die in dieser Lage noch legen müssen (Sitzreihenfolge). */
  toAct: number[]
  /** Spieler, die um den Stich kämpfen (erste Lage = alle mit Karten). */
  contenders: number[]
  /** true sobald mindestens ein Stechen lief (mehr als eine Lage). */
  isStechen: boolean
}

export interface GameState {
  config: GameConfig
  seed: number
  players: PlayerState[]
  roundIndex: number
  cardCount: number
  isOneCardRound: boolean
  dealer: number
  phase: Phase
  /** Wer ist mit der Ansage dran (Phase „bidding“)? */
  bidder: number | null
  trick: TrickInProgress | null
  completedTricks: TrickRecord[]
  history: RoundScore[]
}
