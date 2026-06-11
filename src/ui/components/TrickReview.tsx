import { motion } from 'framer-motion'
import { T } from '../../i18n/de'
import { useStore } from '../../state/store'
import { PlayingCard } from './Card'
import { Overlay } from './RoundSummary'

/**
 * Rückblick auf alle Stiche der gerade beendeten Runde. Wird aus der
 * Rundenwertung geöffnet – während der Runde bleiben die Stiche verdeckt.
 */
export function TrickReview({ onClose }: { onClose: () => void }) {
  const game = useStore((s) => s.game)!
  const tricks = game.completedTricks

  return (
    <Overlay>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="glass flex max-h-[85vh] w-full max-w-sm flex-col overflow-hidden rounded-3xl"
      >
        <div className="flex items-center justify-between border-b border-gold-400/20 px-5 py-3">
          <h2 className="font-display text-xl text-gold-300">{T.trickReview}</h2>
          <button onClick={onClose} className="text-gold-200/70" aria-label={T.close}>
            ✕
          </button>
        </div>

        <div className="space-y-4 overflow-y-auto px-4 py-4">
          {tricks.map((trick, idx) => {
            const winnerNames = trick.winners.map((id) => game.players[id].name).join(' & ')
            return (
              <div key={idx} className="rounded-2xl bg-felt-950/30 p-3">
                <div className="mb-2 flex items-center justify-between text-[11px]">
                  <span className="uppercase tracking-wide text-gold-200/50">
                    {T.trickNo} {idx + 1}
                    {trick.resolvedBy === 'erben' && (
                      <span className="ml-1 text-gold-400/70">· {T.erben}</span>
                    )}
                  </span>
                  <span className="text-gold-300">
                    {trick.winners.length === 0 ? T.noTrickWinner : `${winnerNames} ${T.wonBy}`}
                    {trick.credit > 1 && trick.winners.length > 0 && (
                      <span className="ml-1 rounded-full bg-gold-400/20 px-1.5 text-gold-200">
                        ×{trick.credit}
                      </span>
                    )}
                  </span>
                </div>

                <div className="space-y-2">
                  {trick.layers.map((layer, li) => (
                    <div key={li} className="flex flex-wrap items-end gap-2">
                      {layer.map((pc) => {
                        const isWinner = trick.winners.includes(pc.playerId)
                        return (
                          <div
                            key={`${pc.playerId}-${pc.card.suit}-${pc.card.rank}`}
                            className="flex flex-col items-center gap-1"
                          >
                            <span
                              className={`max-w-[3rem] truncate rounded-full px-1.5 text-[9px] ${
                                isWinner ? 'bg-gold-400 font-600 text-felt-950' : 'text-gold-200/55'
                              }`}
                            >
                              {game.players[pc.playerId].name}
                            </span>
                            <PlayingCard
                              card={pc.card}
                              width={42}
                              highlight={isWinner ? 'winner' : 'none'}
                            />
                          </div>
                        )
                      })}
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </motion.div>
    </Overlay>
  )
}
