import { ROUND_CARD_COUNTS } from '../../game/constants'
import { T } from '../../i18n/de'
import { useStore } from '../../state/store'
import { Overlay } from './RoundSummary'

export function ScoreBoard({ onClose }: { onClose: () => void }) {
  const game = useStore((s) => s.game)!
  const players = game.players

  return (
    <Overlay>
      <div className="glass max-h-[80vh] w-full max-w-sm overflow-hidden rounded-3xl">
        <div className="flex items-center justify-between border-b border-gold-400/20 px-4 py-3">
          <h2 className="font-display text-xl text-gold-300">{T.scoreboard}</h2>
          <button onClick={onClose} className="text-gold-200/70" aria-label="Schliessen">
            ✕
          </button>
        </div>

        <div className="max-h-[64vh] overflow-y-auto px-3 py-2">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-felt-950/80 text-[11px] uppercase tracking-wide text-gold-200/60">
              <tr>
                <th className="py-2 text-left font-500">{T.round}</th>
                {players.map((p) => (
                  <th key={p.id} className="py-2 text-right font-500">
                    {p.name.slice(0, 4)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {game.history.map((r) => (
                <tr key={r.round} className="border-t border-gold-400/10">
                  <td className="py-1.5 text-left text-gold-200/60">
                    {r.round + 1}
                    <span className="ml-1 text-[10px] text-gold-200/30">({r.cardCount})</span>
                  </td>
                  {players.map((p, i) => (
                    <td key={p.id} className="py-1.5 text-right">
                      <span className={r.deltas[i] >= 0 ? 'text-emerald-300/90' : 'text-rose-300/90'}>
                        {r.deltas[i] > 0 ? `+${r.deltas[i]}` : r.deltas[i]}
                      </span>
                    </td>
                  ))}
                </tr>
              ))}
              {game.history.length === 0 && (
                <tr>
                  <td colSpan={players.length + 1} className="py-6 text-center text-gold-200/40">
                    Noch keine Runde gespielt.
                  </td>
                </tr>
              )}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-gold-400/30 font-display">
                <td className="py-2 text-left text-gold-300">{T.total}</td>
                {players.map((p) => (
                  <td key={p.id} className="py-2 text-right text-gold-300">
                    {p.scoreTotal}
                  </td>
                ))}
              </tr>
            </tfoot>
          </table>
          <p className="mt-2 px-1 text-[10px] text-gold-200/30">
            Insgesamt {ROUND_CARD_COUNTS.length} Runden.
          </p>
        </div>
      </div>
    </Overlay>
  )
}
