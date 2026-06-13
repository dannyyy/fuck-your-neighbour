import { describe, expect, it } from 'vitest'
import {
  activeRoundIndex,
  bidSum,
  copySession,
  createSession,
  playerTotal,
  reorderPlayers,
  roundComplete,
  roundPoints,
  roundWarnings,
  setDealer,
  setEntry,
  standings,
  trickSum,
} from './session'

const NAMES = ['Anna', 'Beat', 'Cilly']

function fresh() {
  return createSession({ name: 'Test', playerNames: NAMES })
}

describe('createSession', () => {
  it('legt Spieler mit stabilen IDs, festen Spielplan und leere Runden an', () => {
    const s = fresh()
    expect(s.players).toHaveLength(3)
    expect(s.schedule).toEqual([6, 5, 4, 3, 2, 1, 2, 3, 4, 5, 6])
    expect(s.rounds).toHaveLength(11)
    expect(s.rounds[0].cards).toBe(6)
    expect(s.scoring).toEqual({ hitScore: 11, missPenalty: 5 })
    // Jeder Spieler hat in jeder Runde einen offenen Eintrag.
    for (const p of s.players) expect(s.rounds[0].entries[p.id]).toEqual({ bid: null, tricks: null })
  })
})

describe('setEntry (unveränderlich)', () => {
  it('setzt einen Wert, ohne die alte Session zu verändern', () => {
    const s = fresh()
    const id = s.players[0].id
    const next = setEntry(s, 0, id, 'bid', 3)
    expect(next.rounds[0].entries[id].bid).toBe(3)
    expect(s.rounds[0].entries[id].bid).toBeNull()
    expect(next.updatedAt).toBeGreaterThanOrEqual(s.updatedAt)
  })
})

describe('Punkte (+11 / −5)', () => {
  it('roundPoints erst, wenn Ansage und Stiche gesetzt sind', () => {
    let s = fresh()
    const id = s.players[0].id
    expect(roundPoints(s.rounds[0], id, s.scoring)).toBeNull()
    s = setEntry(s, 0, id, 'bid', 2)
    expect(roundPoints(s.rounds[0], id, s.scoring)).toBeNull()
    s = setEntry(s, 0, id, 'tricks', 2)
    expect(roundPoints(s.rounds[0], id, s.scoring)).toBe(11) // Treffer
    s = setEntry(s, 0, id, 'tricks', 0)
    expect(roundPoints(s.rounds[0], id, s.scoring)).toBe(-10) // 2 daneben → −5×2
  })

  it('playerTotal summiert nur abgeschlossene Runden', () => {
    let s = fresh()
    const id = s.players[0].id
    s = setEntry(s, 0, id, 'bid', 2)
    s = setEntry(s, 0, id, 'tricks', 2) // +11
    s = setEntry(s, 1, id, 'bid', 1)
    s = setEntry(s, 1, id, 'tricks', 0) // −5
    s = setEntry(s, 2, id, 'bid', 3) // unvollständig → ignoriert
    expect(playerTotal(s, id)).toBe(6)
  })
})

describe('standings', () => {
  it('sortiert nach Punkten absteigend', () => {
    let s = fresh()
    const [a, b] = s.players
    s = setEntry(s, 0, a.id, 'bid', 2)
    s = setEntry(s, 0, a.id, 'tricks', 2) // a: +11
    s = setEntry(s, 0, b.id, 'bid', 2)
    s = setEntry(s, 0, b.id, 'tricks', 0) // b: −10
    const ranked = standings(s)
    expect(ranked[0].player.id).toBe(a.id)
    expect(ranked[0].total).toBe(11)
    expect(ranked[ranked.length - 1].player.id).toBe(b.id)
  })
})

describe('Vollständigkeit & aktive Runde', () => {
  it('roundComplete & activeRoundIndex', () => {
    let s = fresh()
    expect(activeRoundIndex(s)).toBe(0)
    for (const p of s.players) {
      s = setEntry(s, 0, p.id, 'bid', 1)
      s = setEntry(s, 0, p.id, 'tricks', 2)
    }
    expect(roundComplete(s.rounds[0])).toBe(true)
    expect(activeRoundIndex(s)).toBe(1)
  })
})

describe('sanfte Hinweise', () => {
  it('bidConflict, wenn alle Ansagen gesetzt und ihre Summe = Kartenzahl', () => {
    let s = fresh() // Runde 0 = 6 Karten
    const [a, b, c] = s.players
    s = setEntry(s, 0, a.id, 'bid', 2)
    s = setEntry(s, 0, b.id, 'bid', 2)
    expect(roundWarnings(s.rounds[0]).bidConflict).toBe(false) // noch nicht alle
    s = setEntry(s, 0, c.id, 'bid', 2) // Summe 6 = Karten
    expect(bidSum(s.rounds[0])).toBe(6)
    expect(roundWarnings(s.rounds[0]).bidConflict).toBe(true)
  })

  it('trickMismatch, wenn alle Stiche gesetzt und ihre Summe ≠ Kartenzahl', () => {
    let s = fresh()
    const [a, b, c] = s.players
    s = setEntry(s, 0, a.id, 'tricks', 1)
    s = setEntry(s, 0, b.id, 'tricks', 1)
    s = setEntry(s, 0, c.id, 'tricks', 1) // Summe 3 ≠ 6
    expect(trickSum(s.rounds[0])).toBe(3)
    expect(roundWarnings(s.rounds[0]).trickMismatch).toBe(true)
  })
})

describe('reorderPlayers', () => {
  it('ändert die Reihenfolge, behält Punkte (über IDs)', () => {
    let s = fresh()
    const [a, b, c] = s.players
    s = setEntry(s, 0, a.id, 'bid', 2)
    s = setEntry(s, 0, a.id, 'tricks', 2)
    const before = playerTotal(s, a.id)
    s = reorderPlayers(s, [c.id, a.id, b.id])
    expect(s.players.map((p) => p.id)).toEqual([c.id, a.id, b.id])
    expect(playerTotal(s, a.id)).toBe(before)
  })

  it('ignoriert ungültige Reihenfolgen', () => {
    const s = fresh()
    const same = reorderPlayers(s, [s.players[0].id])
    expect(same.players).toEqual(s.players)
  })
})

describe('Geber (rotierend)', () => {
  it('createSession verteilt den Geber reihum (Runde i → Spieler i mod n)', () => {
    const s = fresh() // 3 Spieler
    const ids = s.players.map((p) => p.id)
    expect(s.rounds.map((r) => r.dealerId)).toEqual(
      s.rounds.map((_, i) => ids[i % ids.length]),
    )
  })

  it('setDealer setzt die Runde und rotiert ab dort weiter, frühere bleiben', () => {
    const s = fresh()
    const [a, b, c] = s.players
    const before = s.rounds[0].dealerId
    const next = setDealer(s, 1, c.id)
    expect(next.rounds[0].dealerId).toBe(before) // Runde 0 unverändert
    expect(next.rounds[1].dealerId).toBe(c.id)
    expect(next.rounds[2].dealerId).toBe(a.id) // rotiert weiter
    expect(next.rounds[3].dealerId).toBe(b.id)
  })

  it('copySession erzeugt frische, rotierende Geber', () => {
    const copy = copySession(fresh())
    const ids = copy.players.map((p) => p.id)
    expect(copy.rounds[0].dealerId).toBe(ids[0])
    expect(copy.rounds[1].dealerId).toBe(ids[1])
  })
})

describe('copySession', () => {
  it('übernimmt Namen und Punkte, aber keine gespielten Runden', () => {
    let s = fresh()
    s = setEntry(s, 0, s.players[0].id, 'bid', 2)
    s = setEntry(s, 0, s.players[0].id, 'tricks', 2)
    const copy = copySession(s)
    expect(copy.players.map((p) => p.name)).toEqual(NAMES)
    expect(copy.scoring).toEqual(s.scoring)
    expect(copy.id).not.toBe(s.id)
    expect(copy.players[0].id).not.toBe(s.players[0].id) // frische IDs
    expect(copy.rounds.every((r) => Object.values(r.entries).every((e) => e.bid === null))).toBe(true)
    expect(copy.name).toContain('Kopie')
  })
})
