/**
 * Schnelle Zahleneingabe per Tipp (0..max). Erneutes Tippen auf den gewählten
 * Wert hebt die Auswahl wieder auf – so lässt sich ein Fehleintrag leicht leeren.
 */
export function NumberChips({
  max,
  value,
  onChange,
  tone = 'gold',
}: {
  max: number
  value: number | null
  onChange: (v: number | null) => void
  tone?: 'gold' | 'green'
}) {
  const active =
    tone === 'green'
      ? 'bg-emerald-400 text-felt-950 shadow shadow-emerald-500/30'
      : 'bg-gold-400 text-felt-950 shadow shadow-gold-500/30'
  return (
    <div className="flex flex-wrap gap-1.5">
      {Array.from({ length: max + 1 }, (_, n) => (
        <button
          key={n}
          onClick={() => onChange(value === n ? null : n)}
          className={`grid size-9 place-items-center rounded-lg font-display text-lg transition active:scale-95 ${
            value === n ? active : 'glass text-gold-200 hover:border-gold-400/50'
          }`}
        >
          {n}
        </button>
      ))}
    </div>
  )
}
