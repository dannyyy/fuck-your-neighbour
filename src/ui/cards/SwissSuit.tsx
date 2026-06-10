import type { Suit } from '../../game/cards'

export const SUIT_COLOR: Record<Suit, string> = {
  schellen: 'var(--color-suit-schellen)',
  rosen: 'var(--color-suit-rosen)',
  schilten: 'var(--color-suit-schilten)',
  eichel: 'var(--color-suit-eichel)',
}

interface Props {
  suit: Suit
  size?: number
  className?: string
  title?: string
}

/** Stilisierte Deutschschweizer Jass-Symbole als SVG. */
export function SwissSuit({ suit, size = 24, className, title }: Props) {
  const color = SUIT_COLOR[suit]
  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      className={className}
      role="img"
      aria-label={title ?? suit}
    >

      {suit === 'schellen' && (
        <g fill={color}>
          {/* Schelle (Glocke) */}
          <path d="M50 14c-3.5 0-6 2.5-6 6 0 .8.2 1.6.5 2.3C32 26 25 37 25 52v9l-6 9c-1 1.5 0 4 2 4h58c2 0 3-2.5 2-4l-6-9v-9c0-15-7-26-19.5-29.7.3-.7.5-1.5.5-2.3 0-3.5-2.5-6-6-6z" />
          <circle cx="50" cy="82" r="6.5" />
        </g>
      )}
      {suit === 'schilten' && (
        <path
          fill={color}
          d="M22 18h56a4 4 0 0 1 4 4v28c0 20-15 33-34 42-19-9-34-22-34-42V22a4 4 0 0 1 4-4z"
        />
      )}
      {suit === 'rosen' && (
        <g fill={color}>
          {[0, 60, 120, 180, 240, 300].map((deg) => (
            <ellipse
              key={deg}
              cx="50"
              cy="28"
              rx="13"
              ry="20"
              transform={`rotate(${deg} 50 50)`}
            />
          ))}
          <circle cx="50" cy="50" r="13" fill="var(--color-gold-300)" />
        </g>
      )}
      {suit === 'eichel' && (
        <g fill={color}>
          {/* Nuss */}
          <path d="M30 46c0-3 20-5 40 0 0 22-9 38-20 44-11-6-20-22-20-44z" />
          {/* Hut */}
          <path d="M26 40c0-11 11-18 24-18s24 7 24 18c0 4-4 6-9 6H35c-5 0-9-2-9-6z" fill="var(--color-gold-600)" />
          <rect x="46" y="12" width="8" height="12" rx="3" fill="var(--color-gold-600)" />
        </g>
      )}
    </svg>
  )
}
