import { describe, expect, it } from 'vitest'
import type { Card, Rank } from './cards'
import { erbenWinner, topContenders } from './trick'
import type { PlayedCard } from './types'

const c = (rank: Rank): Card => ({ suit: 'schellen', rank })
const play = (playerId: number, rank: Rank): PlayedCard => ({ playerId, card: c(rank) })

describe('topContenders', () => {
  it('liefert den einzelnen höchsten Spieler', () => {
    const layer = [play(0, 'ass'), play(1, 'koenig'), play(2, '8')]
    expect(topContenders(layer, [0, 1, 2])).toEqual([0])
  })

  it('liefert bei Gleichstand alle Spitzenspieler', () => {
    const layer = [play(0, 'ass'), play(1, 'ass'), play(2, 'koenig')]
    expect(topContenders(layer, [0, 1, 2]).sort()).toEqual([0, 1])
  })

  it('berücksichtigt nur Wettkämpfer (Abwürfe zählen nicht)', () => {
    // Spieler 2 wirft eine höhere Karte ab, ist aber kein Wettkämpfer.
    const layer = [play(0, 'koenig'), play(1, '9'), play(2, 'ass')]
    expect(topContenders(layer, [0, 1])).toEqual([1]) // 9 schlägt König
  })

  it('die 9 schlägt den König', () => {
    const layer = [play(0, '9'), play(1, 'koenig')]
    expect(topContenders(layer, [0, 1])).toEqual([0])
  })
})

describe('erbenWinner (darunterliegende Karte gewinnt)', () => {
  it('zwei gleiche Spitzen → der nächsthöhere darunter gewinnt', () => {
    const layer = [play(0, 'ass'), play(1, 'ass'), play(2, 'koenig')]
    expect(erbenWinner(layer, [0, 1, 2], 0, 3)).toBe(2)
  })

  it('drei gleiche Spitzen → die darunterliegende Karte gewinnt', () => {
    const layer = [play(0, 'ass'), play(1, 'ass'), play(2, 'ass'), play(3, '9')]
    expect(erbenWinner(layer, [0, 1, 2, 3], 0, 4)).toBe(3)
  })

  it('alle Wettkämpfer gleichrangig → der dem Anspieler nächste gewinnt', () => {
    const layer = [play(0, 'ass'), play(1, 'ass')]
    // Anspieler = 1 → 1 ist näher als 0
    expect(erbenWinner(layer, [0, 1], 1, 3)).toBe(1)
  })
})
