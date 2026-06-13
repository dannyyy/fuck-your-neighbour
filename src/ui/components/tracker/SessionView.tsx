import { motion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import { activeRoundIndex, roundComplete } from '../../../tracker/session'
import type { TrackerSession } from '../../../tracker/types'
import { T } from '../../../i18n/de'
import { PlayerOrder } from './PlayerOrder'
import { RoundEditor } from './RoundEditor'
import { Scoreboard } from './Scoreboard'

type Tab = 'round' | 'board'

/** Hauptansicht einer laufenden Session: Runden erfassen, Punktetafel, Korrektur. */
export function SessionView({ session }: { session: TrackerSession }) {
  const active = activeRoundIndex(session)
  const lastRound = session.rounds.length - 1
  const [selected, setSelected] = useState(active === -1 ? lastRound : active)
  const [tab, setTab] = useState<Tab>('round')
  const [reordering, setReordering] = useState(false)

  // Solange der Nutzer an der aktuellen Runde bleibt, folgt die Auswahl
  // automatisch der nächsten offenen Runde (flüssige Live-Erfassung). Sobald
  // er bewusst zurückblättert, wird das Mitlaufen angehalten – sonst würde es
  // sofort wieder vorspringen. Navigiert er zurück auf die aktuelle Runde,
  // läuft es wieder mit.
  const pinned = useRef(false)

  useEffect(() => {
    if (!pinned.current && active !== -1 && active !== selected) setSelected(active)
  }, [active, selected])

  const goTo = (i: number) => {
    const clamped = Math.max(0, Math.min(lastRound, i))
    pinned.current = active !== -1 && clamped !== active
    setSelected(clamped)
  }

  const openRound = (i: number) => {
    goTo(i)
    setTab('round')
  }

  if (reordering) {
    return <PlayerOrder session={session} onDone={() => setReordering(false)} />
  }

  const round = session.rounds[selected]
  const complete = roundComplete(round)
  const nextIncomplete = session.rounds.findIndex((r, i) => i > selected && !roundComplete(r))

  return (
    <div className="space-y-5">
      <div className="glass flex gap-1 rounded-2xl p-1">
        <TabButton active={tab === 'round'} onClick={() => setTab('round')}>
          {T.trackerTabRound}
        </TabButton>
        <TabButton active={tab === 'board'} onClick={() => setTab('board')}>
          {T.trackerScoreboard}
        </TabButton>
      </div>

      {tab === 'round' ? (
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <NavBtn label="‹" onClick={() => goTo(selected - 1)} disabled={selected === 0} />
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
              onClick={() => goTo(selected + 1)}
              disabled={selected === lastRound}
            />
          </div>

          <motion.div key={selected} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <RoundEditor session={session} roundIndex={selected} />
          </motion.div>

          {complete && nextIncomplete !== -1 && (
            <button
              onClick={() => openRound(nextIncomplete)}
              className="w-full rounded-2xl bg-gold-400 py-3.5 font-display text-lg font-600 text-felt-950 shadow-lg shadow-gold-500/25 transition active:scale-[0.98]"
            >
              {T.trackerRound} {nextIncomplete + 1} →
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          <button
            onClick={() => setReordering(true)}
            className="glass flex w-full items-center justify-center gap-2 rounded-2xl py-3 font-display text-base text-gold-200 transition active:scale-[0.98]"
          >
            <span aria-hidden>⇅</span> {T.trackerReorder}
          </button>
          <Scoreboard session={session} selectedRound={selected} onSelectRound={openRound} />
        </div>
      )}
    </div>
  )
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 rounded-xl py-2.5 text-center font-display text-base transition ${
        active ? 'bg-gold-400 text-felt-950 shadow shadow-gold-500/25' : 'text-gold-200/70'
      }`}
    >
      {children}
    </button>
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
