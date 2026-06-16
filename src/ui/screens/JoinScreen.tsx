import { T } from '../../i18n/de'
import { useNetStore } from '../../state/netStore'
import { QrCode } from '../components/QrCode'
import { QrScanner } from '../components/QrScanner'

/** Beitritts-Ablauf für Clients: Host-QR scannen → Antwort-QR zeigen → Warteraum. */
export function JoinScreen({ onBack }: { onBack: () => void }) {
  const pairing = useNetStore((s) => s.pairing)
  const qrCode = useNetStore((s) => s.qrCode)
  const roster = useNetStore((s) => s.roster)
  const mySeat = useNetStore((s) => s.mySeat)
  const busy = useNetStore((s) => s.busy)
  const error = useNetStore((s) => s.error)
  const acceptInvite = useNetStore((s) => s.clientAcceptInvite)

  const connected = roster.length > 0 || mySeat !== null

  return (
    <div className="grain relative mx-auto flex h-full max-w-md flex-col overflow-y-auto px-5 py-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="font-display text-3xl font-600 text-gold-200">{T.netJoinOption}</h1>
        <button onClick={onBack} className="text-sm text-gold-200/70">
          {T.leaveGame}
        </button>
      </div>

      {pairing === 'scan-invite' && !connected && (
        <QrScanner
          hint={T.pairScanInviteHint}
          onResult={(code) => void acceptInvite(code)}
          onCancel={onBack}
        />
      )}

      {pairing === 'show-answer' && qrCode && !connected && (
        <div className="flex flex-col items-center gap-3">
          <h2 className="font-display text-xl text-gold-300">{T.pairShowAnswer}</h2>
          <QrCode data={qrCode} />
          <p className="text-center text-sm text-gold-200/60">{T.pairShowAnswerHint}</p>
        </div>
      )}

      {busy && <p className="mt-4 text-center text-sm text-gold-200/60">{T.pairConnecting}</p>}

      {connected && (
        <div className="mt-2">
          <h2 className="mb-2 font-display text-xl text-gold-300">{T.lobbyTitle}</h2>
          <div className="space-y-2">
            {roster.map((e) => (
              <div
                key={e.seat}
                className={`flex items-center gap-3 rounded-2xl px-4 py-3 ${
                  e.seat === mySeat ? 'bg-gold-400/15' : 'bg-felt-950/30'
                }`}
              >
                <div className="grid size-8 place-items-center rounded-full bg-felt-700 font-display text-gold-200">
                  {e.name.charAt(0).toUpperCase()}
                </div>
                <span className="text-sm text-gold-200">{e.name}</span>
                {e.seat === mySeat && <span className="text-[11px] text-gold-300">({T.seatYou})</span>}
              </div>
            ))}
          </div>
          <p className="mt-5 text-center text-sm text-gold-200/60">{T.waitingForStart}</p>
        </div>
      )}

      {error && (
        <p className="mt-4 text-center text-xs text-rose-300">
          {error === 'full'
            ? T.errFull
            : error === 'version'
              ? T.errVersion
              : error === 'closed'
                ? T.errClosed
                : error}
        </p>
      )}
    </div>
  )
}
