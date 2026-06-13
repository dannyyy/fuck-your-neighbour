import { motion } from 'framer-motion'
import { activeRoundIndex } from '../../../tracker/session'
import type { TrackerSession } from '../../../tracker/types'
import { T } from '../../../i18n/de'
import { useTrackerStore } from '../../../state/trackerStore'

/** Übersicht aller gespeicherten Sessions mit Öffnen/Kopieren/Löschen (Req 8 & 9). */
export function SessionList({ onNew }: { onNew: () => void }) {
  const sessions = useTrackerStore((s) => s.sessions)
  const open = useTrackerStore((s) => s.open)
  const copyFrom = useTrackerStore((s) => s.copyFrom)
  const deleteSession = useTrackerStore((s) => s.deleteSession)

  return (
    <div className="space-y-4">
      <button
        onClick={onNew}
        className="w-full rounded-2xl bg-gold-400 py-4 font-display text-xl font-600 text-felt-950 shadow-xl shadow-gold-500/25 transition active:scale-[0.98]"
      >
        + {T.trackerNew}
      </button>

      {sessions.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-gold-400/20 px-4 py-8 text-center text-sm text-gold-200/50">
          {T.trackerNoSessions}
        </p>
      ) : (
        <ul className="space-y-2.5">
          {sessions.map((session) => (
            <SessionCard
              key={session.id}
              session={session}
              onOpen={() => open(session.id)}
              onCopy={() => copyFrom(session.id)}
              onDelete={() => {
                if (confirm(T.trackerDeleteConfirm)) deleteSession(session.id)
              }}
            />
          ))}
        </ul>
      )}
    </div>
  )
}

function SessionCard({
  session,
  onOpen,
  onCopy,
  onDelete,
}: {
  session: TrackerSession
  onOpen: () => void
  onCopy: () => void
  onDelete: () => void
}) {
  const active = activeRoundIndex(session)
  const progress = active === -1 ? T.trackerFinished : `${T.trackerRound} ${active + 1}/${session.rounds.length}`
  const date = new Date(session.updatedAt).toLocaleDateString('de-CH', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
  })

  return (
    <motion.li layout className="glass rounded-2xl">
      <button onClick={onOpen} className="block w-full px-4 py-3 text-left">
        <div className="flex items-baseline justify-between gap-2">
          <span className="truncate font-display text-lg text-gold-200">{session.name}</span>
          <span className="shrink-0 text-[11px] text-gold-200/45">{date}</span>
        </div>
        <div className="mt-0.5 truncate text-xs text-gold-200/55">
          {session.players.map((p) => p.name).join(' · ')}
        </div>
        <div className="mt-0.5 text-[11px] text-gold-400/70">{progress}</div>
      </button>
      <div className="flex border-t border-gold-400/15">
        <CardAction onClick={onOpen}>{T.trackerOpen}</CardAction>
        <CardAction onClick={onCopy}>{T.trackerCopy}</CardAction>
        <CardAction onClick={onDelete} danger>
          {T.trackerDelete}
        </CardAction>
      </div>
    </motion.li>
  )
}

function CardAction({
  onClick,
  children,
  danger,
}: {
  onClick: () => void
  children: React.ReactNode
  danger?: boolean
}) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 py-2.5 text-center text-xs transition first:rounded-bl-2xl last:rounded-br-2xl ${
        danger ? 'text-rose-300/80 hover:bg-rose-500/10' : 'text-gold-200/75 hover:bg-gold-400/10'
      } not-first:border-l not-first:border-gold-400/15`}
    >
      {children}
    </button>
  )
}
