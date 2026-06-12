import { TOTAL_ROUNDS } from '../../game/constants'
import { T } from '../../i18n/de'
import { useStore } from '../../state/store'

export function Hud({ onMenu, onRules, onScores }: { onMenu: () => void; onRules: () => void; onScores: () => void }) {
  const game = useStore((s) => s.game)
  const settings = useStore((s) => s.settings)
  const toggleSound = useStore((s) => s.toggleSound)
  if (!game) return null

  return (
    <header className="glass z-20 flex items-center justify-between gap-2 rounded-b-2xl px-3 py-2">
      <button onClick={onMenu} className="rounded-lg px-2 py-1 text-gold-200/70" aria-label={T.backToMenu}>
        ‹
      </button>

      <div className="flex items-baseline gap-2">
        <span className="font-display text-lg text-gold-300">
          {T.round} {game.roundIndex + 1}
          <span className="text-gold-200/40">/{TOTAL_ROUNDS}</span>
        </span>
        <span className="rounded-full bg-gold-400/15 px-2 py-0.5 text-xs text-gold-200/80">
          {game.cardCount} {T.cards}
        </span>
      </div>

      <div className="flex items-center gap-1">
        <IconBtn onClick={onScores} label={T.scoreboard}>≡</IconBtn>
        <IconBtn onClick={toggleSound} active={settings.sound} label={T.sound}>♪</IconBtn>
        <IconBtn onClick={onRules} label={T.rules}>?</IconBtn>
      </div>
    </header>
  )
}

function IconBtn({
  children,
  onClick,
  active = true,
  label,
}: {
  children: React.ReactNode
  onClick: () => void
  active?: boolean
  label: string
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className={`grid size-8 place-items-center rounded-lg text-base ${
        active ? 'text-gold-300' : 'text-gold-200/30'
      } hover:bg-gold-400/10`}
    >
      {children}
    </button>
  )
}
