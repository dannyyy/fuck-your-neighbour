import { roundScore } from '../game/scoring'
import { cardSchedule } from './schedule'
import type { RoundEntry, TrackerPlayer, TrackerRound, TrackerScoring, TrackerSession } from './types'

/** Standard-Punktevergabe des Trackers: Treffer +11, Strafe −5 pro Stich daneben. */
export const DEFAULT_TRACKER_SCORING: TrackerScoring = { hitScore: 11, missPenalty: 5 }

/** Eindeutige ID (UUID, mit Fallback für ältere Umgebungen). */
export function makeId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

function emptyRound(cards: number, players: TrackerPlayer[], dealerId: string): TrackerRound {
  const entries: Record<string, RoundEntry> = {}
  for (const p of players) entries[p.id] = { bid: null, tricks: null }
  return { cards, dealerId, entries }
}

/** Legt eine neue Session mit leeren Runden gemäß festem Spielplan an. */
export function createSession(opts: {
  name: string
  playerNames: string[]
  scoring?: TrackerScoring
}): TrackerSession {
  const players: TrackerPlayer[] = opts.playerNames.map((name) => ({ id: makeId(), name }))
  const schedule = cardSchedule(players.length)
  const now = Date.now()
  return {
    id: makeId(),
    name: opts.name,
    createdAt: now,
    updatedAt: now,
    players,
    scoring: opts.scoring ? { ...opts.scoring } : { ...DEFAULT_TRACKER_SCORING },
    schedule,
    // Der Geber rotiert je Runde reihum (Runde 1 → erster Spieler).
    rounds: schedule.map((cards, i) => emptyRound(cards, players, players[i % players.length].id)),
  }
}

/**
 * Kopiert die Konfiguration (Namen, Punkte) einer Session in eine frische
 * Session – ohne die gespielten Runden.
 */
export function copySession(source: TrackerSession, name?: string): TrackerSession {
  return createSession({
    name: name ?? `${source.name} (Kopie)`,
    playerNames: source.players.map((p) => p.name),
    scoring: source.scoring,
  })
}

/** Punkte eines Spielers in einer Runde – null, solange Ansage/Stiche fehlen. */
export function roundPoints(
  round: TrackerRound,
  playerId: string,
  scoring: TrackerScoring,
): number | null {
  const entry = round.entries[playerId]
  if (!entry || entry.bid === null || entry.tricks === null) return null
  return roundScore(entry.bid, entry.tricks, scoring.hitScore, scoring.missPenalty)
}

/** Gesamtpunkte eines Spielers über alle abgeschlossenen Runden-Einträge. */
export function playerTotal(session: TrackerSession, playerId: string): number {
  let total = 0
  for (const round of session.rounds) {
    const pts = roundPoints(round, playerId, session.scoring)
    if (pts !== null) total += pts
  }
  return total
}

/** Aktuelle Rangliste (höchste Punktzahl zuerst); Reihenfolge stabil bei Gleichstand. */
export function standings(session: TrackerSession): { player: TrackerPlayer; total: number }[] {
  return session.players
    .map((player) => ({ player, total: playerTotal(session, player.id) }))
    .sort((a, b) => b.total - a.total)
}

/** Summe der (gesetzten) Ansagen einer Runde. */
export function bidSum(round: TrackerRound): number {
  return Object.values(round.entries).reduce((s, e) => s + (e.bid ?? 0), 0)
}

/** Summe der (gesetzten) Stiche einer Runde. */
export function trickSum(round: TrackerRound): number {
  return Object.values(round.entries).reduce((s, e) => s + (e.tricks ?? 0), 0)
}

const entries = (round: TrackerRound) => Object.values(round.entries)

/** Alle Ansagen der Runde gesetzt? */
export function allBidsSet(round: TrackerRound): boolean {
  return entries(round).every((e) => e.bid !== null)
}

/** Alle Stiche der Runde gesetzt? */
export function allTricksSet(round: TrackerRound): boolean {
  return entries(round).every((e) => e.tricks !== null)
}

/** Runde vollständig erfasst (Ansagen und Stiche)? */
export function roundComplete(round: TrackerRound): boolean {
  return allBidsSet(round) && allTricksSet(round)
}

/** Index der ersten noch nicht vollständig erfassten Runde (oder -1, wenn fertig). */
export function activeRoundIndex(session: TrackerSession): number {
  return session.rounds.findIndex((r) => !roundComplete(r))
}

/**
 * Sanfte Hinweise (blockieren nie):
 *   bidConflict  – alle Ansagen gesetzt und ihre Summe = Kartenzahl
 *                  (der Geber als Letzter dürfte das laut Hook-Regel nicht).
 *   trickMismatch – alle Stiche gesetzt, ihre Summe ≠ Kartenzahl
 *                  (die Stiche einer Runde müssen die Kartenzahl ergeben).
 */
export interface RoundWarnings {
  bidConflict: boolean
  trickMismatch: boolean
}

export function roundWarnings(round: TrackerRound): RoundWarnings {
  return {
    bidConflict: allBidsSet(round) && bidSum(round) === round.cards,
    trickMismatch: allTricksSet(round) && trickSum(round) !== round.cards,
  }
}

/** Setzt einen Eintragswert unveränderlich und gibt eine neue Session zurück. */
export function setEntry(
  session: TrackerSession,
  roundIndex: number,
  playerId: string,
  field: 'bid' | 'tricks',
  value: number | null,
): TrackerSession {
  const rounds = session.rounds.map((round, i) => {
    if (i !== roundIndex) return round
    return {
      ...round,
      entries: {
        ...round.entries,
        [playerId]: { ...round.entries[playerId], [field]: value },
      },
    }
  })
  return { ...session, rounds, updatedAt: Date.now() }
}

/**
 * Setzt den Geber einer Runde und rotiert ihn von dort an reihum weiter (gemäß
 * aktueller Sitzordnung). Frühere Runden bleiben unverändert.
 */
export function setDealer(
  session: TrackerSession,
  roundIndex: number,
  dealerId: string,
): TrackerSession {
  const start = session.players.findIndex((p) => p.id === dealerId)
  if (start < 0) return session
  const n = session.players.length
  const rounds = session.rounds.map((round, i) => {
    if (i < roundIndex) return round
    const pos = (start + (i - roundIndex)) % n
    return { ...round, dealerId: session.players[pos].id }
  })
  return { ...session, rounds, updatedAt: Date.now() }
}

/** Ändert die Spielerreihenfolge (Sitzordnung); Punkte bleiben erhalten. */
export function reorderPlayers(session: TrackerSession, orderedIds: string[]): TrackerSession {
  const byId = new Map(session.players.map((p) => [p.id, p]))
  const players = orderedIds.map((id) => byId.get(id)).filter((p): p is TrackerPlayer => Boolean(p))
  if (players.length !== session.players.length) return session
  return { ...session, players, updatedAt: Date.now() }
}

/** Benennt einen Spieler um. */
export function renamePlayer(session: TrackerSession, playerId: string, name: string): TrackerSession {
  const players = session.players.map((p) => (p.id === playerId ? { ...p, name } : p))
  return { ...session, players, updatedAt: Date.now() }
}
