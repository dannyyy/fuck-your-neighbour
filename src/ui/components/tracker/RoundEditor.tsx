import { roundPoints, roundWarnings } from '../../../tracker/session'
import type { TrackerSession } from '../../../tracker/types'
import { T } from '../../../i18n/de'
import { useTrackerStore } from '../../../state/trackerStore'
import { NumberChips } from './NumberChips'

/**
 * Erfassung einer einzelnen Runde: je Spieler Ansage und Stiche antippen.
 * Funktioniert für die aktuelle wie für frühere Runden (Korrektur, Req 7).
 */
export function RoundEditor({
  session,
  roundIndex,
}: {
  session: TrackerSession
  roundIndex: number
}) {
  const setEntry = useTrackerStore((s) => s.setEntry)
  const round = session.rounds[roundIndex]
  const warn = roundWarnings(round)

  const bidSum = session.players.reduce((s, p) => s + (round.entries[p.id].bid ?? 0), 0)
  const trickSum = session.players.reduce((s, p) => s + (round.entries[p.id].tricks ?? 0), 0)

  return (
    <div className="space-y-4">
      <p className="text-xs text-gold-200/55">{T.trackerTapToScore}</p>

      <div className="space-y-3">
        {session.players.map((p) => {
          const entry = round.entries[p.id]
          const pts = roundPoints(round, p.id, session.scoring)
          return (
            <div key={p.id} className="glass rounded-2xl px-3.5 py-3">
              <div className="mb-2 flex items-center justify-between">
                <span className="truncate font-display text-lg text-gold-200">{p.name}</span>
                {pts !== null && (
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 font-display text-sm ${
                      pts >= 0 ? 'bg-emerald-400/15 text-emerald-300' : 'bg-rose-500/15 text-rose-300'
                    }`}
                  >
                    {pts > 0 ? '+' : ''}
                    {pts}
                  </span>
                )}
              </div>

              <div className="mb-1 text-[10px] font-600 uppercase tracking-[0.18em] text-gold-400/70">
                {T.trackerBids}
              </div>
              <NumberChips
                max={round.cards}
                value={entry.bid}
                onChange={(v) => setEntry(roundIndex, p.id, 'bid', v)}
              />

              <div className="mb-1 mt-2.5 text-[10px] font-600 uppercase tracking-[0.18em] text-emerald-400/70">
                {T.trackerTricks}
              </div>
              <NumberChips
                max={round.cards}
                value={entry.tricks}
                onChange={(v) => setEntry(roundIndex, p.id, 'tricks', v)}
                tone="green"
              />
            </div>
          )
        })}
      </div>

      <div className="space-y-1.5 text-sm">
        <div className="flex items-center justify-between text-gold-200/70">
          <span>
            {T.trackerSum} {T.trackerBids}
          </span>
          <span className={warn.bidConflict ? 'text-amber-300' : ''}>
            {bidSum} / {round.cards}
          </span>
        </div>
        <div className="flex items-center justify-between text-gold-200/70">
          <span>
            {T.trackerSum} {T.trackerTricks}
          </span>
          <span className={warn.trickMismatch ? 'text-amber-300' : ''}>
            {trickSum} / {round.cards}
          </span>
        </div>
      </div>

      {warn.bidConflict && <Warning>{T.trackerWarnBidSum}</Warning>}
      {warn.trickMismatch && <Warning>{T.trackerWarnTrickSum}</Warning>}
    </div>
  )
}

function Warning({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2 rounded-xl border border-amber-400/30 bg-amber-400/10 px-3 py-2 text-xs text-amber-200">
      <span aria-hidden>⚠</span>
      <span>{children}</span>
    </div>
  )
}
