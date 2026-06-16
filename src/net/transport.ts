import type { NetMessage, PeerId } from './protocol'

/**
 * Transport-Abstraktion. Über diesem Interface kennt niemand die konkrete
 * Technik (WebRTC, Loopback, später nativ Bluetooth/Nearby). Die Paarung
 * (Signalisierung) ist technikspezifisch und passiert *vor* dem Messaging –
 * ein Transport wird also mit bereits verbundenen Kanälen geliefert.
 */
export interface HostTransport {
  onPeerJoin(cb: (peerId: PeerId) => void): void
  onPeerLeave(cb: (peerId: PeerId) => void): void
  onMessage(cb: (peerId: PeerId, msg: NetMessage) => void): void
  send(peerId: PeerId, msg: NetMessage): void
  broadcast(msg: NetMessage): void
  close(): void
}

export interface ClientTransport {
  onOpen(cb: () => void): void
  onMessage(cb: (msg: NetMessage) => void): void
  onDisconnect(cb: () => void): void
  send(msg: NetMessage): void
  close(): void
}
