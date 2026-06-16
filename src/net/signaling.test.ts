import { describe, expect, it } from 'vitest'
import { compactSdp } from './signaling'

// Repräsentatives DataChannel-Offer (gekürzt), wie es Chrome erzeugt.
const SAMPLE = [
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
  'a=fingerprint:sha-256 AA:BB:CC:DD:EE:FF:00:11:22:33',
  'a=setup:actpass',
  'a=mid:0',
  'a=sctp-port:5000',
  'a=max-message-size:262144',
  'a=candidate:1 1 udp 2122260223 192.168.1.5 54321 typ host',
  'a=candidate:2 1 udp 2122194687 abcd1234-5678.local 54322 typ host',
  'a=candidate:3 1 udp 2122129151 fe80::1c2d:3e4f:5a6b:7c8d 54323 typ host',
].join('\r\n')

describe('compactSdp', () => {
  it('behält die für die Verbindung essenziellen Zeilen', () => {
    const out = compactSdp(SAMPLE)
    expect(out).toContain('a=ice-ufrag:k7Zq')
    expect(out).toContain('a=ice-pwd:abcdefghijklmnopqrstuvwx')
    expect(out).toContain('a=fingerprint:sha-256 AA:BB:CC:DD:EE:FF:00:11:22:33')
    expect(out).toContain('a=setup:actpass')
    expect(out).toContain('m=application 9 UDP/DTLS/SCTP webrtc-datachannel')
  })

  it('verwirft IPv6-Kandidaten, behält IPv4 und .local', () => {
    const out = compactSdp(SAMPLE)
    expect(out).toContain('192.168.1.5')
    expect(out).toContain('abcd1234-5678.local')
    expect(out).not.toContain('fe80::1c2d:3e4f:5a6b:7c8d')
  })

  it('entfernt überflüssige Zeilen und verkleinert das SDP', () => {
    const out = compactSdp(SAMPLE)
    expect(out).not.toContain('a=extmap-allow-mixed')
    expect(out).not.toContain('a=msid-semantic')
    expect(out.length).toBeLessThan(SAMPLE.length)
  })
})
