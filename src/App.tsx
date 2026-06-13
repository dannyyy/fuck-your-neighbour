import { AnimatePresence } from 'framer-motion'
import { useState } from 'react'
import { useStore } from './state/store'
import { GameScreen } from './ui/screens/GameScreen'
import { ModeSelect } from './ui/screens/ModeSelect'
import { RulesScreen } from './ui/screens/RulesScreen'
import { SettingsScreen } from './ui/screens/SettingsScreen'
import { StartScreen } from './ui/screens/StartScreen'
import { TrackerScreen } from './ui/screens/TrackerScreen'

/** Oberster Einstieg: erst Modus wählen, dann KI-Spiel bzw. Live-Tracker. */
type View = 'menu' | 'computer' | 'friends'

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
      ) : view === 'menu' ? (
        <ModeSelect
          onComputer={() => setView('computer')}
          onFriends={() => setView('friends')}
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
