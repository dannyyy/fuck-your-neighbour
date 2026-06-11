import type { GameState } from './types'

/**
 * Erlaubte Ansagen für `playerId` in der aktuellen Runde.
 *
 * Regeln:
 *  - Basis: 0 … Kartenzahl.
 *  - Letzter Bieter (= Geber): die Summe aller Ansagen darf NICHT der Kartenzahl
 *    entsprechen → der Wert `Kartenzahl − Σ(andere Ansagen)` ist verboten (Hook-Regel).
 *  - Niemand darf zweimal in Folge 0 ansagen (abschaltbar via `rules.doubleZeroRule`;
 *    gilt ausserdem nie in der 1-Karten-Runde).
 *  - Konflikt-Auflösung: Würden Hook-Regel + „kein 0-zweimal“ keinen Wert übriglassen,
 *    hat die Hook-Regel Vorrang und 0 wird wieder erlaubt.
 */
export function legalBids(state: GameState, playerId: number): number[] {
  const { cardCount } = state
  let candidates = Array.from({ length: cardCount + 1 }, (_, v) => v)

  if (isLastBidder(state, playerId)) {
    const sumOthers = state.players.reduce(
      (sum, p) => (p.id === playerId ? sum : sum + (p.bid ?? 0)),
      0,
    )
    const forbidden = cardCount - sumOthers
    if (forbidden >= 0 && forbidden <= cardCount) {
      candidates = candidates.filter((v) => v !== forbidden)
    }
  }

  // „Kein 0-zweimal“ – nur wenn aktiviert und nicht in der 1-Karten-Runde.
  const doubleZeroRule = state.config.rules?.doubleZeroRule ?? true
  if (doubleZeroRule && cardCount > 1 && state.players[playerId].lastRoundBid === 0) {
    const without0 = candidates.filter((v) => v !== 0)
    if (without0.length > 0) candidates = without0
    // sonst: Hook hat Vorrang → 0 bleibt erlaubt
  }

  return candidates
}

/** Der Geber sagt zuletzt an. */
export function isLastBidder(state: GameState, playerId: number): boolean {
  return playerId === state.dealer
}

export function isLegalBid(state: GameState, playerId: number, bid: number): boolean {
  return legalBids(state, playerId).includes(bid)
}
