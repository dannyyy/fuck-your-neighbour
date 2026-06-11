import { cardId, createDeck, rankStrength } from '../game/cards'
import type { Rng } from '../game/rng'
import { roundScore } from '../game/scoring'
import type { Difficulty } from '../game/types'
import { chooseTactical } from './policy'
import { sampleHands } from './sampling'
import { simulateRoundTricks } from './simulate'
import type { Ai, PlayerView } from './types'

/** Monte-Carlo-Stichproben je Schwierigkeit (Genauigkeit vs. Rechenaufwand). */
const SAMPLES: Record<Difficulty, number> = { leicht: 24, mittel: 120, schwer: 400 }
/** Zufallsrauschen, das schwächere KIs „menschlich“ ungenau macht. */
const BID_NOISE: Record<Difficulty, number> = { leicht: 0.25, mittel: 0, schwer: 0 }
const PLAY_NOISE: Record<Difficulty, number> = { leicht: 0.3, mittel: 0, schwer: 0 }

const GREEDY = 99

/** Ziel-Stichzahlen je Spieler für den Rollout (zur Ansage-Schätzung). */
function buildTargets(view: PlayerView, difficulty: Difficulty): number[] {
  return view.bids.map((bid, id) => {
    if (id === view.playerId) return GREEDY
    // „schwer“ nutzt bereits bekannte Gegner-Ansagen, um deren Ducken vorherzusehen.
    if (difficulty === 'schwer' && bid !== null) return bid
    return GREEDY
  })
}

/** Stärkster Rang, den ein Gegner theoretisch noch halten könnte. */
function maxUnseenStrength(view: PlayerView): number {
  const seen = new Set<string>()
  for (const c of view.playedCards) seen.add(cardId(c))
  for (const c of view.legalPlays) seen.add(cardId(c))
  for (const id of Object.keys(view.visibleOpponentCards)) {
    seen.add(cardId(view.visibleOpponentCards[Number(id)]))
  }
  let max = -1
  for (const c of createDeck()) {
    if (!seen.has(cardId(c))) max = Math.max(max, rankStrength(c.rank))
  }
  return max
}

export function makeStrategy(difficulty: Difficulty): Ai {
  function decideBid(view: PlayerView, rng: Rng): number {
    const legal = view.legalBids
    if (legal.length <= 1) return legal[0] ?? 0

    const samples = SAMPLES[difficulty]
    const targets = buildTargets(view, difficulty)
    const counts: number[] = []
    for (let i = 0; i < samples; i++) {
      const hands = sampleHands(view, rng)
      const tricks = simulateRoundTricks(
        hands,
        view.leaderForRound,
        view.numPlayers,
        targets,
        view.erbenResolution,
      )
      counts.push(tricks[view.playerId])
    }

    // Ansage wählen, die den erwarteten Rundenpunktwert maximiert (+10 / −5).
    let best = legal[0]
    let bestScore = -Infinity
    for (const bid of legal) {
      let sum = 0
      for (const t of counts) sum += roundScore(bid, t)
      const mean = sum / counts.length
      if (mean > bestScore) {
        bestScore = mean
        best = bid
      }
    }

    if (BID_NOISE[difficulty] > 0 && rng.next() < BID_NOISE[difficulty]) {
      return legal[rng.int(legal.length)]
    }
    return best
  }

  function chooseCard(view: PlayerView, rng: Rng) {
    const plays = view.legalPlays
    if (plays.length === 1) return plays[0]
    if (PLAY_NOISE[difficulty] > 0 && rng.next() < PLAY_NOISE[difficulty]) {
      return plays[rng.int(plays.length)]
    }

    const target = (view.myBid ?? 0) - view.myTricksWon
    const contenderCards = view.currentLayerPlays
      .filter((pc) => view.contenders.includes(pc.playerId))
      .map((pc) => pc.card)
    const maxUnseen = difficulty === 'leicht' ? undefined : maxUnseenStrength(view)
    return chooseTactical(plays, contenderCards, view.amContender, target, maxUnseen)
  }

  return { decideBid, chooseCard }
}
