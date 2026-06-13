import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { activeRoundIndex, roundComplete } from '../../../tracker/session'
import type { TrackerSession } from '../../../tracker/types'
import { T } from '../../../i18n/de'
import { PlayerOrder } from './PlayerOrder'
import { RoundEditor } from './RoundEditor'
import { Scoreboard } from './Scoreboard'

/** Hauptansicht einer laufenden Session: Runden erfassen, Punktetafel, Korrektur. */
export function SessionView({ session }: { session: TrackerSession }) {
  const active = activeRoundIndex(session)
  const lastRound = session.rounds.length - 1
  const [selected, setSelected] = useState(active === -1 ? lastRound : active)
  const [reordering, setReordering] = useState(false)

  // Springt mit, sobald eine spätere Runde aktiv wird (flüssige Live-Erfassung).
  useEffect(() => {
    if (active !== -1 && active > selected && roundComplete(session.rounds[selected])) {
      setSelected(active)
    }
  }, [active, selected, session])

  const round = session.rounds[selected]
  const complete = roundComplete(round)
  const nextIncomplete = session.rounds.findIndex((r, i) => i > selected && !roundComplete(r))

  return (
    <div className="space-y-5">
      {reordering ? (
        <PlayerOrder session={session} onDone={() => setReordering(false)} />
      ) : (
        <>
          {/* Rundennavigation */}
          <div className="flex items-center justify-between">
            <NavBtn
              label="‹"
              onClick={() => setSelected((i) => Math.max(0, i - 1))}
              disabled={selected === 0}
            />
            <div className="text-center">
              <div className="font-display text-2xl text-gold-200">
                {T.trackerRound} {selected + 1}
                <span className="text-gold-200/40">
                  {' '}
                  {T.trackerOf} {session.rounds.length}
                </span>
              </div>
              <div className="text-xs text-gold-400/70">
                {round.cards} {T.trackerCardsLabel}
                {selected === active && ` · ${T.trackerActiveRound}`}
              </div>
            </div>
            <NavBtn
              label="›"
              onClick={() => setSelected((i) => Math.min(lastRound, i + 1))}
              disabled={selected === lastRound}
            />
          </div>

          <motion.div key={selected} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <RoundEditor session={session} roundIndex={selected} />
          </motion.div>

          {complete && nextIncomplete !== -1 && (
            <button
              onClick={() => setSelected(nextIncomplete)}
              className="w-full rounded-2xl bg-gold-400 py-3.5 font-display text-lg font-600 text-felt-950 shadow-lg shadow-gold-500/25 transition active:scale-[0.98]"
            >
              {T.trackerRound} {nextIncomplete + 1} →
            </button>
          )}

          {/* Punktetafel */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-xs font-600 uppercase tracking-[0.2em] text-gold-400/80">
                {T.trackerScoreboard}
              </h2>
              <button
                onClick={() => setReordering(true)}
                className="glass rounded-lg px-2.5 py-1 text-[11px] text-gold-200/75 active:scale-95"
              >
                {T.trackerReorder}
              </button>
            </div>
            <Scoreboard session={session} selectedRound={selected} onSelectRound={setSelected} />
          </div>
        </>
      )}
    </div>
  )
}

function NavBtn({
  label,
  onClick,
  disabled,
}: {
  label: string
  onClick: () => void
  disabled?: boolean
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="grid size-11 shrink-0 place-items-center rounded-full glass font-display text-2xl text-gold-200 transition active:scale-90 disabled:opacity-25"
    >
      {label}
    </button>
  )
}
