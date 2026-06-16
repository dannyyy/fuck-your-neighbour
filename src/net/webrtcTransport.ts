import { decode, encode, type NetMessage, type PeerId } from './protocol'
import { decodeSignal, encodeSignal } from './signaling'
import type { ClientTransport, HostTransport } from './transport'

/** Rein lokal (WLAN/Hotspot) – kein STUN/TURN, kein Internet nötig. */
const RTC_CONFIG: RTCConfiguration = { iceServers: [] }

/** Wartet, bis ICE vollständig gesammelt ist (non-trickle), max. 3 s. */
function waitIceComplete(pc: RTCPeerConnection): Promise<void> {
  if (pc.iceGatheringState === 'complete') return Promise.resolve()
  return new Promise((resolve) => {
    const done = () => {
      if (pc.iceGatheringState === 'complete') {
        pc.removeEventListener('icegatheringstatechange', done)
        resolve()
      }
    }
    pc.addEventListener('icegatheringstatechange', done)
    setTimeout(resolve, 3000)
  })
}

const DEAD_STATES = ['failed', 'disconnected', 'closed']

/**
 * Host-Transport über WebRTC-DataChannels. Die Paarung läuft über QR:
 * `createInvite()` liefert ein Angebot (QR), `acceptAnswer()` nimmt die Antwort
 * des Beitretenden entgegen. Pro Peer eine `RTCPeerConnection` + `RTCDataChannel`.
 */
export class WebRtcHostTransport implements HostTransport {
  private peers = new Map<PeerId, { pc: RTCPeerConnection; dc: RTCDataChannel }>()
  private pending: { peerId: PeerId; pc: RTCPeerConnection; dc: RTCDataChannel } | null = null
  private seq = 0
  private cbJoin: ((id: PeerId) => void) | null = null
  private cbLeave: ((id: PeerId) => void) | null = null
  private cbMsg: ((id: PeerId, msg: NetMessage) => void) | null = null

  onPeerJoin(cb: (id: PeerId) => void): void {
    this.cbJoin = cb
  }
  onPeerLeave(cb: (id: PeerId) => void): void {
    this.cbLeave = cb
  }
  onMessage(cb: (id: PeerId, msg: NetMessage) => void): void {
    this.cbMsg = cb
  }

  async createInvite(): Promise<string> {
    const peerId = `p${++this.seq}`
    const pc = new RTCPeerConnection(RTC_CONFIG)
    const dc = pc.createDataChannel('game', { ordered: true })
    this.wire(peerId, pc, dc)
    await pc.setLocalDescription(await pc.createOffer())
    await waitIceComplete(pc)
    this.pending = { peerId, pc, dc }
    return encodeSignal(pc.localDescription as RTCSessionDescription)
  }

  async acceptAnswer(code: string): Promise<void> {
    const pend = this.pending
    if (!pend) throw new Error('Kein offener Einladungs-Vorgang')
    await pend.pc.setRemoteDescription(await decodeSignal(code))
    this.peers.set(pend.peerId, { pc: pend.pc, dc: pend.dc })
    this.pending = null
  }

  private wire(peerId: PeerId, pc: RTCPeerConnection, dc: RTCDataChannel): void {
    dc.onopen = () => this.cbJoin?.(peerId)
    dc.onmessage = (e) => {
      try {
        this.cbMsg?.(peerId, decode(e.data as string))
      } catch {
        /* fehlerhafte Nachricht ignorieren */
      }
    }
    dc.onclose = () => this.drop(peerId)
    pc.onconnectionstatechange = () => {
      if (DEAD_STATES.includes(pc.connectionState)) this.drop(peerId)
    }
  }

  private drop(peerId: PeerId): void {
    const p = this.peers.get(peerId)
    if (!p) return
    this.peers.delete(peerId)
    this.cbLeave?.(peerId)
  }

  send(peerId: PeerId, msg: NetMessage): void {
    const p = this.peers.get(peerId)
    if (p && p.dc.readyState === 'open') p.dc.send(encode(msg))
  }

  broadcast(msg: NetMessage): void {
    const data = encode(msg)
    for (const p of this.peers.values()) if (p.dc.readyState === 'open') p.dc.send(data)
  }

  close(): void {
    for (const p of this.peers.values()) {
      p.dc.close()
      p.pc.close()
    }
    this.peers.clear()
    this.pending?.pc.close()
    this.pending = null
  }
}

/**
 * Client-Transport über WebRTC. `acceptInvite()` nimmt das Angebot (QR) des
 * Hosts entgegen und liefert die Antwort (QR), die der Host scannt.
 */
export class WebRtcClientTransport implements ClientTransport {
  private pc: RTCPeerConnection
  private dc: RTCDataChannel | null = null
  private cbOpen: (() => void) | null = null
  private cbMsg: ((msg: NetMessage) => void) | null = null
  private cbDisc: (() => void) | null = null

  constructor() {
    this.pc = new RTCPeerConnection(RTC_CONFIG)
    this.pc.ondatachannel = (e) => this.wire(e.channel)
    this.pc.onconnectionstatechange = () => {
      if (DEAD_STATES.includes(this.pc.connectionState)) this.cbDisc?.()
    }
  }

  async acceptInvite(offerCode: string): Promise<string> {
    await this.pc.setRemoteDescription(await decodeSignal(offerCode))
    await this.pc.setLocalDescription(await this.pc.createAnswer())
    await waitIceComplete(this.pc)
    return encodeSignal(this.pc.localDescription as RTCSessionDescription)
  }

  private wire(dc: RTCDataChannel): void {
    this.dc = dc
    dc.onopen = () => this.cbOpen?.()
    dc.onmessage = (e) => {
      try {
        this.cbMsg?.(decode(e.data as string))
      } catch {
        /* fehlerhafte Nachricht ignorieren */
      }
    }
    dc.onclose = () => this.cbDisc?.()
  }

  onOpen(cb: () => void): void {
    this.cbOpen = cb
    if (this.dc?.readyState === 'open') cb()
  }
  onMessage(cb: (msg: NetMessage) => void): void {
    this.cbMsg = cb
  }
  onDisconnect(cb: () => void): void {
    this.cbDisc = cb
  }

  send(msg: NetMessage): void {
    if (this.dc?.readyState === 'open') this.dc.send(encode(msg))
  }

  close(): void {
    this.dc?.close()
    this.pc.close()
  }
}
