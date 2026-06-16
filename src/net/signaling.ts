/**
 * (De)Kodierung der WebRTC-Signalisierung für die QR-Paarung – ganz ohne Server.
 *
 * Statt das komplette SDP zu übertragen, extrahieren wir nur die *dynamischen*
 * Felder (ICE-ufrag/-pwd, DTLS-Fingerprint, setup-Rolle, ICE-Kandidaten) und
 * bauen auf der Gegenseite ein vollständiges, gültiges DataChannel-SDP aus einer
 * festen Vorlage wieder auf. Das schrumpft das Offer/Answer drastisch, sodass es
 * meist in einen *einzigen* QR-Code passt. Zusätzlich wird (falls verfügbar) per
 * `CompressionStream('gzip')` komprimiert und base64-kodiert.
 */

interface PackedSignal {
  /** 'o' = offer, 'a' = answer. */
  t: 'o' | 'a'
  /** ice-ufrag */
  u: string
  /** ice-pwd */
  p: string
  /** fingerprint (inkl. Algorithmus, z. B. "sha-256 AA:BB:…") */
  f: string
  /** setup-Rolle (actpass | active | passive) */
  s: string
  /** ICE-Kandidaten, auf die Kernfelder gekürzt (ohne "a=candidate:"-Präfix) */
  c: string[]
}

function bytesToBase64(bytes: Uint8Array): string {
  let bin = ''
  for (const b of bytes) bin += String.fromCharCode(b)
  return btoa(bin)
}

function base64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64)
  const out = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)
  return out
}

const hasCompression = typeof CompressionStream !== 'undefined'

async function gzip(input: string): Promise<Uint8Array> {
  const cs = new CompressionStream('gzip')
  const writer = cs.writable.getWriter()
  void writer.write(new TextEncoder().encode(input) as unknown as BufferSource)
  void writer.close()
  const ab = await new Response(cs.readable).arrayBuffer()
  return new Uint8Array(ab)
}

async function gunzip(bytes: Uint8Array): Promise<string> {
  const ds = new DecompressionStream('gzip')
  const writer = ds.writable.getWriter()
  void writer.write(bytes as unknown as BufferSource)
  void writer.close()
  const ab = await new Response(ds.readable).arrayBuffer()
  return new TextDecoder().decode(ab)
}

function firstValue(lines: string[], prefix: string): string {
  const line = lines.find((l) => l.startsWith(prefix))
  return line ? line.slice(prefix.length).trim() : ''
}

/** Ist die Verbindungsadresse eines Kandidaten (ohne "a=candidate:") IPv6? */
function isIpv6Candidate(cand: string): boolean {
  const addr = cand.split(' ')[4] ?? ''
  return addr.includes(':')
}

/**
 * Extrahiert die für die Verbindung nötigen Felder aus einem SDP. IPv6-Kandidaten
 * werden verworfen (im Hotspot/LAN trägt IPv4 bzw. der `.local`/mDNS-Kandidat),
 * jeder Kandidat auf die 8 Kernfelder gekürzt (foundation…typ host).
 */
export function packSdp(desc: RTCSessionDescriptionInit): PackedSignal {
  const lines = (desc.sdp ?? '').split(/\r?\n/)
  const c = lines
    .filter((l) => l.startsWith('a=candidate:'))
    .map((l) => l.slice('a=candidate:'.length))
    .filter((cand) => !isIpv6Candidate(cand))
    .map((cand) => cand.split(' ').slice(0, 8).join(' '))
  return {
    t: desc.type === 'offer' ? 'o' : 'a',
    u: firstValue(lines, 'a=ice-ufrag:'),
    p: firstValue(lines, 'a=ice-pwd:'),
    f: firstValue(lines, 'a=fingerprint:'),
    s: firstValue(lines, 'a=setup:') || 'actpass',
    c,
  }
}

/** Baut aus den gepackten Feldern wieder ein vollständiges DataChannel-SDP. */
export function buildSdp(pk: PackedSignal): RTCSessionDescriptionInit {
  const candidateLines = pk.c.map((c) => `a=candidate:${c}`)
  const sdp =
    [
      'v=0',
      'o=- 1 2 IN IP4 127.0.0.1',
      's=-',
      't=0 0',
      'a=group:BUNDLE 0',
      'm=application 9 UDP/DTLS/SCTP webrtc-datachannel',
      'c=IN IP4 0.0.0.0',
      `a=ice-ufrag:${pk.u}`,
      `a=ice-pwd:${pk.p}`,
      'a=ice-options:trickle',
      `a=fingerprint:${pk.f}`,
      `a=setup:${pk.s}`,
      'a=mid:0',
      'a=sctp-port:5000',
      'a=max-message-size:262144',
      ...candidateLines,
    ].join('\r\n') + '\r\n'
  return { type: pk.t === 'o' ? 'offer' : 'answer', sdp }
}

/** Kodiert eine Offer/Answer in einen kompakten String (Flag + Payload). */
export async function encodeSignal(desc: RTCSessionDescriptionInit): Promise<string> {
  const payload = JSON.stringify(packSdp(desc))
  if (hasCompression) {
    return 'g' + bytesToBase64(await gzip(payload))
  }
  return 'r' + bytesToBase64(new TextEncoder().encode(payload))
}

export async function decodeSignal(code: string): Promise<RTCSessionDescriptionInit> {
  const flag = code[0]
  const bytes = base64ToBytes(code.slice(1))
  const json = flag === 'g' ? await gunzip(bytes) : new TextDecoder().decode(bytes)
  return buildSdp(JSON.parse(json) as PackedSignal)
}
