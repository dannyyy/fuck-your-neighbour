import { AnimatePresence, motion } from 'framer-motion'
import type { PlayedCard } from '../../game/types'
import { T } from '../../i18n/de'
import { useStore } from '../../state/store'
import { PlayingCard } from './Card'

export function TrickArea() {
  const game = useStore((s) => s.game)
  const flash = useStore((s) => s.trickFlash)
  if (!game) return null

  const plays: PlayedCard[] = flash ? flash.cards : game.trick?.currentLayer ?? []
  const winnerId = flash?.winnerId ?? null
  // Beim Stechen/„Duell“ kämpfen nur die Gleichstands-Spieler um den Stich – die
  // Abwürfe der übrigen werden abgeblendet, damit klar ist, wer noch im Rennen ist.
  const isDuel = !flash && !!game.trick?.isStechen
  // Im Duell legen alle ihre Karte verdeckt; aufgedeckt wird erst, wenn alle gelegt
  // haben (dann erscheint der trickFlash) – so kann niemand auf die Karten reagieren.
  const concealed = isDuel
  const contenders = game.trick?.contenders ?? []
  const isDimmed = (playerId: number) => isDuel && !contenders.includes(playerId)
  const banner =
    flash?.resolvedBy === 'erben'
      ? T.erben
      : game.trick?.isStechen && !flash
        ? T.stechen
        : null

  return (
    <div className="relative flex min-h-[9.5rem] flex-1 items-center justify-center px-4">
      <AnimatePresence>
        {banner && (
          <motion.div
            key={banner}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="absolute top-1 rounded-full bg-gold-400/90 px-4 py-1 font-display text-sm font-600 text-felt-950 shadow-lg"
          >
            {banner}
          </motion.div>
        )}
      </AnimatePresence>

      {game.phase === 'bidding' && plays.length === 0 && (
        <div className="text-center text-gold-200/55">
          <div className="font-display text-xl text-gold-300">{T.bidding}</div>
          <div className="text-xs">Reihum sagt jeder seine Stiche an.</div>
        </div>
      )}

      <div className="flex flex-wrap items-end justify-center gap-2">
        <AnimatePresence mode="popLayout">
          {plays.map((pc) => {
            const isWinner = winnerId === pc.playerId
            const dimmed = isDimmed(pc.playerId)
            return (
              <motion.div
                key={`${pc.playerId}-${pc.card.suit}-${pc.card.rank}`}
                layout
                initial={{ opacity: 0, scale: 0.6, y: 24 }}
                animate={{
                  opacity: dimmed ? 0.55 : 1,
                  scale: isWinner ? 1.08 : dimmed ? 0.88 : 1,
                  y: 0,
                }}
                exit={{ opacity: 0, scale: 0.6 }}
                transition={{ type: 'spring', stiffness: 320, damping: 26 }}
                className="flex flex-col items-center gap-1"
              >
                <span
                  className={`max-w-[3.5rem] truncate rounded-full px-2 text-[10px] ${
                    isWinner ? 'bg-gold-400 text-felt-950 font-600' : 'text-gold-200/60'
                  }`}
                >
                  {game.players[pc.playerId].name}
                </span>
                <PlayingCard
                  card={pc.card}
                  faceDown={concealed}
                  width={58}
                  highlight={isWinner ? 'winner' : dimmed ? 'dim' : 'none'}
                />
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>
    </div>
  )
}
