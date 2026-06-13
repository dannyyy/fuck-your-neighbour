/**
 * Datenmodell für den manuellen Punkte-Tracker (echte Tischrunden).
 *
 * Bewusst getrennt vom digitalen Spiel (`game/`): hier werden nur Ansagen,
 * Stiche und Punkte erfasst – keine Karten, kein Spielzustand. Die einzige
 * gemeinsame Logik ist die Rundenwertung (`game/scoring.ts`).
 */

/** Ein Spieler einer Tracker-Session. Die `id` bleibt über Umsortieren stabil. */
export interface TrackerPlayer {
  id: string
  name: string
}

/** Ansage und gemachte Stiche eines Spielers in einer Runde (null = noch offen). */
export interface RoundEntry {
  bid: number | null
  tricks: number | null
}

/** Eine Runde mit fester Kartenzahl; Einträge sind über die Spieler-ID adressiert. */
export interface TrackerRound {
  /** Kartenzahl dieser Runde (aus dem festen Spielplan). */
  cards: number
  /** playerId → { bid, tricks } */
  entries: Record<string, RoundEntry>
}

/** Konfigurierbare Punktevergabe des Trackers (Standard +11 / −5). */
export interface TrackerScoring {
  hitScore: number
  missPenalty: number
}

/** Eine gespeicherte Tracker-Session (eine reale Partie). */
export interface TrackerSession {
  id: string
  name: string
  createdAt: number
  updatedAt: number
  /** Reihenfolge = Sitzordnung; lässt sich nachträglich ändern. */
  players: TrackerPlayer[]
  scoring: TrackerScoring
  /** Kartenzahl je Runde (fest beim Anlegen aus der Spielerzahl bestimmt). */
  schedule: number[]
  /** Genau `schedule.length` Runden; offene Einträge sind null. */
  rounds: TrackerRound[]
}
