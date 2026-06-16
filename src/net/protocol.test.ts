import { describe, expect, it } from 'vitest'
import { decode, encode, PROTOCOL_VERSION, type NetMessage } from './protocol'

describe('protocol', () => {
  it('kodiert und dekodiert Nachrichten verlustfrei', () => {
    const messages: NetMessage[] = [
      { t: 'hello', name: 'Anna', version: PROTOCOL_VERSION },
      { t: 'welcome', version: PROTOCOL_VERSION },
      { t: 'start', yourSeat: 2 },
      { t: 'bid', bid: 3 },
      { t: 'play', card: { suit: 'rosen', rank: 'ass' } },
      { t: 'error', code: 'not-your-turn' },
    ]
    for (const msg of messages) {
      expect(decode(encode(msg))).toEqual(msg)
    }
  })
})
