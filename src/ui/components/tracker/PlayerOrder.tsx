import type { TrackerSession } from '../../../tracker/types'
import { T } from '../../../i18n/de'
import { useTrackerStore } from '../../../state/trackerStore'

/** Spieler umbenennen und per ▲▼ neu ordnen (Req 7). Punkte bleiben erhalten. */
export function PlayerOrder({ session, onDone }: { session: TrackerSession; onDone: () => void }) {
  const reorderPlayers = useTrackerStore((s) => s.reorderPlayers)
  const renamePlayer = useTrackerStore((s) => s.renamePlayer)
  const ids = session.players.map((p) => p.id)

  const move = (from: number, to: number) => {
    if (to < 0 || to >= ids.length) return
    const next = [...ids]
    const [moved] = next.splice(from, 1)
    next.splice(to, 0, moved)
    reorderPlayers(next)
  }

  return (
    <div className="space-y-4">
      <p className="text-xs text-gold-200/55">{T.trackerReorderHint}</p>
      <ul className="space-y-2">
        {session.players.map((p, i) => (
          <li key={p.id} className="glass flex items-center gap-2 rounded-xl px-2.5 py-2">
            <div className="flex flex-col">
              <ArrowBtn label="▲" onClick={() => move(i, i - 1)} disabled={i === 0} />
              <ArrowBtn label="▼" onClick={() => move(i, i + 1)} disabled={i === ids.length - 1} />
            </div>
            <input
              value={p.name}
              onChange={(e) => renamePlayer(p.id, e.target.value)}
              className="min-w-0 flex-1 rounded-lg bg-transparent px-2 py-1.5 font-display text-lg text-gold-200 focus:bg-felt-900/60 focus:outline-none"
            />
          </li>
        ))}
      </ul>
      <button
        onClick={onDone}
        className="w-full rounded-2xl bg-gold-400 py-3 font-display text-lg font-600 text-felt-950 transition active:scale-[0.98]"
      >
        {T.trackerDone}
      </button>
    </div>
  )
}

function ArrowBtn({
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
      className="grid h-5 w-7 place-items-center text-xs text-gold-300 transition active:scale-90 disabled:opacity-20"
    >
      {label}
    </button>
  )
}
