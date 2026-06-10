import { describe, expect, it } from 'vitest'
import { roundScore } from './scoring'

describe('roundScore (Treffer +10 pauschal, Fehler −5/Abweichung)', () => {
  it('3 angesagt, 3 gemacht → +10', () => {
    expect(roundScore(3, 3)).toBe(10)
  })

  it('0 angesagt, 0 gemacht → +10', () => {
    expect(roundScore(0, 0)).toBe(10)
  })

  it('2 angesagt, 0 gemacht → −10', () => {
    expect(roundScore(2, 0)).toBe(-10)
  })

  it('1 angesagt, 3 gemacht → −10', () => {
    expect(roundScore(1, 3)).toBe(-10)
  })

  it('6 angesagt, 6 gemacht → +10 (unabhängig von der Stichzahl)', () => {
    expect(roundScore(6, 6)).toBe(10)
    expect(roundScore(1, 1)).toBe(10)
  })
})
