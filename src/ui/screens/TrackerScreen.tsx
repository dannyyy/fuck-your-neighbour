import { motion } from 'framer-motion'
import { useState } from 'react'
import { T } from '../../i18n/de'
import { useTrackerStore } from '../../state/trackerStore'
import { SessionList } from '../components/tracker/SessionList'
import { SessionSetup } from '../components/tracker/SessionSetup'
import { SessionView } from '../components/tracker/SessionView'

/**
 * Eigenständiger Bereich „Live-Tracker“: echte Tischrunden mitschreiben.
 * Bewusst getrennt vom digitalen Spiel; eigener Zustand (`trackerStore`).
 */
export function TrackerScreen({ onExit }: { onExit: () => void }) {
  const sessions = useTrackerStore((s) => s.sessions)
  const activeId = useTrackerStore((s) => s.activeId)
  const close = useTrackerStore((s) => s.close)
  const [setupOpen, setSetupOpen] = useState(false)

  const active = sessions.find((s) => s.id === activeId) ?? null

  let title: string = T.tracker
  let subtitle: string | null = T.trackerSubtitle
  let onBack = onExit
  if (active) {
    title = active.name
    subtitle = null
    onBack = () => {
      close()
      setSetupOpen(false)
    }
  } else if (setupOpen) {
    title = T.trackerNewSession
    subtitle = null
    onBack = () => setSetupOpen(false)
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="grain mx-auto flex h-full max-w-md flex-col overflow-y-auto px-5 py-6"
    >
      <header className="mb-6 flex items-center gap-3">
        <button
          onClick={onBack}
          aria-label={T.backToMenu}
          className="grid size-10 shrink-0 place-items-center rounded-full glass text-xl text-gold-200 active:scale-90"
        >
          ‹
        </button>
        <div className="min-w-0">
          <h1 className="truncate font-display text-3xl text-gold-200">{title}</h1>
          {subtitle && <p className="text-xs text-gold-200/55">{subtitle}</p>}
        </div>
      </header>

      <div className="flex-1">
        {active ? (
          <SessionView session={active} />
        ) : setupOpen ? (
          <SessionSetup onBack={() => setSetupOpen(false)} />
        ) : (
          <SessionList onNew={() => setSetupOpen(true)} />
        )}
      </div>
    </motion.div>
  )
}
