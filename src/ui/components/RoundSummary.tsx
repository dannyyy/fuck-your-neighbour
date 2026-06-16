import { motion } from 'framer-motion'
import { useState } from 'react'
import { T } from '../../i18n/de'
import { useStore } from '../../state/store'
import { TrickReview } from './TrickReview'

/** Gemeinsames Spaltenraster für Kopfzeile und Datenzeilen → Zahlen bleiben bündig. */
const COLS = 'grid grid-cols-[minmax(0,1fr)_2.25rem_2.75rem_3.25rem_3.5rem]'

export function RoundSummary() {
  const game = useStore((s) => s.game)!
  const continueRound = useStore((s) => s.continueRound)
  const canContinue = useStore((s) => s.canContinue)
  const [showReview, setShowReview] = useState(false)
  const last = game.history[game.history.length - 1]
  if (!last) return null

  return (
    <Overlay>
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="glass w-full max-w-sm rounded-3xl p-5"
      >
        <h2 className="mb-1 text-center font-display text-2xl text-gold-300">{T.roundResult}</h2>
        <p className="mb-4 text-center text-xs text-gold-200/60">
          {T.round} {last.round + 1} · {last.cardCount} {T.cards}
        </p>

        <div className="space-y-1.5">
          <div className={`${COLS} gap-2 px-2 text-[10px] uppercase tracking-wide text-gold-200/50`}>
            <span />
            <span className="text-right">{T.bid}</span>
            <span className="text-right">{T.made}</span>
            <span className="text-right">{T.points}</span>
            <span className="text-right">{T.total}</span>
          </div>
          {game.players.map((p, i) => {
            const delta = last.deltas[i]
            return (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.05 * i }}
                className={`${COLS} items-center gap-2 rounded-xl px-2 py-2 ${
                  p.isHuman ? 'bg-gold-400/15' : 'bg-felt-950/30'
                }`}
              >
                <span className="truncate text-sm text-gold-200">{p.name}</span>
                <span className="text-right text-sm tabular-nums text-gold-200/70">
                  {last.bids[i] ?? '–'}
                </span>
                <span className="text-right text-sm tabular-nums text-gold-200/70">
                  {last.tricks[i]}
                </span>
                <span
                  className={`text-right font-display text-base tabular-nums ${
                    delta >= 0 ? 'text-emerald-300' : 'text-rose-300'
                  }`}
                >
                  {delta > 0 ? `+${delta}` : delta}
                </span>
                <span className="text-right text-sm tabular-nums text-gold-200">
                  {last.totals[i]}
                </span>
              </motion.div>
            )
          })}
        </div>

        <div className="mt-5 flex gap-2">
          <button
            onClick={() => setShowReview(true)}
            disabled={game.completedTricks.length === 0}
            className="glass flex-1 rounded-2xl py-3 font-display text-base text-gold-200 disabled:opacity-40 active:scale-[0.98]"
          >
            {T.reviewTricks}
          </button>
          {canContinue ? (
            <button
              onClick={continueRound}
              className="flex-1 rounded-2xl bg-gold-400 py-3 font-display text-lg text-felt-950 shadow-lg active:scale-[0.98]"
            >
              {T.continue}
            </button>
          ) : (
            <div className="flex-1 rounded-2xl bg-felt-950/40 py-3 text-center font-display text-base text-gold-200/70">
              {T.waitingForHost}
            </div>
          )}
        </div>
      </motion.div>

      {showReview && <TrickReview onClose={() => setShowReview(false)} />}
    </Overlay>
  )
}

export function Overlay({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="absolute inset-0 z-40 grid place-items-center bg-felt-950/70 p-4 backdrop-blur-sm"
    >
      {children}
    </motion.div>
  )
}
