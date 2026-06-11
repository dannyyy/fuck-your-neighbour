import { describe, expect, it } from 'vitest'
import type { Card, Rank, Suit } from './cards'
import { erbenWinner, erbenWinners, topContenders } from './trick'
import type { PlayedCard } from './types'

const c = (rank: Rank): Card => ({ suit: 'schellen', rank })
const play = (playerId: number, rank: Rank): PlayedCard => ({ playerId, card: c(rank) })
const playS = (playerId: number, rank: Rank, suit: Suit): PlayedCard => ({
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
})

describe('erbenWinners (Regelvarianten)', () => {
  // Doppelter Gleichstand: zwei 9er an der Spitze, zwei 7er darunter.
  const doubleTie = [play(0, '9'), play(1, '7'), play(2, '7'), play(3, '9')]

  it('lower: erbt nach unten und fällt bei vollem Gleichstand auf den Sitz zurück', () => {
    // 9er vererben → 7er gleichauf → nächster zum Anspieler (0) unter {1,2} = 1
    expect(erbenWinners(doubleTie, [0, 1, 2, 3], 0, 4, 'lower')).toEqual([1])
  })

  it('split: alle Spitzenspieler (die 9er) machen den Stich', () => {
    expect(erbenWinners(doubleTie, [0, 1, 2, 3], 0, 4, 'split').sort()).toEqual([0, 3])
  })

  it('none: niemand macht den Stich', () => {
    expect(erbenWinners(doubleTie, [0, 1, 2, 3], 0, 4, 'none')).toEqual([])
  })

  it('suit: höchste Farbe unter den Spitzenkarten gewinnt (Schellen > Rosen)', () => {
    const layer = [playS(0, '9', 'rosen'), play(1, '7'), play(2, '7'), playS(3, '9', 'schellen')]
    expect(erbenWinners(layer, [0, 1, 2, 3], 0, 4, 'suit')).toEqual([3])
  })

  it('suit-Reihenfolge: Rosen < Schilten < Eichel < Schellen', () => {
    const layer = [
      playS(0, '9', 'schilten'),
      playS(1, '9', 'eichel'),
      playS(2, '9', 'rosen'),
    ]
    // Eichel ist die höchste der drei Farben
    expect(erbenWinners(layer, [0, 1, 2], 0, 3, 'suit')).toEqual([1])
  })
})
