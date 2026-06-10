import { cardId, createDeck, type Card } from '../game/cards'
import { shuffleInPlace, type Rng } from '../game/rng'
import type { PlayerView } from './types'

/**
 * Erzeugt eine mit der Spielersicht konsistente Verteilung der verdeckten Karten
 * (zu Rundenbeginn, vor dem Ausspielen). Berücksichtigt korrekt:
 *  - bereits sichtbare/gespielte Karten werden ausgeschlossen,
 *  - in der 1-Karten-Runde sind Gegnerkarten bekannt, die eigene wird gezogen,
 *  - überzählige Karten bleiben im unverteilten Stock (tauchen nie auf).
 */
export function sampleHands(view: PlayerView, rng: Rng): Card[][] {
  const seen = new Set<string>()
  for (const c of view.playedCards) seen.add(cardId(c))
  if (view.ownHand) for (const c of view.ownHand) seen.add(cardId(c))
  for (const id of Object.keys(view.visibleOpponentCards)) {
    seen.add(cardId(view.visibleOpponentCards[Number(id)]))
  }

  const pool = shuffleInPlace(
    createDeck().filter((c) => !seen.has(cardId(c))),
    rng,
  )
  let p = 0

  const hands: Card[][] = Array.from({ length: view.numPlayers }, () => [])
  for (let id = 0; id < view.numPlayers; id++) {
    if (id === view.playerId) {
      hands[id] = view.ownHand ? view.ownHand.slice() : [pool[p++]]
    } else if (view.visibleOpponentCards[id]) {
      hands[id] = [view.visibleOpponentCards[id]]
    } else {
      const size = view.handSizes[id]
      hands[id] = pool.slice(p, p + size)
      p += size
    }
  }
  return hands
}
