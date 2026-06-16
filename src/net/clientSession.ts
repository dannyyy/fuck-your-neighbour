import type { Card } from '../game/cards'
import type { GameState } from '../game/types'
import {
  PROTOCOL_VERSION,
  type ErrorCode,
  type NetMessage,
  type RosterEntry,
} from './protocol'
import { NET_DELAYS, type NetDelays, type NetView, flashFromTransition } from './session'
import type { ClientTransport } from './transport'

export interface ClientOptions {
  transport: ClientTransport
  name: string
  onLobby: (roster: RosterEntry[], mySeat: number | null) => void
  onStart: (mySeat: number) => void
  onView: (view: NetView) => void
  onError: (code: ErrorCode) => void
  onClosed: () => void
  delays?: NetDelays
}

/**
 * Der **Client** rendert nur eine redigierte Sicht und sendet Absichten an den
 * Host zurück. Er führt weder Engine noch KI aus und erhält keine verdeckten
 * Informationen. Den Stich-Flash leitet er lokal aus den Zustandsübergängen ab
 * (identisch zum Host/Solo), damit Animationen ohne Extra-Daten funktionieren.
 */
export class ClientSession {
  private readonly transport: ClientTransport
  private readonly opts: ClientOptions
  private readonly delays: NetDelays
  private prev: GameState | null = null
  private flashTimer: ReturnType<typeof setTimeout> | null = null

  constructor(opts: ClientOptions) {
    this.opts = opts
    this.transport = opts.transport
    this.delays = opts.delays ?? NET_DELAYS

    this.transport.onOpen(() =>
      this.transport.send({ t: 'hello', name: opts.name, version: PROTOCOL_VERSION }),
    )
    this.transport.onMessage((msg) => this.handleMessage(msg))
    this.transport.onDisconnect(() => opts.onClosed())
  }

  bid(bid: number): void {
    this.transport.send({ t: 'bid', bid })
  }

  play(card: Card): void {
    this.transport.send({ t: 'play', card })
  }

  close(): void {
    if (this.flashTimer) clearTimeout(this.flashTimer)
    this.transport.close()
  }

  private handleMessage(msg: NetMessage): void {
    switch (msg.t) {
      case 'welcome':
        break
      case 'lobby':
        this.opts.onLobby(msg.roster, msg.yourSeat)
        break
      case 'start':
        this.opts.onStart(msg.yourSeat)
        break
      case 'state':
        this.handleState(msg.state, msg.thinking)
        break
      case 'error':
        this.opts.onError(msg.code)
        break
    }
  }

  private handleState(state: GameState, thinking: number | null): void {
    const flash = flashFromTransition(this.prev, state)
    this.prev = state
    if (this.flashTimer) {
      clearTimeout(this.flashTimer)
      this.flashTimer = null
    }
    this.opts.onView({ state, flash, thinking })
    if (flash) {
      const roundEnding = state.phase === 'roundEnd' || state.phase === 'gameEnd'
      this.flashTimer = setTimeout(
        () => {
          this.flashTimer = null
          this.opts.onView({ state, flash: null, thinking })
        },
        roundEnding ? this.delays.roundEndFlash : this.delays.trickFlash,
      )
    }
  }
}
