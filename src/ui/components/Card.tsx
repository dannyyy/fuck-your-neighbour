import type { Card as CardType } from '../../game/cards'
import { RANK_LABEL } from '../../i18n/de'
import { SUIT_COLOR, SwissSuit } from '../cards/SwissSuit'

interface CardProps {
  card?: CardType
  faceDown?: boolean
  width?: number
  highlight?: 'none' | 'playable' | 'winner' | 'dim'
  onClick?: () => void
  className?: string
}

const ASPECT = 1.4 // Höhe / Breite

export function PlayingCard({
  card,
  faceDown = false,
  width = 72,
  highlight = 'none',
  onClick,
  className = '',
}: CardProps) {
  const height = Math.round(width * ASPECT)
  const interactive = !!onClick

  const ring =
    highlight === 'winner'
      ? 'ring-2 ring-gold-400 shadow-[0_0_24px_rgba(233,196,106,0.55)]'
      : highlight === 'playable'
        ? 'ring-2 ring-gold-300/70'
        : ''
  const dim = highlight === 'dim' ? 'opacity-45 saturate-50' : ''

  if (faceDown || !card) {
    return (
      <div
        onClick={onClick}
        style={{ width, height }}
        className={`relative shrink-0 overflow-hidden rounded-[10%] ${ring} ${dim} ${className}`}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-felt-700 to-felt-900" />
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              'repeating-linear-gradient(45deg, var(--color-gold-500) 0 1px, transparent 1px 9px), repeating-linear-gradient(-45deg, var(--color-gold-500) 0 1px, transparent 1px 9px)',
          }}
        />
        <div className="absolute inset-[8%] rounded-[8%] border border-gold-400/40" />
        <div className="absolute inset-0 grid place-items-center">
          <div className="size-[34%] rotate-45 rounded-[18%] border border-gold-400/60 bg-felt-800/60" />
        </div>
      </div>
    )
  }

  const color = SUIT_COLOR[card.suit]
  const label = RANK_LABEL[card.rank]

  return (
    <div
      onClick={onClick}
      role={interactive ? 'button' : undefined}
      style={{ width, height }}
      className={`relative shrink-0 select-none rounded-[10%] bg-card text-ink-900 shadow-lg shadow-black/40 ${ring} ${dim} ${
        interactive ? 'cursor-pointer' : ''
      } ${className}`}
    >
      <div className="absolute inset-0 rounded-[10%] border border-card-edge" />
      {/* Ecke oben links */}
      <div className="absolute left-[7%] top-[5%] flex flex-col items-center leading-none" style={{ color }}>
        <span className="font-display font-700" style={{ fontSize: width * 0.26 }}>
          {label}
        </span>
        <SwissSuit suit={card.suit} size={width * 0.2} className="mt-[2px]" title={card.suit} />
      </div>
      {/* Zentrales Symbol */}
      <div className="absolute inset-0 grid place-items-center">
        <SwissSuit suit={card.suit} size={width * 0.5} className="opacity-95" title={card.suit} />
      </div>
      {/* Ecke unten rechts (gedreht) */}
      <div
        className="absolute bottom-[5%] right-[7%] flex rotate-180 flex-col items-center leading-none"
        style={{ color }}
      >
        <span className="font-display font-700" style={{ fontSize: width * 0.26 }}>
          {label}
        </span>
        <SwissSuit suit={card.suit} size={width * 0.2} className="mt-[2px]" title={card.suit} />
      </div>
    </div>
  )
}
