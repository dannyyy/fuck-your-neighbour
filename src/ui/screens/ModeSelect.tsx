import { motion } from 'framer-motion'
import { T } from '../../i18n/de'
import { SwissSuit } from '../cards/SwissSuit'

/**
 * Einstieg: Auswahl zwischen dem digitalen Spiel gegen die KI und dem
 * Live-Tracker für echte Tischrunden mit Freunden.
 */
export function ModeSelect({
  onComputer,
  onFriends,
  onOnline,
  onShowRules,
}: {
  onComputer: () => void
  onFriends: () => void
  onOnline: () => void
  onShowRules: () => void
}) {
  const fade = {
    hidden: { opacity: 0, y: 18 },
    show: (i: number) => ({ opacity: 1, y: 0, transition: { delay: 0.08 * i, duration: 0.5 } }),
  }

  return (
    <div className="grain relative mx-auto flex h-full max-w-md flex-col overflow-y-auto px-6 py-8">
      <div className="pointer-events-none absolute -left-10 top-10 opacity-[0.06]">
        <SwissSuit suit="rosen" size={220} />
      </div>
      <div className="pointer-events-none absolute -right-12 bottom-24 opacity-[0.06]">
        <SwissSuit suit="eichel" size={200} />
      </div>

      <motion.header
        custom={0}
        initial="hidden"
        animate="show"
        variants={fade}
        className="mb-12 mt-10 text-center"
      >
        <div className="mb-4 flex justify-center gap-2">
          {(['schellen', 'schilten', 'rosen', 'eichel'] as const).map((s) => (
            <SwissSuit key={s} suit={s} size={26} />
          ))}
        </div>
        <h1 className="font-display text-5xl leading-[0.95] font-600 text-gold-200">
          {T.title}
          <br />
          <span className="text-gold-400 italic">{T.titleAccent}</span>
        </h1>
        <p className="mt-4 text-sm tracking-wide text-gold-200/70">{T.subtitle}</p>
      </motion.header>

      <div className="space-y-3">
        <motion.div custom={1} initial="hidden" animate="show" variants={fade}>
          <ModeCard
            label={T.modeComputer}
            hint={T.modeComputerHint}
            onClick={onComputer}
            primary
          />
        </motion.div>
        <motion.div custom={2} initial="hidden" animate="show" variants={fade}>
          <ModeCard label={T.modeOnline} hint={T.modeOnlineHint} onClick={onOnline} />
        </motion.div>
        <motion.div custom={3} initial="hidden" animate="show" variants={fade}>
          <ModeCard label={T.modeFriends} hint={T.modeFriendsHint} onClick={onFriends} />
        </motion.div>
      </div>

      <motion.div
        custom={4}
        initial="hidden"
        animate="show"
        variants={fade}
        className="mt-auto pt-6"
      >
        <button
          onClick={onShowRules}
          className="glass w-full rounded-xl py-3 text-sm text-gold-200/80 active:scale-[0.98]"
        >
          {T.rules}
        </button>
      </motion.div>
    </div>
  )
}

function ModeCard({
  label,
  hint,
  onClick,
  primary,
}: {
  label: string
  hint: string
  onClick: () => void
  primary?: boolean
}) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center justify-between rounded-2xl px-5 py-5 text-left transition active:scale-[0.98] ${
        primary
          ? 'bg-gold-400 text-felt-950 shadow-xl shadow-gold-500/30'
          : 'glass text-gold-200 hover:border-gold-400/50'
      }`}
    >
      <div>
        <div className="font-display text-2xl font-600">{label}</div>
        <div className={`mt-0.5 text-sm ${primary ? 'text-felt-950/70' : 'text-gold-200/60'}`}>
          {hint}
        </div>
      </div>
      <span className="font-display text-3xl opacity-60">›</span>
    </button>
  )
}
