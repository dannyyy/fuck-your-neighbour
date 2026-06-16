import type { Card } from '../game/cards'
import type { Difficulty, GameState } from '../game/types'

/**
 * Protokoll für das lokale Mehrspieler-Spiel. Ein Gerät ist **Host** (führt die
 * Engine als einzige Wahrheit aus), die übrigen sind dünne **Clients**, die nur
 * eine redigierte Sicht rendern und Spielzug-Absichten zurücksenden.
 *
 * Die Versionsnummer schützt vor Desync, wenn die PWA auf einem Gerät schon
 * aktualisiert wurde (`registerType: 'autoUpdate'`).
 */
export const PROTOCOL_VERSION = 1

export const MAX_PLAYERS = 6
export const MIN_PLAYERS = 3

export type PeerId = string

/** Wer einen Sitz steuert. Lebt im Host ausserhalb der reinen Engine. */
export type SeatController =
  | { kind: 'local' }
  | { kind: 'remote'; peerId: PeerId; name: string; connected: boolean }
  | { kind: 'ai'; difficulty: Difficulty }

/** Lobby-Eintrag, wie er an alle Clients gesendet wird. */
export interface RosterEntry {
  seat: number
  name: string
  kind: 'local' | 'remote' | 'ai'
  difficulty?: Difficulty
  connected: boolean
}

export type ErrorCode = 'not-your-turn' | 'illegal' | 'full' | 'version' | 'closed'

export type NetMessage =
  // Client → Host beim Verbinden.
  | { t: 'hello'; name: string; version: number }
  // Host → Client direkt nach Verbindung.
  | { t: 'welcome'; version: number }
  // Host → alle: aktueller Lobby-Stand.
  | { t: 'lobby'; roster: RosterEntry[]; yourSeat: number | null; canStart: boolean }
  // Host → Client: Spiel beginnt, hier ist dein Sitz.
  | { t: 'start'; yourSeat: number }
  // Host → Client: redigierter Spielzustand (nur die legale Sicht des Empfängers).
  | { t: 'state'; state: GameState; thinking: number | null }
  // Client → Host: Ansage bzw. Karte.
  | { t: 'bid'; bid: number }
  | { t: 'play'; card: Card }
  // Host → alle: Spiel/Verbindung beendet bzw. Fehler.
  | { t: 'error'; code: ErrorCode; detail?: string }

export function encode(msg: NetMessage): string {
  return JSON.stringify(msg)
}

export function decode(raw: string): NetMessage {
  return JSON.parse(raw) as NetMessage
}
