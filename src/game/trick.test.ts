import { describe, expect, it } from 'vitest'
import type { Card, Rank, Suit } from './cards'
import { erbenWinner, topContenders } from './trick'
import type { PlayedCard } from './types'

const c = (rank: Rank): Card => ({ suit: 'schellen', rank })
const play = (playerId: number, rank: Rank): PlayedCard => ({ playerId, card: c(rank) })
const playS = (playerId: number, suit: Suit, rank: Rank): PlayedCard => ({
  playerId,
  card: { suit, rank },
})

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

  it('Farbentscheid: unterste Lage gleich → höhere Farbe gewinnt', () => {
    // Beispiel aus dem Issue: A & D (Under) gleich → B & C (7) gleich →
    // Eichel schlägt Rosen → B gewinnt.
    const layer = [
      playS(0, 'rosen', 'under'),
      playS(1, 'eichel', '7'),
      playS(2, 'rosen', '7'),
      playS(3, 'schellen', 'under'),
    ]
    expect(erbenWinner(layer, [0, 1, 2, 3], 0, 4, 'suit')).toBe(1)
    // Mit Sitz-Tiebreak (Standard) und Anspieler 2 gewänne hingegen der nächste
    // Sitz im Gleichstand (Spieler 2 selbst) – der Farbentscheid weicht ab.
    expect(erbenWinner(layer, [0, 1, 2, 3], 2, 4, 'seat')).toBe(2)
  })

  it('Farbentscheid: Schellen ist die höchste Farbe', () => {
    const layer = [playS(0, 'rosen', 'ass'), playS(1, 'schellen', 'ass')]
    expect(erbenWinner(layer, [0, 1], 0, 2, 'suit')).toBe(1)
  })
})
