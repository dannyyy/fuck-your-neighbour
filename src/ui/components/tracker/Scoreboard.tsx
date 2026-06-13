import { playerTotal, roundPoints } from '../../../tracker/session'
import type { TrackerSession } from '../../../tracker/types'
import { T } from '../../../i18n/de'

/**
 * Detail-Punktetafel (Req 6): alle Runden × alle Spieler, mit Ansage·Stich,
 * Rundenpunkten und Gesamtsumme. Zeilen sind antippbar, um eine Runde zur
 * Korrektur zu öffnen (Req 7).
 */
export function Scoreboard({
  session,
  selectedRound,
  onSelectRound,
}: {
  session: TrackerSession
  selectedRound: number
  onSelectRound: (i: number) => void
}) {
  const { players } = session
  const totals = players.map((p) => playerTotal(session, p.id))
  const leader = Math.max(...totals)

  return (
    <div className="-mx-1 overflow-x-auto pb-1">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr>
            <th className="sticky left-0 z-10 bg-felt-950/90 px-2 py-2 text-left text-[10px] font-600 uppercase tracking-wider text-gold-400/70">
              {T.trackerRound}
            </th>
            {players.map((p, i) => (
              <th key={p.id} className="px-2 py-2 text-center">
                <div className="truncate font-display text-base text-gold-200">{p.name}</div>
                <div
                  className={`font-display text-lg ${
                    totals[i] === leader && leader !== 0 ? 'text-gold-400' : 'text-gold-200/70'
                  }`}
                >
                  {totals[i]}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {session.rounds.map((round, ri) => {
            const isSelected = ri === selectedRound
            return (
              <tr
                key={ri}
                onClick={() => onSelectRound(ri)}
                className={`cursor-pointer transition ${
                  isSelected ? 'bg-gold-400/15' : 'hover:bg-gold-400/5'
                }`}
              >
                <td className="sticky left-0 z-10 whitespace-nowrap bg-felt-950/90 px-2 py-1.5">
                  <span className="font-display text-gold-200/80">{ri + 1}</span>
                  <span className="ml-1.5 text-[10px] text-gold-200/45">{round.cards}{T.trackerCardsLabel[0]}</span>
                </td>
                {players.map((p) => {
                  const entry = round.entries[p.id]
                  const pts = roundPoints(round, p.id, session.scoring)
                  return (
                    <td key={p.id} className="px-2 py-1.5 text-center">
                      {entry.bid === null && entry.tricks === null ? (
                        <span className="text-gold-200/25">·</span>
                      ) : (
                        <div className="leading-tight">
                          <div className="text-[11px] text-gold-200/55">
                            {entry.bid ?? '–'}
                            <span className="opacity-40"> / </span>
                            {entry.tricks ?? '–'}
                          </div>
                          {pts !== null && (
                            <div
                              className={`font-display ${pts >= 0 ? 'text-emerald-300' : 'text-rose-300'}`}
                            >
                              {pts > 0 ? '+' : ''}
                              {pts}
                            </div>
                          )}
                        </div>
                      )}
                    </td>
                  )
                })}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
