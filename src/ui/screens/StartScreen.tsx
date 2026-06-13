import { motion } from 'framer-motion'
import { useState } from 'react'
import type { Difficulty } from '../../game/types'
import { DIFFICULTY_HINT, DIFFICULTY_LABEL, T } from '../../i18n/de'
import { useStore } from '../../state/store'
import { SwissSuit } from '../cards/SwissSuit'

const PLAYER_OPTIONS = [3, 4, 5, 6]
const DIFFICULTIES: Difficulty[] = ['leicht', 'mittel', 'schwer']

export function StartScreen({
  onShowRules,
  onShowSettings,
  onShowTracker,
}: {
  onShowRules: () => void
  onShowSettings: () => void
  onShowTracker: () => void
}) {
  const [numPlayers, setNumPlayers] = useState(4)
  const [difficulty, setDifficulty] = useState<Difficulty>('mittel')
  const startGame = useStore((s) => s.startGame)
  const settings = useStore((s) => s.settings)
  const toggleSound = useStore((s) => s.toggleSound)

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
        className="mb-10 mt-6 text-center"
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

      <motion.section custom={1} initial="hidden" animate="show" variants={fade} className="mb-7">
        <Label>{T.players}</Label>
        <div className="grid grid-cols-4 gap-2">
          {PLAYER_OPTIONS.map((n) => (
            <button
              key={n}
              onClick={() => setNumPlayers(n)}
              className={`rounded-xl py-3 font-display text-2xl transition ${
                numPlayers === n
                  ? 'bg-gold-400 text-felt-950 shadow-lg shadow-gold-500/30'
                  : 'glass text-gold-200 hover:border-gold-400/50'
              }`}
            >
              {n}
            </button>
          ))}
        </div>
      </motion.section>

      <motion.section custom={2} initial="hidden" animate="show" variants={fade} className="mb-8">
        <Label>{T.difficulty}</Label>
        <div className="space-y-2">
          {DIFFICULTIES.map((d) => (
            <button
              key={d}
              onClick={() => setDifficulty(d)}
              className={`flex w-full items-center justify-between rounded-xl px-4 py-3 text-left transition ${
                difficulty === d
                  ? 'bg-gold-400/15 hairline border-gold-400/70'
                  : 'glass hover:border-gold-400/40'
              }`}
            >
              <div>
                <div className="font-display text-lg text-gold-200">{DIFFICULTY_LABEL[d]}</div>
                <div className="text-xs text-gold-200/60">{DIFFICULTY_HINT[d]}</div>
              </div>
              <span
                className={`size-4 rounded-full border-2 ${
                  difficulty === d ? 'border-gold-400 bg-gold-400' : 'border-gold-200/40'
                }`}
              />
            </button>
          ))}
        </div>
      </motion.section>

      <motion.div custom={3} initial="hidden" animate="show" variants={fade} className="mt-auto space-y-3">
        <button
          onClick={() => startGame({ numPlayers, difficulty })}
          className="w-full rounded-2xl bg-gold-400 py-4 font-display text-xl font-600 text-felt-950 shadow-xl shadow-gold-500/30 transition active:scale-[0.98]"
        >
          {T.start}
        </button>
        <button
          onClick={onShowTracker}
          className="glass w-full rounded-2xl py-3.5 font-display text-lg text-gold-200 transition active:scale-[0.98]"
        >
          {T.tracker}
        </button>
        <div className="flex items-center gap-3">
          <button onClick={onShowSettings} className="glass flex-1 rounded-xl py-3 text-sm text-gold-200">
            {T.settings}
          </button>
          <button onClick={onShowRules} className="glass flex-1 rounded-xl py-3 text-sm text-gold-200">
            {T.rules}
          </button>
          <Toggle label={T.sound} on={settings.sound} onClick={toggleSound} />
        </div>
      </motion.div>
    </div>
  )
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-3 text-xs font-600 uppercase tracking-[0.2em] text-gold-400/80">{children}</h2>
  )
}

function Toggle({ label, on, onClick }: { label: string; on: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      aria-pressed={on}
      className={`glass flex flex-col items-center rounded-xl px-3 py-2 text-[10px] uppercase tracking-wide ${
        on ? 'text-gold-300' : 'text-gold-200/40'
      }`}
    >
      <span className={`mb-1 size-2 rounded-full ${on ? 'bg-gold-400' : 'bg-gold-200/30'}`} />
      {label}
    </button>
  )
}
