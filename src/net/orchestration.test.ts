import { describe, expect, it } from 'vitest'
import { legalBids } from '../game/bidding'
import { currentActor, legalPlays } from '../game/engine'
import type { GameState } from '../game/types'
import { isHiddenCard } from '../ai/observation'
import { ClientSession } from './clientSession'
import { HostSession } from './hostSession'
import { createLoopback } from './loopbackTransport'
import { MAX_PLAYERS, type ErrorCode, type RosterEntry } from './protocol'
import { NO_DELAYS, type NetView } from './session'

const flush = () => new Promise<void>((r) => setTimeout(r, 0))

/** Liefert eine Karte für `seat` aus einer (evtl. redigierten) Sicht. */
function pickPlay(state: GameState, seat: number) {
  const legal = legalPlays(state, seat)
  return legal[0]
}

describe('Host/Client-Orchestrierung (Loopback)', () => {
  it('spielt eine ganze Partie Host ↔ Client ↔ KI ohne Informationsleck', async () => {
    const loop = createLoopback()
    const views: { host: NetView | null; client: NetView | null } = { host: null, client: null }
    const seats: { client: number | null } = { client: null }

    const host = new HostSession({
      transport: loop.host,
      localName: 'Host',
      delays: NO_DELAYS,
      seed: 42,
      onLobby: () => {},
      onView: (v) => (views.host = v),
    })

    const client = new ClientSession({
      transport: loop.connect(),
      name: 'Gast',
      delays: NO_DELAYS,
      onLobby: () => {},
      onStart: (seat) => (seats.client = seat),
      onView: (v) => (views.client = v),
      onError: () => {},
      onClosed: () => {},
    })

    await flush()
    host.addAi('leicht') // 3 Sitze: Host(0), Gast(1), KI(2)
    host.start()
    await flush()

    expect(seats.client).toBe(1)

    // Partie zu Ende spielen, indem wir je nach Zug Host- oder Client-Absichten senden.
    for (let step = 0; step < 5000; step++) {
      await flush()
      const hv = views.host
      if (!hv) continue
      const state = hv.state

      // Leck-Check: der Client darf fremde Hände nie im Klartext sehen.
      const cv = views.client
      if (cv && !cv.state.isOneCardRound) {
        for (const p of cv.state.players) {
          if (p.id !== seats.client) expect(p.hand.every(isHiddenCard)).toBe(true)
        }
      }

      if (state.phase === 'gameEnd') break
      if (state.phase === 'roundEnd') {
        host.continueRound()
        continue
      }
      const actor = currentActor(state)
      if (!actor) continue

      if (actor.playerId === 0) {
        if (actor.kind === 'bid') host.localBid(legalBids(state, 0)[0])
        else host.localPlay(pickPlay(state, 0))
      } else if (actor.playerId === seats.client && cv) {
        if (actor.kind === 'bid') client.bid(legalBids(cv.state, seats.client)[0])
        else client.play(pickPlay(cv.state, seats.client))
      }
      // KI-Sitze zieht der Host selbst.
    }

    expect(views.host?.state.phase).toBe('gameEnd')
    // Vollständige Historie: 11 Runden gespielt.
    expect(views.host?.state.history.length).toBe(11)
  })

  it('weist Absichten vom falschen Sitz / ausserhalb der Reihe ab', async () => {
    const loop = createLoopback()
    let hostView: NetView | null = null
    let clientSeat: number | null = null
    const errors: ErrorCode[] = []

    const host = new HostSession({
      transport: loop.host,
      localName: 'Host',
      delays: NO_DELAYS,
      seed: 7,
      onLobby: () => {},
      onView: (v) => (hostView = v),
    })
    const client = new ClientSession({
      transport: loop.connect(),
      name: 'Gast',
      delays: NO_DELAYS,
      onLobby: () => {},
      onStart: (s) => (clientSeat = s),
      onView: () => {},
      onError: (c) => errors.push(c),
      onClosed: () => {},
    })

    await flush()
    host.addAi('leicht')
    host.start()
    await flush()

    const before = hostView!.state
    const actor = currentActor(before)!
    // Der Client sendet eine Aktion, obwohl er (mutmasslich) nicht dran ist
    // bzw. die falsche Art – das muss abgelehnt werden, ohne den Zustand zu ändern.
    if (actor.playerId === clientSeat) {
      // Falsche Art: spielt eine Karte in der Ansagephase.
      client.play({ suit: 'rosen', rank: 'ass' })
    } else {
      client.bid(0)
    }
    await flush()

    expect(errors.length).toBeGreaterThan(0)
    expect(errors[0]).toBe('not-your-turn')
  })

  it('lehnt einen 7. Spieler mit „full“ ab', async () => {
    const loop = createLoopback()
    const host = new HostSession({
      transport: loop.host,
      localName: 'Host',
      delays: NO_DELAYS,
      onLobby: () => {},
      onView: () => {},
    })
    // Host(0) + 5 KI = 6 Sitze (Maximum).
    for (let i = 0; i < MAX_PLAYERS - 1; i++) host.addAi('leicht')

    const errors: ErrorCode[] = []
    new ClientSession({
      transport: loop.connect(),
      name: 'ZuViel',
      delays: NO_DELAYS,
      onLobby: () => {},
      onStart: () => {},
      onView: () => {},
      onError: (c) => errors.push(c),
      onClosed: () => {},
    })
    await flush()
    expect(errors).toContain('full')
  })

  it('meldet die Lobby an Host und Client', async () => {
    const loop = createLoopback()
    let hostRoster: RosterEntry[] = []
    let canStartHost = false
    let clientRoster: RosterEntry[] = []

    const host = new HostSession({
      transport: loop.host,
      localName: 'Chef',
      delays: NO_DELAYS,
      onLobby: (r, can) => {
        hostRoster = r
        canStartHost = can
      },
      onView: () => {},
    })
    new ClientSession({
      transport: loop.connect(),
      name: 'Gast',
      delays: NO_DELAYS,
      onLobby: (r) => (clientRoster = r),
      onStart: () => {},
      onView: () => {},
      onError: () => {},
      onClosed: () => {},
    })
    await flush()
    host.addAi('schwer')
    await flush()

    expect(hostRoster.length).toBe(3)
    expect(hostRoster[0].name).toBe('Chef')
    expect(hostRoster[1].kind).toBe('remote')
    expect(hostRoster[2].kind).toBe('ai')
    expect(canStartHost).toBe(true)
    expect(clientRoster.length).toBe(3)
  })
})
