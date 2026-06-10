import { AnimatePresence } from 'framer-motion'
import { useState } from 'react'
import { useStore } from './state/store'
import { GameScreen } from './ui/screens/GameScreen'
import { RulesScreen } from './ui/screens/RulesScreen'
import { StartScreen } from './ui/screens/StartScreen'

export default function App() {
  const screen = useStore((s) => s.screen)
  const backToMenu = useStore((s) => s.backToMenu)
  const [showRules, setShowRules] = useState(false)

  return (
    <div className="h-full">
      {screen === 'start' ? (
        <StartScreen onShowRules={() => setShowRules(true)} />
      ) : (
        <GameScreen onMenu={backToMenu} onRules={() => setShowRules(true)} />
      )}

      <AnimatePresence>
        {showRules && <RulesScreen onClose={() => setShowRules(false)} />}
      </AnimatePresence>
    </div>
  )
}
