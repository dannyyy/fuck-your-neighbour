import { motion } from 'framer-motion'
import type { PlayerState } from '../../game/types'
import { T } from '../../i18n/de'
import { PlayingCard } from './Card'

interface Props {
  player: PlayerState
  isActive: boolean
  isThinking: boolean
  isDealer: boolean
  isOneCardRound: boolean
  phase: string
}

export function OpponentSeat({ player, isActive, isThinking, isDealer, isOneCardRound, phase }: Props) {
  const initial = player.name.charAt(0).toUpperCase()
  return (
    <motion.div
      layout
      className={`relative flex w-[5.2rem] shrink-0 flex-col items-center rounded-2xl px-2 py-2 transition ${
        isActive ? 'bg-gold-400/15 ring-1 ring-gold-400/60' : 'bg-felt-950/30'
      }`}
    >
      {isDealer && (
        <span className="absolute -top-1 -right-1 grid size-5 place-items-center rounded-full bg-gold-400 text-[10px] font-700 text-felt-950">
          G
        </span>
      )}
      <div
        className={`grid size-9 place-items-center rounded-full font-display text-lg ${
          isActive ? 'bg-gold-400 text-felt-950' : 'bg-felt-700 text-gold-200'
        }`}
      >
        {initial}
      </div>
      <div className="mt-1 max-w-full truncate text-xs font-500 text-gold-200">{player.name}</div>

      <div className="mt-0.5 flex items-center gap-1 text-[10px]">
        <Badge label={T.bid} value={player.bid === null ? '–' : player.bid} />
        <Badge label={T.tricks} value={player.tricksWon} highlight />
      </div>

      <div className="mt-1.5 grid h-10 place-items-center">
        {isThinking ? (
          <ThinkingDots />
        ) : isOneCardRound && player.hand.length > 0 ? (
          <PlayingCard card={player.hand[0]} width={34} />
        ) : (
          <FaceDownStack count={player.hand.length} />
        )}
      </div>

      {isActive && !isThinking && (
        <div className="text-[9px] uppercase tracking-wide text-gold-300/80">
          {phase === 'bidding' ? T.bidding : T.trick}
        </div>
      )}
    </motion.div>
  )
}

function Badge({ label, value, highlight }: { label: string; value: string | number; highlight?: boolean }) {
  return (
    <span
      className={`rounded px-1 py-0.5 ${
        highlight ? 'bg-gold-400/20 text-gold-200' : 'bg-felt-950/40 text-gold-200/60'
      }`}
    >
      {label[0]}:{value}
    </span>
  )
}

function FaceDownStack({ count }: { count: number }) {
  if (count <= 0) return <div className="h-10" />
  return (
    <div className="relative h-10 w-9">
      {Array.from({ length: Math.min(count, 4) }).map((_, i) => (
        <div
          key={i}
          style={{ left: i * 3, top: i * -1 }}
          className="absolute h-10 w-7 rounded bg-gradient-to-br from-felt-700 to-felt-900 ring-1 ring-gold-400/30"
        />
      ))}
      {count > 1 && (
        <span className="absolute -bottom-1 -right-1 rounded-full bg-felt-950 px-1 text-[9px] text-gold-200/80">
          {count}
        </span>
      )}
    </div>
  )
}

function ThinkingDots() {
  return (
    <div className="flex gap-1">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="size-1.5 rounded-full bg-gold-300"
          animate={{ opacity: [0.2, 1, 0.2] }}
          transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
        />
      ))}
    </div>
  )
}
