import { AnimatePresence, motion } from 'framer-motion'
import type { Card } from '../../game/cards'
import { cardId, rankStrength } from '../../game/cards'
import { T } from '../../i18n/de'
import { PlayingCard } from './Card'

interface Props {
  cards: Card[]
  playable: boolean
  faceDown: boolean
  onPlay: (card: Card) => void
}

export function Hand({ cards, playable, faceDown, onPlay }: Props) {
  // Sortiert anzeigen (nach Stärke) für bessere Übersicht – nur visuell.
  const sorted = faceDown ? cards : [...cards].sort((a, b) => rankStrength(a.rank) - rankStrength(b.rank))
  const n = sorted.length
  const cardWidth = n > 6 ? 56 : 72
  const spread = Math.min(10, 26 / Math.max(n, 1)) // Rotationswinkel pro Karte

  if (faceDown) {
    // 1-Karten-Runde: eigene Karte verdeckt „an der Stirn“.
    return (
      <div className="flex flex-col items-center gap-2 py-4">
        <span className="text-xs uppercase tracking-wide text-gold-300/80">{T.yourForeheadCard}</span>
        <PlayingCard
          faceDown
          width={84}
          highlight={playable ? 'playable' : 'none'}
          onClick={playable ? () => onPlay(cards[0]) : undefined}
        />
        {playable && <span className="text-xs text-gold-200/60">{T.playForeheadCard} ↑</span>}
      </div>
    )
  }

  return (
    <div className="flex items-end justify-center px-2 py-3" style={{ minHeight: cardWidth * 1.4 + 24 }}>
      <div className="flex items-end">
        <AnimatePresence mode="popLayout">
          {sorted.map((card, i) => {
            const mid = (n - 1) / 2
            const rot = (i - mid) * spread
            const lift = Math.abs(i - mid) * 4
            return (
              <motion.div
                key={cardId(card)}
                layout
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: lift }}
                exit={{ opacity: 0, y: 60, scale: 0.7 }}
                transition={{ type: 'spring', stiffness: 300, damping: 24 }}
                whileHover={playable ? { y: -18, zIndex: 30 } : undefined}
                whileTap={playable ? { y: -10 } : undefined}
                style={{
                  rotate: rot,
                  marginLeft: i === 0 ? 0 : -cardWidth * 0.42,
                  transformOrigin: 'bottom center',
                }}
              >
                <PlayingCard
                  card={card}
                  width={cardWidth}
                  highlight={playable ? 'playable' : 'none'}
                  onClick={playable ? () => onPlay(card) : undefined}
                />
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>
    </div>
  )
}
