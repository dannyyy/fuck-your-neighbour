import type { NetMessage, PeerId } from './protocol'
import type { ClientTransport, HostTransport } from './transport'

/**
 * In-Memory-Transport: Host und Clients laufen im selben Prozess. Dient Tests
 * (kein WebRTC nötig) und der Zwei-Tab-Entwicklung. Nachrichten werden über
 * `queueMicrotask` zugestellt, um die Asynchronität echter Kanäle nachzubilden.
 */
interface PeerLink {
  onMsg: ((msg: NetMessage) => void) | null
  onOpen: (() => void) | null
  onDisc: (() => void) | null
}

export interface Loopback {
  host: HostTransport
  /** Erzeugt einen neuen Client und meldet ihn beim Host an. */
  connect(): ClientTransport
}

export function createLoopback(): Loopback {
  let seq = 0
  const peers = new Map<PeerId, PeerLink>()

  let hostOnJoin: ((peerId: PeerId) => void) | null = null
  let hostOnLeave: ((peerId: PeerId) => void) | null = null
  let hostOnMsg: ((peerId: PeerId, msg: NetMessage) => void) | null = null

  const host: HostTransport = {
    onPeerJoin: (cb) => (hostOnJoin = cb),
    onPeerLeave: (cb) => (hostOnLeave = cb),
    onMessage: (cb) => (hostOnMsg = cb),
    send: (peerId, msg) => {
      const link = peers.get(peerId)
      if (link) queueMicrotask(() => link.onMsg?.(msg))
    },
    broadcast: (msg) => {
      for (const link of peers.values()) queueMicrotask(() => link.onMsg?.(msg))
    },
    close: () => {
      for (const link of peers.values()) link.onDisc?.()
      peers.clear()
    },
  }

  function connect(): ClientTransport {
    const peerId = `peer-${++seq}`
    const link: PeerLink = { onMsg: null, onOpen: null, onDisc: null }
    peers.set(peerId, link)
    queueMicrotask(() => {
      link.onOpen?.()
      hostOnJoin?.(peerId)
    })

    return {
      onOpen: (cb) => (link.onOpen = cb),
      onMessage: (cb) => (link.onMsg = cb),
      onDisconnect: (cb) => (link.onDisc = cb),
      send: (msg) => {
        if (!peers.has(peerId)) return
        queueMicrotask(() => hostOnMsg?.(peerId, msg))
      },
      close: () => {
        if (!peers.delete(peerId)) return
        queueMicrotask(() => hostOnLeave?.(peerId))
      },
    }
  }

  return { host, connect }
}
