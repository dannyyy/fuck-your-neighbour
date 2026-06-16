import { sameCard } from '../game/cards'
import type { Card } from '../game/cards'
import { createGame, currentActor, legalPlays, nextRound, placeBid, playCard } from '../game/engine'
import { makeRng, randomSeed, type Rng } from '../game/rng'
import type { Difficulty, GameRules, GameState, TrickFlash } from '../game/types'
import { buildView, createAi, redactState, type Ai } from '../ai'
import {
  MAX_PLAYERS,
  MIN_PLAYERS,
  PROTOCOL_VERSION,
  type ErrorCode,
  type NetMessage,
  type PeerId,
  type RosterEntry,
  type SeatController,
} from './protocol'
import { NET_DELAYS, type NetDelays, type NetView, delay, flashFromTransition } from './session'
import type { HostTransport } from './transport'

const BOT_NAMES = ['Lena', 'Marco', 'Sven', 'Nadia', 'Reto', 'Tina']

export interface HostOptions {
  transport: HostTransport
  localName: string
  rules?: GameRules
  onLobby: (roster: RosterEntry[], canStart: boolean) => void
  onView: (view: NetView) => void
  delays?: NetDelays
  /** Fester Seed (Tests/Reproduzierbarkeit). */
  seed?: number
}

/**
 * Der **Host** führt die Engine als einzige Wahrheit aus. Sitze werden von der
 * lokalen Person, von verbundenen Peers oder von der KI gesteuert; KI-Sitze
 * ziehen automatisch (wie `runAi`), menschliche Sitze warten auf eine Absicht.
 * Nach jeder Änderung wird jedem Peer **nur seine** redigierte Sicht gesendet.
 */
export class HostSession {
  private readonly transport: HostTransport
  private readonly localName: string
  private readonly rules?: GameRules
  private readonly onLobby: (roster: RosterEntry[], canStart: boolean) => void
  private readonly onView: (view: NetView) => void
  private readonly delays: NetDelays
  private readonly seedOpt?: number

  private seats: SeatController[] = [{ kind: 'local' }]
  private game: GameState | null = null
  private started = false
  private rng: Rng | null = null
  private aiBySeat: Record<number, Ai> = {}
  private flash: TrickFlash | null = null
  private thinking: number | null = null
  private loopRunning = false

  constructor(opts: HostOptions) {
    this.transport = opts.transport
    this.localName = opts.localName
    this.rules = opts.rules
    this.onLobby = opts.onLobby
    this.onView = opts.onView
    this.delays = opts.delays ?? NET_DELAYS
    this.seedOpt = opts.seed

    this.transport.onPeerJoin(() => {
      /* erst nach 'hello' (Name bekannt) registrieren */
    })
    this.transport.onPeerLeave((id) => this.handleLeave(id))
    this.transport.onMessage((id, msg) => this.handleMessage(id, msg))
    this.emitLobby()
  }

  // --- Lobby --------------------------------------------------------------

  addAi(difficulty: Difficulty): void {
    if (this.started || this.seats.length >= MAX_PLAYERS) return
    this.seats.push({ kind: 'ai', difficulty })
    this.emitLobby()
  }

  removeSeat(seat: number): void {
    if (this.started) return
    const s = this.seats[seat]
    if (!s || s.kind === 'local') return
    if (s.kind === 'remote') this.transport.send(s.peerId, { t: 'error', code: 'closed' })
    this.seats.splice(seat, 1)
    this.emitLobby()
  }

  start(): void {
    if (this.started) return
    const n = this.seats.length
    if (n < MIN_PLAYERS || n > MAX_PLAYERS) return

    const names = this.seats.map((_, i) => this.seatName(i))
    const seed = this.seedOpt ?? randomSeed()
    const game = createGame({
      numPlayers: n,
      difficulty: 'mittel',
      playerNames: names,
      humanIndex: this.localSeat(),
      seed,
      rules: this.rules,
    })
    this.seats.forEach((s, i) => {
      game.players[i].isHuman = s.kind !== 'ai'
    })
    this.aiBySeat = {}
    this.seats.forEach((s, i) => {
      if (s.kind === 'ai') this.aiBySeat[i] = createAi(s.difficulty)
    })
    this.rng = makeRng(seed ^ 0x9e3779b9)
    this.game = game
    this.started = true

    this.seats.forEach((s, i) => {
      if (s.kind === 'remote' && s.connected) this.transport.send(s.peerId, { t: 'start', yourSeat: i })
    })
    this.publish()
    void this.runLoop()
  }

  /** Einen ausgefallenen (oder beliebigen) Remote-Sitz durch KI übernehmen lassen. */
  convertSeatToAi(seat: number, difficulty: Difficulty): void {
    if (!this.started || !this.game) return
    const s = this.seats[seat]
    if (!s || s.kind !== 'remote') return
    this.seats[seat] = { kind: 'ai', difficulty }
    this.game.players[seat].isHuman = false
    this.aiBySeat[seat] = createAi(difficulty)
    this.emitLobby()
    this.publish()
    void this.runLoop()
  }

  // --- Absichten (lokal + entfernt) --------------------------------------

  localBid(bid: number): void {
    void this.handleIntent(this.localSeat(), { t: 'bid', bid })
  }

  localPlay(card: Card): void {
    void this.handleIntent(this.localSeat(), { t: 'play', card })
  }

  continueRound(): void {
    const game = this.game
    if (!game || game.phase !== 'roundEnd') return
    this.game = nextRound(game)
    this.flash = null
    this.publish()
    void this.runLoop()
  }

  close(): void {
    this.transport.close()
  }

  // --- intern -------------------------------------------------------------

  private handleMessage(peerId: PeerId, msg: NetMessage): void {
    if (msg.t === 'hello') {
      this.handleHello(peerId, msg.name, msg.version)
    } else if (msg.t === 'bid' || msg.t === 'play') {
      const seat = this.seatOfPeer(peerId)
      if (seat !== null) void this.handleIntent(seat, msg)
    }
  }

  private handleHello(peerId: PeerId, name: string, version: number): void {
    if (version !== PROTOCOL_VERSION) {
      this.transport.send(peerId, { t: 'error', code: 'version' })
      return
    }
    let seat = this.seatOfPeer(peerId)
    if (seat === null) {
      if (this.started) {
        seat = this.seats.findIndex((s) => s.kind === 'remote' && !s.connected)
        if (seat < 0) {
          this.transport.send(peerId, { t: 'error', code: 'closed' })
          return
        }
        this.seats[seat] = { kind: 'remote', peerId, name, connected: true }
      } else {
        if (this.seats.length >= MAX_PLAYERS) {
          this.transport.send(peerId, { t: 'error', code: 'full' })
          return
        }
        seat = this.seats.length
        this.seats.push({ kind: 'remote', peerId, name, connected: true })
      }
    } else {
      const s = this.seats[seat]
      if (s.kind === 'remote') {
        s.name = name
        s.connected = true
      }
    }

    this.transport.send(peerId, { t: 'welcome', version: PROTOCOL_VERSION })
    if (this.started && this.game) {
      this.transport.send(peerId, { t: 'start', yourSeat: seat })
      this.transport.send(peerId, {
        t: 'state',
        state: redactState(this.game, seat),
        thinking: this.thinking,
      })
      this.emitLobby()
      void this.runLoop()
    } else {
      this.emitLobby()
    }
  }

  private handleLeave(peerId: PeerId): void {
    const seat = this.seatOfPeer(peerId)
    if (seat === null) return
    if (this.started) {
      const s = this.seats[seat]
      if (s.kind === 'remote') s.connected = false
    } else {
      this.seats.splice(seat, 1)
    }
    this.emitLobby()
  }

  private async handleIntent(
    seat: number,
    msg: { t: 'bid'; bid: number } | { t: 'play'; card: Card },
  ): Promise<void> {
    const game = this.game
    if (!game || !this.started || this.loopRunning) return
    const actor = currentActor(game)
    if (!actor || actor.playerId !== seat || actor.kind !== msg.t) {
      this.sendError(seat, 'not-your-turn')
      return
    }
    let next: GameState
    try {
      if (msg.t === 'bid') {
        next = placeBid(game, seat, msg.bid)
      } else {
        const legal = legalPlays(game, seat)
        // In der 1-Karten-Runde kennt der Client seine Karte nicht – dort gibt es
        // ohnehin nur einen legalen Zug, den wir hier auflösen.
        const chosen = legal.length === 1 ? legal[0] : legal.find((c) => sameCard(c, msg.card))
        if (!chosen) throw new Error('Karte nicht auf der Hand')
        next = playCard(game, seat, chosen)
      }
    } catch (e) {
      this.sendError(seat, 'illegal', String(e))
      return
    }
    await this.applyState(next, game)
    void this.runLoop()
  }

  private async runLoop(): Promise<void> {
    if (this.loopRunning) return
    this.loopRunning = true
    try {
      for (;;) {
        const game = this.game
        if (!game || game.phase === 'roundEnd' || game.phase === 'gameEnd') break
        const actor = currentActor(game)
        if (!actor) break
        const seat = actor.playerId
        if (this.seats[seat].kind !== 'ai') break // menschlicher Sitz → auf Absicht warten

        const ai = this.aiBySeat[seat]
        if (!ai || !this.rng) break
        this.thinking = seat
        this.publish()
        await delay(actor.kind === 'bid' ? this.delays.bid : this.delays.play)

        const current = this.game
        if (!current) break
        const view = buildView(current, seat)
        const next =
          actor.kind === 'bid'
            ? placeBid(current, seat, ai.decideBid(view, this.rng))
            : playCard(current, seat, ai.chooseCard(view, this.rng))
        this.thinking = null
        await this.applyState(next, current)
      }
    } finally {
      this.loopRunning = false
      this.thinking = null
      this.publish()
    }
  }

  private async applyState(next: GameState, prev: GameState): Promise<void> {
    this.game = next
    this.flash = flashFromTransition(prev, next)
    this.publish()
    if (this.flash) {
      const roundEnding = next.phase === 'roundEnd' || next.phase === 'gameEnd'
      await delay(roundEnding ? this.delays.roundEndFlash : this.delays.trickFlash)
      this.flash = null
      this.publish()
    }
  }

  private publish(): void {
    const game = this.game
    if (!game) return
    this.onView({ state: redactState(game, this.localSeat()), flash: this.flash, thinking: this.thinking })
    this.seats.forEach((s, i) => {
      if (s.kind === 'remote' && s.connected) {
        this.transport.send(s.peerId, {
          t: 'state',
          state: redactState(game, i),
          thinking: this.thinking,
        })
      }
    })
  }

  private emitLobby(): void {
    const roster: RosterEntry[] = this.seats.map((s, i) => ({
      seat: i,
      name: this.seatName(i),
      kind: s.kind,
      difficulty: s.kind === 'ai' ? s.difficulty : undefined,
      connected: s.kind === 'remote' ? s.connected : true,
    }))
    const canStart =
      !this.started && this.seats.length >= MIN_PLAYERS && this.seats.length <= MAX_PLAYERS
    this.onLobby(roster, canStart)
    this.seats.forEach((s, i) => {
      if (s.kind === 'remote' && s.connected) {
        this.transport.send(s.peerId, { t: 'lobby', roster, yourSeat: i, canStart: false })
      }
    })
  }

  private sendError(seat: number, code: ErrorCode, detail?: string): void {
    const s = this.seats[seat]
    if (s && s.kind === 'remote') this.transport.send(s.peerId, { t: 'error', code, detail })
  }

  private localSeat(): number {
    return this.seats.findIndex((s) => s.kind === 'local')
  }

  private seatOfPeer(peerId: PeerId): number | null {
    const i = this.seats.findIndex((s) => s.kind === 'remote' && s.peerId === peerId)
    return i < 0 ? null : i
  }

  private seatName(seat: number): string {
    const s = this.seats[seat]
    if (s.kind === 'local') return this.localName
    if (s.kind === 'remote') return s.name
    let botIndex = 0
    for (let i = 0; i < seat; i++) if (this.seats[i].kind === 'ai') botIndex++
    return BOT_NAMES[botIndex % BOT_NAMES.length]
  }
}
