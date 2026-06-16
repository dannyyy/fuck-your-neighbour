import type { GameState, TrickFlash } from '../game/types'

/** Eine an einen Spieler gerichtete, bereits redigierte Sicht plus UI-Hinweise. */
export interface NetView {
  state: GameState
  flash: TrickFlash | null
  thinking: number | null
}

/** Verzögerungen wie im Solo-Store – für Tests auf 0 setzbar. */
export interface NetDelays {
  bid: number
  play: number
  trickFlash: number
  roundEndFlash: number
}

export const NET_DELAYS: NetDelays = {
  bid: 720,
  play: 580,
  trickFlash: 1300,
  roundEndFlash: 2200,
}

export const NO_DELAYS: NetDelays = { bid: 0, play: 0, trickFlash: 0, roundEndFlash: 0 }

export const delay = (ms: number): Promise<void> =>
  ms <= 0 ? Promise.resolve() : new Promise((resolve) => setTimeout(resolve, ms))

/**
 * Leitet den Stich-Flash aus einem Zustandsübergang ab (identisch zum Solo-Store):
 * wächst die Zahl der abgeschlossenen Stiche, wird der letzte kurz eingeblendet.
 */
export function flashFromTransition(prev: GameState | null, next: GameState): TrickFlash | null {
  const prevLen = prev?.completedTricks.length ?? 0
  if (next.completedTricks.length <= prevLen) return null
  const last = next.completedTricks[next.completedTricks.length - 1]
  const lastLayer = last.layers[last.layers.length - 1]
  return { winnerId: last.winner, cards: lastLayer, resolvedBy: last.resolvedBy }
}
