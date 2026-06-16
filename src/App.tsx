import { AnimatePresence } from 'framer-motion'
import { useState } from 'react'
import { T } from './i18n/de'
import { useNetStore } from './state/netStore'
import { useStore } from './state/store'
import { GameScreen } from './ui/screens/GameScreen'
import { HostLobbyScreen } from './ui/screens/HostLobbyScreen'
import { JoinScreen } from './ui/screens/JoinScreen'
import { ModeSelect } from './ui/screens/ModeSelect'
import { NetEntryScreen } from './ui/screens/NetEntryScreen'
import { RulesScreen } from './ui/screens/RulesScreen'
import { SettingsScreen } from './ui/screens/SettingsScreen'
import { StartScreen } from './ui/screens/StartScreen'
import { TrackerScreen } from './ui/screens/TrackerScreen'

/** Oberster Einstieg: erst Modus wählen, dann KI-Spiel, Online-Runde bzw. Tracker. */
type View = 'menu' | 'computer' | 'friends' | 'net'

export default function App() {
  const screen = useStore((s) => s.screen)
  const backToMenu = useStore((s) => s.backToMenu)
  const [view, setView] = useState<View>('menu')
  const [showRules, setShowRules] = useState(false)
  const [showSettings, setShowSettings] = useState(false)

  /** Verlässt das Computerspiel komplett und kehrt zur Modus-Auswahl zurück. */
  const exitToMenu = () => {
    backToMenu()
    setView('menu')
  }

  return (
    <div className="h-full">
      {view === 'friends' ? (
        <TrackerScreen onExit={() => setView('menu')} />
      ) : view === 'net' ? (
        <NetRouter onExit={() => setView('menu')} onRules={() => setShowRules(true)} />
      ) : view === 'menu' ? (
        <ModeSelect
          onComputer={() => setView('computer')}
          onFriends={() => setView('friends')}
          onOnline={() => setView('net')}
          onShowRules={() => setShowRules(true)}
        />
      ) : screen === 'start' ? (
        <StartScreen
          onShowRules={() => setShowRules(true)}
          onShowSettings={() => setShowSettings(true)}
          onBack={() => setView('menu')}
        />
      ) : (
        <GameScreen onMenu={exitToMenu} onRules={() => setShowRules(true)} />
      )}

      <AnimatePresence>
        {showRules && <RulesScreen onClose={() => setShowRules(false)} />}
        {showSettings && <SettingsScreen onClose={() => setShowSettings(false)} />}
      </AnimatePresence>
    </div>
  )
}

/** Leitet innerhalb des lokalen Mehrspielermodus je nach Sitzungs-Phase. */
function NetRouter({ onExit, onRules }: { onExit: () => void; onRules: () => void }) {
  const phase = useNetStore((s) => s.phase)
  const leave = useNetStore((s) => s.leave)

  const exit = () => {
    leave()
    onExit()
  }

  if (phase === 'game') return <GameScreen onMenu={exit} onRules={onRules} />
  if (phase === 'host-lobby') return <HostLobbyScreen onBack={exit} />
  if (phase === 'join') return <JoinScreen onBack={exit} />
  if (phase === 'ended') return <NetEnded onExit={exit} />
  return <NetEntryScreen onBack={onExit} />
}

function NetEnded({ onExit }: { onExit: () => void }) {
  return (
    <div className="grain mx-auto flex h-full max-w-md flex-col items-center justify-center gap-5 px-6">
      <p className="text-center font-display text-2xl text-gold-200">{T.errClosed}</p>
      <button
        onClick={onExit}
        className="rounded-2xl bg-gold-400 px-6 py-3 font-display text-lg text-felt-950 active:scale-[0.98]"
      >
        {T.backToMenu}
      </button>
    </div>
  )
}
