import type { Difficulty } from '../game/types'
import { makeStrategy } from './strategy'
import type { Ai } from './types'

export function createAi(difficulty: Difficulty): Ai {
  return makeStrategy(difficulty)
}

export { buildView, redactState, HIDDEN_CARD, isHiddenCard } from './observation'
export type { Ai, PlayerView } from './types'
