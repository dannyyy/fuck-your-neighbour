import { motion } from 'framer-motion'
import { useState } from 'react'
import { TRACKER_MAX_PLAYERS, TRACKER_MIN_PLAYERS } from '../../../tracker/schedule'
import { DEFAULT_TRACKER_SCORING } from '../../../tracker/session'
import type { TrackerScoring } from '../../../tracker/types'
import { T } from '../../../i18n/de'
import { useTrackerStore } from '../../../state/trackerStore'

function defaultName(): string {
  const d = new Date()
  return `${T.tracker} ${d.toLocaleDateString('de-CH', { day: '2-digit', month: '2-digit' })}`
}

/** Anlegen einer neuen Session: Name, 2–8 Spieler, Punktevergabe (Req 1 & 2). */
export function SessionSetup({ onBack }: { onBack: () => void }) {
  const newSession = useTrackerStore((s) => s.newSession)
  const [name, setName] = useState(defaultName())
  const [players, setPlayers] = useState<string[]>(['', '', '', ''])
  const [scoring, setScoring] = useState<TrackerScoring>({ ...DEFAULT_TRACKER_SCORING })

  const trimmed = players.map((p) => p.trim())
  const allNamed = trimmed.every((p) => p.length > 0)
  const enough = trimmed.length >= TRACKER_MIN_PLAYERS
  const valid = allNamed && enough

  const setPlayer = (i: number, v: string) =>
    setPlayers((ps) => ps.map((p, idx) => (idx === i ? v : p)))
  const addPlayer = () =>
    setPlayers((ps) => (ps.length < TRACKER_MAX_PLAYERS ? [...ps, ''] : ps))
  const removePlayer = (i: number) =>
    setPlayers((ps) => (ps.length > TRACKER_MIN_PLAYERS ? ps.filter((_, idx) => idx !== i) : ps))

  const start = () => {
    if (!valid) return
    newSession({
      name: name.trim() || defaultName(),
      playerNames: trimmed,
      scoring,
    })
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <section>
        <Label>{T.trackerSessionName}</Label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={T.trackerSessionNamePlaceholder}
          className="glass w-full rounded-xl px-4 py-3 font-display text-lg text-gold-200 placeholder:text-gold-200/30 focus:border-gold-400/60 focus:outline-none"
        />
      </section>

      <section>
        <Label>
          {T.trackerPlayers} ({players.length})
        </Label>
        <div className="space-y-2">
          {players.map((p, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-felt-700 font-display text-sm text-gold-200/70">
                {i + 1}
              </span>
              <input
                value={p}
                onChange={(e) => setPlayer(i, e.target.value)}
                placeholder={`${T.trackerPlayerPlaceholder} ${i + 1}`}
                className="glass min-w-0 flex-1 rounded-xl px-3 py-2.5 text-gold-200 placeholder:text-gold-200/30 focus:border-gold-400/60 focus:outline-none"
              />
              <button
                onClick={() => removePlayer(i)}
                disabled={players.length <= TRACKER_MIN_PLAYERS}
                aria-label={T.trackerDelete}
                className="grid size-9 shrink-0 place-items-center rounded-xl text-gold-200/60 transition hover:text-rose-300 disabled:opacity-25"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
        {players.length < TRACKER_MAX_PLAYERS && (
          <button
            onClick={addPlayer}
            className="mt-2 w-full rounded-xl border border-dashed border-gold-400/30 py-2.5 text-sm text-gold-200/70 transition hover:border-gold-400/60 hover:text-gold-200"
          >
            + {T.trackerAddPlayer}
          </button>
        )}
      </section>

      <section>
        <Label>{T.trackerScoring}</Label>
        <div className="space-y-3">
          <ScoreRow
            title={T.scoreHit}
            hint={T.scoreHitHint}
            value={scoring.hitScore}
            onChange={(v) => setScoring((s) => ({ ...s, hitScore: v }))}
          />
          <ScoreRow
            title={T.scoreMiss}
            hint={T.scoreMissHint}
            value={scoring.missPenalty}
            onChange={(v) => setScoring((s) => ({ ...s, missPenalty: v }))}
          />
        </div>
      </section>

      {!valid && (
        <p className="text-xs text-amber-300/80">
          {allNamed ? T.trackerMinPlayers : T.trackerEmptyPlayer}
        </p>
      )}

      <div className="flex gap-3">
        <button
          onClick={onBack}
          className="glass flex-1 rounded-2xl py-3.5 text-sm text-gold-200/80 active:scale-[0.98]"
        >
          {T.backToMenu}
        </button>
        <button
          onClick={start}
          disabled={!valid}
          className="flex-[2] rounded-2xl bg-gold-400 py-3.5 font-display text-lg font-600 text-felt-950 shadow-xl shadow-gold-500/25 transition active:scale-[0.98] disabled:opacity-40"
        >
          {T.trackerStart}
        </button>
      </div>
    </motion.div>
  )
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-3 text-xs font-600 uppercase tracking-[0.2em] text-gold-400/80">{children}</h2>
  )
}

function ScoreRow({
  title,
  hint,
  value,
  onChange,
}: {
  title: string
  hint: string
  value: number
  onChange: (v: number) => void
}) {
  const clamp = (v: number) => Math.max(0, Math.min(99, v))
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="min-w-0">
        <div className="font-display text-base text-gold-200">{title}</div>
        <div className="text-[11px] text-gold-200/55">{hint}</div>
      </div>
      <div className="flex shrink-0 items-center gap-1.5">
        <StepBtn label="−" onClick={() => onChange(clamp(value - 1))} disabled={value <= 0} />
        <span className="grid w-9 place-items-center font-display text-lg text-gold-200">{value}</span>
        <StepBtn label="+" onClick={() => onChange(clamp(value + 1))} disabled={value >= 99} />
      </div>
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
      className="grid size-9 place-items-center rounded-xl bg-gold-400 font-display text-xl text-felt-950 transition active:scale-95 disabled:opacity-30"
    >
      {label}
    </button>
  )
}
