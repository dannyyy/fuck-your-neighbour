import { create } from 'zustand'
import type { Difficulty } from '../game/types'
import { ClientSession } from '../net/clientSession'
import { HostSession } from '../net/hostSession'
import type { ErrorCode, RosterEntry } from '../net/protocol'
import type { NetView } from '../net/session'
import { WebRtcClientTransport, WebRtcHostTransport } from '../net/webrtcTransport'
import { useStore } from './store'

/** Schritt der QR-Paarung (Host zeigt Angebot/scannt Antwort; Client umgekehrt). */
export type Pairing =
  | 'idle'
  | 'show-invite' // Host zeigt Angebots-QR
  | 'scan-answer' // Host scannt Antwort des Beitretenden
  | 'scan-invite' // Client scannt Angebot des Hosts
  | 'show-answer' // Client zeigt Antwort-QR (Host scannt sie)

export type NetPhase = 'idle' | 'host-lobby' | 'join' | 'game' | 'ended'

interface NetState {
  phase: NetPhase
  role: 'none' | 'host' | 'client'
  myName: string
  roster: RosterEntry[]
  canStart: boolean
  mySeat: number | null
  pairing: Pairing
  /** Aktuell als QR anzuzeigender Code (Host-Angebot oder Client-Antwort). */
  qrCode: string | null
  busy: boolean
  error: string | null

  // Host
  hostStart(name: string): void
  hostCreateInvite(): Promise<void>
  hostAcceptAnswer(code: string): Promise<void>
  hostAddAi(difficulty: Difficulty): void
  hostRemoveSeat(seat: number): void
  hostConvertToAi(seat: number, difficulty: Difficulty): void
  hostBeginGame(): void

  // Client
  clientStart(name: string): void
  clientAcceptInvite(code: string): Promise<void>

  // Beide
  setPairing(p: Pairing): void
  clearError(): void
  leave(): void
}

// Sitzungs-/Transport-Instanzen leben ausserhalb des Stores (nicht serialisierbar).
let hostSession: HostSession | null = null
let hostTransport: WebRtcHostTransport | null = null
let clientSession: ClientSession | null = null
let clientTransport: WebRtcClientTransport | null = null

function pushView(view: NetView): void {
  useStore.getState().pushNetView(view)
}

function tearDown(): void {
  hostSession?.close()
  clientSession?.close()
  hostSession = null
  hostTransport = null
  clientSession = null
  clientTransport = null
  useStore.getState().detachNet()
}

export const useNetStore = create<NetState>((set, get) => ({
  phase: 'idle',
  role: 'none',
  myName: '',
  roster: [],
  canStart: false,
  mySeat: null,
  pairing: 'idle',
  qrCode: null,
  busy: false,
  error: null,

  // --- Host ---------------------------------------------------------------

  hostStart(name) {
    tearDown()
    const localName = name.trim() || 'Host'
    hostTransport = new WebRtcHostTransport()
    hostSession = new HostSession({
      transport: hostTransport,
      localName,
      rules: useStore.getState().settings.rules,
      onLobby: (roster, canStart) => set({ roster, canStart }),
      onView: (view) => pushView(view),
    })
    set({
      phase: 'host-lobby',
      role: 'host',
      myName: localName,
      pairing: 'idle',
      qrCode: null,
      error: null,
      mySeat: 0,
    })
  },

  async hostCreateInvite() {
    if (!hostTransport) return
    set({ busy: true, error: null })
    try {
      const code = await hostTransport.createInvite()
      set({ qrCode: code, pairing: 'show-invite', busy: false })
    } catch (e) {
      set({ busy: false, error: String(e) })
    }
  },

  async hostAcceptAnswer(code) {
    if (!hostTransport) return
    set({ busy: true, error: null })
    try {
      await hostTransport.acceptAnswer(code)
      set({ busy: false, pairing: 'idle', qrCode: null })
    } catch (e) {
      set({ busy: false, error: String(e) })
    }
  },

  hostAddAi(difficulty) {
    hostSession?.addAi(difficulty)
  },

  hostRemoveSeat(seat) {
    hostSession?.removeSeat(seat)
  },

  hostConvertToAi(seat, difficulty) {
    hostSession?.convertSeatToAi(seat, difficulty)
  },

  hostBeginGame() {
    if (!hostSession) return
    useStore.getState().attachNet(
      {
        bid: (b) => hostSession?.localBid(b),
        play: (c) => hostSession?.localPlay(c),
        continue: () => hostSession?.continueRound(),
      },
      true,
    )
    hostSession.start()
    set({ phase: 'game', pairing: 'idle', qrCode: null })
  },

  // --- Client -------------------------------------------------------------

  clientStart(name) {
    tearDown()
    const myName = name.trim() || 'Gast'
    set({
      phase: 'join',
      role: 'client',
      myName,
      pairing: 'scan-invite',
      qrCode: null,
      error: null,
      mySeat: null,
    })
  },

  async clientAcceptInvite(code) {
    set({ busy: true, error: null })
    try {
      clientTransport = new WebRtcClientTransport()
      const answer = await clientTransport.acceptInvite(code)
      clientSession = new ClientSession({
        transport: clientTransport,
        name: get().myName,
        onLobby: (roster, mySeat) => set({ roster, mySeat }),
        onStart: (mySeat) => {
          useStore.getState().attachNet(
            {
              bid: (b) => clientSession?.bid(b),
              play: (c) => clientSession?.play(c),
              continue: () => {},
            },
            false,
          )
          set({ phase: 'game', mySeat, pairing: 'idle', qrCode: null })
        },
        onView: (view) => pushView(view),
        onError: (code: ErrorCode) => {
          if (code === 'full' || code === 'version' || code === 'closed') {
            set({ error: code })
          }
        },
        onClosed: () => set({ phase: 'ended', error: 'closed' }),
      })
      set({ busy: false, pairing: 'show-answer', qrCode: answer })
    } catch (e) {
      set({ busy: false, error: String(e) })
    }
  },

  // --- Beide --------------------------------------------------------------

  setPairing(p) {
    set({ pairing: p })
  },

  clearError() {
    set({ error: null })
  },

  leave() {
    tearDown()
    set({
      phase: 'idle',
      role: 'none',
      roster: [],
      canStart: false,
      mySeat: null,
      pairing: 'idle',
      qrCode: null,
      busy: false,
      error: null,
    })
  },
}))
