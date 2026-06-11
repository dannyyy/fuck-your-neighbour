import type { Card } from './cards'

export type Difficulty = 'leicht' | 'mittel' | 'schwer'

export type Phase = 'bidding' | 'playing' | 'roundEnd' | 'gameEnd'

/**
 * Wie wird ein Gleichstand der Spitzenkarten auf der letzten Karte aufgelöst
 * („Erben“ – es gibt keine Karte mehr zum Stechen)?
 *   - `lower`: die darunterliegende Karte erbt den Stich; bleibt alles gleich,
 *     gewinnt der dem Anspieler nächste Spieler. (Bisheriges Verhalten.)
 *   - `split`: alle gleichauf liegenden Spieler machen den Stich.
 *   - `none`:  keiner der gleichauf liegenden Spieler macht den Stich.
 *   - `suit`:  die Kartenfarbe entscheidet (Rosen < Schilten < Eichel < Schellen).
 *
 * Achtung: `split` und `none` durchbrechen bewusst die Invariante
 * „Σ Stiche = Kartenzahl“ – das ist bei diesen Varianten gewollt.
 */
export type ErbenResolution = 'lower' | 'split' | 'none' | 'suit'

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
  /** Auflösung des Gleichstands auf der letzten Karte (Standard `lower`). */
  erbenResolution: ErbenResolution
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
  /**
   * Stichgewinner. Normalfall genau einer; bei der Erben-Variante `split` mehrere,
   * bei `none` keiner. Jeder Gewinner erhält `credit` Stiche gutgeschrieben.
   */
  winners: number[]
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
