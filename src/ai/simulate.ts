import type { Card } from '../game/cards'
import { seatOrderFrom } from '../game/seating'
import { erbenWinners, topContenders } from '../game/trick'
import type { ErbenResolution, PlayedCard } from '../game/types'
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
  resolution: ErbenResolution = 'lower',
): number[] {
  const tricks = new Array<number>(numPlayers).fill(0)
  const h = hands.map((x) => x.slice())
  let curLeader = leader
  let guard = 0

  while (h.some((x) => x.length > 0)) {
    let contenders = seatOrderFrom(curLeader, numPlayers).filter((id) => h[id].length > 0)
    const layers: PlayedCard[][] = []
    let winners = [curLeader]
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
        winners = [tied[0]]
        credit = layers.length
        break
      }
      if (!handsEmpty) {
        contenders = tied
        continue
      }
      winners = erbenWinners(layer, contenders, curLeader, numPlayers, resolution)
      credit = layers.length
      break
    }

    for (const w of winners) tricks[w] += credit
    // Nächster Anspieler: der Einzelsieger. Erben (mehrere/keine Gewinner) tritt nur
    // auf der letzten Karte auf, danach folgt kein weiterer Stich – Fallback genügt.
    curLeader = winners[0] ?? curLeader
    if (++guard > 10000) break
  }

  return tricks
}
