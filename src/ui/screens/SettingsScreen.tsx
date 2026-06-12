import { motion } from 'framer-motion'
import { DEFAULT_RULES } from '../../game/constants'
import type { GameRules } from '../../game/types'
import { T } from '../../i18n/de'
import { useStore } from '../../state/store'

/**
 * Einstellungsmenü (vom Startbildschirm). Änderungen werden sofort gespeichert
 * und gelten für die nächste Partie.
 */
export function SettingsScreen({ onClose }: { onClose: () => void }) {
  const rules = useStore((s) => s.settings.rules)
  const setRules = useStore((s) => s.setRules)

  const update = (patch: Partial<GameRules>) => setRules({ ...rules, ...patch })

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 grid place-items-center bg-felt-950/80 p-4 backdrop-blur"
    >
      <motion.div
        initial={{ y: 24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="glass max-h-[85vh] w-full max-w-md overflow-y-auto rounded-3xl"
      >
        <div className="sticky top-0 flex items-center justify-between border-b border-gold-400/20 bg-felt-950/70 px-5 py-3 backdrop-blur">
          <h2 className="font-display text-2xl text-gold-300">{T.settings}</h2>
          <button onClick={onClose} className="text-gold-200/70" aria-label={T.close}>
            ✕
          </button>
        </div>

        <div className="space-y-5 px-5 py-4">
          <p className="text-xs text-gold-200/55">{T.settingsHint}</p>

          <Row title={T.ruleDoubleZero} hint={T.ruleDoubleZeroHint}>
            <Switch
              on={rules.doubleZeroRule}
              onToggle={() => update({ doubleZeroRule: !rules.doubleZeroRule })}
            />
          </Row>

          <Row title={T.scoreHit} hint={T.scoreHitHint}>
            <Stepper
              value={rules.hitScore}
              min={0}
              max={99}
              onChange={(v) => update({ hitScore: v })}
            />
          </Row>

          <Row title={T.scoreMiss} hint={T.scoreMissHint}>
            <Stepper
              value={rules.missPenalty}
              min={0}
              max={99}
              onChange={(v) => update({ missPenalty: v })}
            />
          </Row>

          <Row title={T.ruleSuitTiebreak} hint={T.ruleSuitTiebreakHint}>
            <Switch
              on={rules.lastCardTiebreak === 'suit'}
              onToggle={() =>
                update({ lastCardTiebreak: rules.lastCardTiebreak === 'suit' ? 'seat' : 'suit' })
              }
            />
          </Row>

          <button
            onClick={() => setRules({ ...DEFAULT_RULES })}
            className="glass w-full rounded-xl py-2.5 text-sm text-gold-200/80 active:scale-[0.98]"
          >
            {T.resetDefaults}
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

function Row({
  title,
  hint,
  children,
}: {
  title: string
  hint: string
  children: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="min-w-0">
        <div className="font-display text-base text-gold-200">{title}</div>
        <div className="text-[11px] text-gold-200/55">{hint}</div>
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  )
}

function Switch({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      aria-pressed={on}
      className={`relative h-7 w-12 rounded-full transition ${on ? 'bg-gold-400' : 'bg-felt-700'}`}
    >
      <span
        className={`absolute top-0.5 size-6 rounded-full bg-felt-950 transition-all ${
          on ? 'left-[1.375rem]' : 'left-0.5'
        }`}
      />
    </button>
  )
}

function Stepper({
  value,
  min,
  max,
  onChange,
}: {
  value: number
  min: number
  max: number
  onChange: (v: number) => void
}) {
  const clamp = (v: number) => Math.max(min, Math.min(max, v))
  return (
    <div className="flex items-center gap-1.5">
      <StepBtn label="−" onClick={() => onChange(clamp(value - 1))} disabled={value <= min} />
      <span className="grid w-9 place-items-center font-display text-lg text-gold-200">{value}</span>
      <StepBtn label="+" onClick={() => onChange(clamp(value + 1))} disabled={value >= max} />
    </div>
  )
}

function StepBtn({
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
      className="grid size-9 place-items-center rounded-xl bg-gold-400 font-display text-xl text-felt-950 disabled:opacity-30 active:scale-95"
    >
      {label}
    </button>
  )
}
