import { create } from 'zustand'
import {
  copySession,
  createSession,
  renamePlayer as renamePlayerOp,
  reorderPlayers as reorderPlayersOp,
  setDealer as setDealerOp,
  setEntry as setEntryOp,
} from '../tracker/session'
import type { TrackerScoring, TrackerSession } from '../tracker/types'

const STORAGE_KEY = 'fyn.tracker.v1'

interface PersistedTracker {
  sessions: TrackerSession[]
}

function loadSessions(): TrackerSession[] {
  if (typeof localStorage === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as Partial<PersistedTracker>
    return Array.isArray(parsed.sessions) ? parsed.sessions.map(migrate) : []
  } catch {
    return []
  }
}

/** Füllt Felder auf, die ältere gespeicherte Sessions noch nicht hatten. */
function migrate(session: TrackerSession): TrackerSession {
  const n = session.players.length || 1
  const rounds = session.rounds.map((round, i) =>
    round.dealerId ? round : { ...round, dealerId: session.players[i % n]?.id ?? '' },
  )
  return { ...session, rounds }
}

function saveSessions(sessions: TrackerSession[]): void {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ sessions } satisfies PersistedTracker))
  } catch {
    // Speicher nicht verfügbar (z. B. privater Modus) – nur Laufzeit.
  }
}

interface TrackerStoreState {
  sessions: TrackerSession[]
  /** Aktuell geöffnete Session (null = Übersicht). */
  activeId: string | null

  newSession(opts: { name: string; playerNames: string[]; scoring?: TrackerScoring }): void
  copyFrom(sessionId: string): void
  deleteSession(sessionId: string): void
  open(sessionId: string): void
  close(): void
  setEntry(roundIndex: number, playerId: string, field: 'bid' | 'tricks', value: number | null): void
  setDealer(roundIndex: number, dealerId: string): void
  reorderPlayers(orderedIds: string[]): void
  renamePlayer(playerId: string, name: string): void
}

/** Schreibt die Sessions in den Store und persistiert sie. */
function persist(sessions: TrackerSession[]) {
  saveSessions(sessions)
  return { sessions }
}

/** Wendet eine Operation auf die aktive Session an und persistiert das Ergebnis. */
function updateActive(
  state: TrackerStoreState,
  fn: (session: TrackerSession) => TrackerSession,
): Partial<TrackerStoreState> {
  if (!state.activeId) return {}
  const sessions = state.sessions.map((s) => (s.id === state.activeId ? fn(s) : s))
  return persist(sessions)
}

export const useTrackerStore = create<TrackerStoreState>((set, get) => ({
  sessions: loadSessions(),
  activeId: null,

  newSession(opts) {
    const session = createSession(opts)
    set(persist([session, ...get().sessions]))
    set({ activeId: session.id })
  },

  copyFrom(sessionId) {
    const source = get().sessions.find((s) => s.id === sessionId)
    if (!source) return
    const copy = copySession(source)
    set(persist([copy, ...get().sessions]))
    set({ activeId: copy.id })
  },

  deleteSession(sessionId) {
    const sessions = get().sessions.filter((s) => s.id !== sessionId)
    set(persist(sessions))
    if (get().activeId === sessionId) set({ activeId: null })
  },

  open(sessionId) {
    set({ activeId: sessionId })
  },

  close() {
    set({ activeId: null })
  },

  setEntry(roundIndex, playerId, field, value) {
    set((state) => updateActive(state, (s) => setEntryOp(s, roundIndex, playerId, field, value)))
  },

  setDealer(roundIndex, dealerId) {
    set((state) => updateActive(state, (s) => setDealerOp(s, roundIndex, dealerId)))
  },

  reorderPlayers(orderedIds) {
    set((state) => updateActive(state, (s) => reorderPlayersOp(s, orderedIds)))
  },

  renamePlayer(playerId, name) {
    set((state) => updateActive(state, (s) => renamePlayerOp(s, playerId, name)))
  },
}))
