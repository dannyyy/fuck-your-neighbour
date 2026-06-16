import { DIFFICULTY_LABEL, T } from '../../i18n/de'
import { useNetStore } from '../../state/netStore'
import type { Difficulty } from '../../game/types'
import type { RosterEntry } from '../../net/protocol'
import { Overlay } from '../components/RoundSummary'
import { QrCode } from '../components/QrCode'
import { QrScanner } from '../components/QrScanner'

const DIFFICULTIES: Difficulty[] = ['leicht', 'mittel', 'schwer']

/** Host-Lobby: Mitspieler per QR einladen, KI ergänzen, Partie starten. */
export function HostLobbyScreen({ onBack }: { onBack: () => void }) {
  const roster = useNetStore((s) => s.roster)
  const canStart = useNetStore((s) => s.canStart)
  const pairing = useNetStore((s) => s.pairing)
  const qrCode = useNetStore((s) => s.qrCode)
  const busy = useNetStore((s) => s.busy)
  const error = useNetStore((s) => s.error)
  const createInvite = useNetStore((s) => s.hostCreateInvite)
  const acceptAnswer = useNetStore((s) => s.hostAcceptAnswer)
  const setPairing = useNetStore((s) => s.setPairing)
  const addAi = useNetStore((s) => s.hostAddAi)
  const removeSeat = useNetStore((s) => s.hostRemoveSeat)
  const beginGame = useNetStore((s) => s.hostBeginGame)

  return (
    <div className="grain relative mx-auto flex h-full max-w-md flex-col overflow-y-auto px-5 py-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="font-display text-3xl font-600 text-gold-200">{T.lobbyTitle}</h1>
        <button onClick={onBack} className="text-sm text-gold-200/70">
          {T.leaveGame}
        </button>
      </div>
      <p className="mb-4 text-sm text-gold-200/60">{T.lobbyHint}</p>

      <div className="space-y-2">
        {roster.map((entry) => (
          <SeatRow key={entry.seat} entry={entry} onRemove={() => removeSeat(entry.seat)} />
        ))}
      </div>

      <div className="mt-5 space-y-2">
        <button
          onClick={createInvite}
          disabled={roster.length >= 6 || busy}
          className="glass w-full rounded-2xl py-3 font-display text-base text-gold-200 disabled:opacity-40 active:scale-[0.98]"
        >
          {T.invitePlayer}
        </button>

        <div className="flex items-center gap-2">
          <span className="text-xs text-gold-200/50">{T.addAi}:</span>
          {DIFFICULTIES.map((d) => (
            <button
              key={d}
              onClick={() => addAi(d)}
              disabled={roster.length >= 6}
              className="glass flex-1 rounded-xl py-2 text-xs text-gold-200 disabled:opacity-40 active:scale-[0.98]"
            >
              {DIFFICULTY_LABEL[d]}
            </button>
          ))}
        </div>
      </div>

      {error && <p className="mt-4 text-center text-xs text-rose-300">{error}</p>}

      <button
        onClick={beginGame}
        disabled={!canStart}
        className="mt-auto w-full rounded-2xl bg-gold-400 py-4 font-display text-lg text-felt-950 shadow-lg disabled:opacity-40 active:scale-[0.98]"
      >
        {canStart ? T.beginGame : T.needMorePlayers}
      </button>

      {(pairing === 'show-invite' || pairing === 'scan-answer') && (
        <Overlay>
          <div className="glass w-full max-w-sm rounded-3xl p-5">
            {pairing === 'show-invite' && qrCode && (
              <>
                <h2 className="mb-3 text-center font-display text-xl text-gold-300">
                  {T.pairShowInvite}
                </h2>
                <div className="flex justify-center">
                  <QrCode data={qrCode} />
                </div>
                <p className="mt-3 text-center text-xs text-gold-200/60">{T.pairShowInviteHint}</p>
                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => setPairing('idle')}
                    className="glass flex-1 rounded-2xl py-3 text-sm text-gold-200/80"
                  >
                    {T.close}
                  </button>
                  <button
                    onClick={() => setPairing('scan-answer')}
                    className="flex-1 rounded-2xl bg-gold-400 py-3 font-display text-base text-felt-950"
                  >
                    {T.pairScanAnswer}
                  </button>
                </div>
              </>
            )}
            {pairing === 'scan-answer' && (
              <>
                <h2 className="mb-3 text-center font-display text-xl text-gold-300">
                  {T.pairScanAnswer}
                </h2>
                <QrScanner
                  hint={T.pairScanAnswerHint}
                  onResult={(code) => void acceptAnswer(code)}
                  onCancel={() => setPairing('idle')}
                />
              </>
            )}
          </div>
        </Overlay>
      )}
    </div>
  )
}

function SeatRow({ entry, onRemove }: { entry: RosterEntry; onRemove: () => void }) {
  const status =
    entry.kind === 'local'
      ? T.seatYou
      : entry.kind === 'ai'
        ? `KI · ${DIFFICULTY_LABEL[entry.difficulty ?? 'mittel']}`
        : entry.connected
          ? T.seatConnected
          : T.seatWaiting
  return (
    <div className="flex items-center justify-between rounded-2xl bg-felt-950/30 px-4 py-3">
      <div className="flex items-center gap-3">
        <div className="grid size-9 place-items-center rounded-full bg-felt-700 font-display text-lg text-gold-200">
          {entry.name.charAt(0).toUpperCase()}
        </div>
        <div>
          <div className="text-sm font-600 text-gold-200">{entry.name}</div>
          <div className="text-[11px] text-gold-200/55">{status}</div>
        </div>
      </div>
      {entry.kind !== 'local' && (
        <button onClick={onRemove} className="text-xs text-rose-300/80 active:scale-95">
          {T.removeSeat}
        </button>
      )}
    </div>
  )
}
