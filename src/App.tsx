import { AnimatePresence } from 'framer-motion'
import { useState } from 'react'
import { useStore } from './state/store'
import { GameScreen } from './ui/screens/GameScreen'
import { RulesScreen } from './ui/screens/RulesScreen'
import { SettingsScreen } from './ui/screens/SettingsScreen'
import { StartScreen } from './ui/screens/StartScreen'
import { TrackerScreen } from './ui/screens/TrackerScreen'

export default function App() {
  const screen = useStore((s) => s.screen)
  const backToMenu = useStore((s) => s.backToMenu)
  const [showRules, setShowRules] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [showTracker, setShowTracker] = useState(false)

  return (
    <div className="h-full">
      {showTracker ? (
        <TrackerScreen onExit={() => setShowTracker(false)} />
      ) : screen === 'start' ? (
        <StartScreen
          onShowRules={() => setShowRules(true)}
          onShowSettings={() => setShowSettings(true)}
          onShowTracker={() => setShowTracker(true)}
        />
      ) : (
        <GameScreen onMenu={backToMenu} onRules={() => setShowRules(true)} />
      )}

      <AnimatePresence>
        {showRules && <RulesScreen onClose={() => setShowRules(false)} />}
        {showSettings && <SettingsScreen onClose={() => setShowSettings(false)} />}
      </AnimatePresence>
    </div>
  )
}
