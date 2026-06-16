import { useState } from 'react'
import { T } from '../../i18n/de'
import { useNetStore } from '../../state/netStore'

/** Einstieg in den lokalen Mehrspielermodus: Host eröffnen oder beitreten. */
export function NetEntryScreen({ onBack }: { onBack: () => void }) {
  const [name, setName] = useState('')
  const hostStart = useNetStore((s) => s.hostStart)
  const clientStart = useNetStore((s) => s.clientStart)

  return (
    <div className="grain relative mx-auto flex h-full max-w-md flex-col overflow-y-auto px-6 py-8">
      <button onClick={onBack} className="mb-6 self-start text-sm text-gold-200/70">
        ‹ {T.backToMenu}
      </button>

      <h1 className="font-display text-4xl font-600 text-gold-200">{T.netTitle}</h1>
      <p className="mt-2 text-sm text-gold-200/70">{T.netSubtitle}</p>

      <label className="mt-8 block text-xs uppercase tracking-wide text-gold-200/60">
        {T.yourName}
      </label>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder={T.namePlaceholder}
        maxLength={14}
        className="mt-2 w-full rounded-xl bg-felt-950/50 px-4 py-3 text-gold-100 outline-none ring-1 ring-gold-400/30 focus:ring-gold-400/70"
      />

      <div className="mt-8 space-y-3">
        <button
          onClick={() => hostStart(name)}
          className="w-full rounded-2xl bg-gold-400 px-5 py-5 text-left text-felt-950 shadow-xl shadow-gold-500/30 active:scale-[0.98]"
        >
          <div className="font-display text-2xl font-600">{T.netHostOption}</div>
          <div className="mt-0.5 text-sm text-felt-950/70">{T.netHostHint}</div>
        </button>
        <button
          onClick={() => clientStart(name)}
          className="glass w-full rounded-2xl px-5 py-5 text-left text-gold-200 active:scale-[0.98]"
        >
          <div className="font-display text-2xl font-600">{T.netJoinOption}</div>
          <div className="mt-0.5 text-sm text-gold-200/60">{T.netJoinHint}</div>
        </button>
      </div>

      <p className="mt-auto pt-8 text-xs leading-relaxed text-gold-200/50">{T.netOfflineHint}</p>
    </div>
  )
}
