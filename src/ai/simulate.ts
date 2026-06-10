import type { Card } from '../game/cards'
import { seatOrderFrom } from '../game/seating'
import { erbenWinner, topContenders } from '../game/trick'
import type { PlayedCard } from '../game/types'
import { chooseTactical } from './policy'

/**
 * Schneller Rollout einer kompletten Runde (mutiert nur lokale Kopien, kein
 * structuredClone) – inklusive Stechen mit Mehrfach-Gutschrift und Erben.
 *
 * `targets[id]` = angestrebte Gesamtstichzahl des Spielers in dieser Runde
 * (z. B. seine Ansage; ein grosser Wert wie 99 erzwingt „greedy gewinnen“).
 *
 * @returns gemachte Stiche je Spieler (Summe = ausgeteilte Karten)
 */
export function simulateRoundTricks(
  hands: Card[][],
  leader: number,
  numPlayers: number,
  targets: number[],
): number[] {
  const tricks = new Array<number>(numPlayers).fill(0)
  const h = hands.map((x) => x.slice())
  let curLeader = leader
  let guard = 0

  while (h.some((x) => x.length > 0)) {
    let contenders = seatOrderFrom(curLeader, numPlayers).filter((id) => h[id].length > 0)
    const layers: PlayedCard[][] = []
    let winner = curLeader
    let credit = 1

    for (;;) {
      const layer: PlayedCard[] = []
      const order = seatOrderFrom(curLeader, numPlayers).filter((id) => h[id].length > 0)
      for (const id of order) {
        const isC = contenders.includes(id)
        const contenderCards = layer
          .filter((pc) => contenders.includes(pc.playerId))
          .map((pc) => pc.card)
        const remaining = targets[id] - tricks[id]
        const card = chooseTactical(h[id], contenderCards, isC, remaining)
        h[id].splice(h[id].indexOf(card), 1)
        layer.push({ playerId: id, card })
      }
      layers.push(layer)

      const tied = topContenders(layer, contenders)
      const handsEmpty = h.every((x) => x.length === 0)
      if (tied.length === 1) {
        winner = tied[0]
        credit = layers.length
        break
      }
      if (!handsEmpty) {
        contenders = tied
        continue
      }
      winner = erbenWinner(layer, contenders, curLeader, numPlayers)
      credit = layers.length
      break
    }

    tricks[winner] += credit
    curLeader = winner
    if (++guard > 10000) break
  }

  return tricks
}
