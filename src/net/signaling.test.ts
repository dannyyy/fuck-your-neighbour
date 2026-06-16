import { describe, expect, it } from 'vitest'
import { buildSdp, packSdp } from './signaling'

// Repräsentatives DataChannel-Offer (gekürzt), wie es Chrome erzeugt.
const SAMPLE_SDP = [
  'v=0',
  'o=- 4611731400430051336 2 IN IP4 127.0.0.1',
  's=-',
  't=0 0',
  'a=group:BUNDLE 0',
  'a=extmap-allow-mixed',
  'a=msid-semantic: WMS',
  'm=application 9 UDP/DTLS/SCTP webrtc-datachannel',
  'c=IN IP4 0.0.0.0',
  'a=ice-ufrag:k7Zq',
  'a=ice-pwd:abcdefghijklmnopqrstuvwx',
  'a=ice-options:trickle',
  'a=fingerprint:sha-256 AA:BB:CC:DD:EE:FF:00:11:22:33:44:55:66:77:88:99',
  'a=setup:actpass',
  'a=mid:0',
  'a=sctp-port:5000',
  'a=max-message-size:262144',
  'a=candidate:1 1 udp 2122260223 192.168.1.5 54321 typ host generation 0 network-cost 999',
  'a=candidate:2 1 udp 2122194687 abcd1234-5678.local 54322 typ host',
  'a=candidate:3 1 udp 2122129151 fe80::1c2d:3e4f:5a6b:7c8d 54323 typ host',
].join('\r\n')

const OFFER: RTCSessionDescriptionInit = { type: 'offer', sdp: SAMPLE_SDP }

describe('packSdp / buildSdp', () => {
  it('bewahrt die für die Verbindung essenziellen Felder', () => {
    const pk = packSdp(OFFER)
    expect(pk.t).toBe('o')
    expect(pk.u).toBe('k7Zq')
    expect(pk.p).toBe('abcdefghijklmnopqrstuvwx')
    expect(pk.f).toContain('sha-256')
    expect(pk.s).toBe('actpass')
  })

  it('verwirft IPv6-Kandidaten, behält IPv4 und .local (gekürzt)', () => {
    const pk = packSdp(OFFER)
    expect(pk.c).toHaveLength(2)
    expect(pk.c.some((c) => c.includes('192.168.1.5'))).toBe(true)
    expect(pk.c.some((c) => c.includes('abcd1234-5678.local'))).toBe(true)
    expect(pk.c.some((c) => c.includes('fe80::'))).toBe(false)
    // auf 8 Kernfelder gekürzt – Ballast wie "generation 0 network-cost" entfällt
    expect(pk.c[0].split(' ')).toHaveLength(8)
  })

  it('baut ein gültig aussehendes DataChannel-SDP wieder auf', () => {
    const rebuilt = buildSdp(packSdp(OFFER))
    expect(rebuilt.type).toBe('offer')
    const sdp = rebuilt.sdp ?? ''
    expect(sdp).toContain('m=application 9 UDP/DTLS/SCTP webrtc-datachannel')
    expect(sdp).toContain('a=ice-ufrag:k7Zq')
    expect(sdp).toContain('a=ice-pwd:abcdefghijklmnopqrstuvwx')
    expect(sdp).toContain('a=fingerprint:sha-256 AA:BB:CC:DD:EE:FF:00:11:22:33:44:55:66:77:88:99')
    expect(sdp).toContain('a=setup:actpass')
    expect(sdp).toContain('a=candidate:1 1 udp 2122260223 192.168.1.5 54321 typ host')
    expect(sdp.endsWith('\r\n')).toBe(true)
  })

  it('das gepackte Payload ist deutlich kleiner als das volle SDP', () => {
    const packed = JSON.stringify(packSdp(OFFER))
    expect(packed.length).toBeLessThan(SAMPLE_SDP.length)
  })

  it('überträgt die Answer-Rolle korrekt', () => {
    const pk = packSdp({ type: 'answer', sdp: SAMPLE_SDP.replace('actpass', 'active') })
    expect(pk.t).toBe('a')
    expect(buildSdp(pk).type).toBe('answer')
  })
})
