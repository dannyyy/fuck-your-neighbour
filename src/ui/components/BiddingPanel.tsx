import { motion } from 'framer-motion'
import { T } from '../../i18n/de'

interface Props {
  cardCount: number
  legalBids: number[]
  onBid: (bid: number) => void
}

export function BiddingPanel({ cardCount, legalBids, onBid }: Props) {
  const legal = new Set(legalBids)
  const values = Array.from({ length: cardCount + 1 }, (_, v) => v)

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="px-4 pb-2 pt-3"
    >
      <p className="mb-3 text-center font-display text-lg text-gold-200">{T.howManyTricks}</p>
      <div className="flex flex-wrap justify-center gap-2">
        {values.map((v) => {
          const ok = legal.has(v)
          return (
            <button
              key={v}
              disabled={!ok}
              onClick={() => onBid(v)}
              className={`grid size-14 place-items-center rounded-2xl font-display text-2xl transition active:scale-95 ${
                ok
                  ? 'bg-gold-400 text-felt-950 shadow-lg shadow-gold-500/30'
                  : 'cursor-not-allowed bg-felt-950/40 text-gold-200/25 line-through'
              }`}
            >
              {v}
            </button>
          )
        })}
      </div>
      <p className="mt-3 text-center text-[11px] text-gold-200/45">
        Ausgegraute Werte sind durch die Geber-Regel oder „kein 2× 0“ gesperrt.
      </p>
    </motion.div>
  )
}
