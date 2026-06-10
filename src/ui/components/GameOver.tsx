import { motion } from 'framer-motion'
import { rankings } from '../../game/engine'
import { T } from '../../i18n/de'
import { useStore } from '../../state/store'
import { Overlay } from './RoundSummary'

const MEDAL = ['🥇', '🥈', '🥉']

export function GameOver({ onMenu }: { onMenu: () => void }) {
  const game = useStore((s) => s.game)!
  const ranked = rankings(game)
  const champion = ranked[0]

  return (
    <Overlay>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass w-full max-w-sm rounded-3xl p-6 text-center"
      >
        <p className="text-xs uppercase tracking-[0.3em] text-gold-400/80">{T.gameOver}</p>
        <h2 className="mt-2 font-display text-4xl text-gold-300">{T.winner}</h2>
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, type: 'spring' }}
          className="my-3 font-display text-2xl text-gold-200"
        >
          {champion.name} · {champion.scoreTotal}
        </motion.div>

        <div className="mt-4 space-y-1.5 text-left">
          {ranked.map((p, i) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 + i * 0.07 }}
              className={`flex items-center justify-between rounded-xl px-3 py-2 ${
                p.isHuman ? 'bg-gold-400/15' : 'bg-felt-950/30'
              }`}
            >
              <span className="flex items-center gap-2 text-gold-200">
                <span className="w-6 text-center">{MEDAL[i] ?? i + 1}</span>
                {p.name}
              </span>
              <span className="font-display text-lg text-gold-300">{p.scoreTotal}</span>
            </motion.div>
          ))}
        </div>

        <button
          onClick={onMenu}
          className="mt-6 w-full rounded-2xl bg-gold-400 py-3 font-display text-lg text-felt-950 shadow-lg active:scale-[0.98]"
        >
          {T.newGame}
        </button>
      </motion.div>
    </Overlay>
  )
}
