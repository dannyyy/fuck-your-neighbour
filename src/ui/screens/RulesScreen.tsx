import { motion } from 'framer-motion'
import { SwissSuit } from '../cards/SwissSuit'

const RANK_ORDER = ['6', '7', '8', '10', 'Under', 'Ober', 'König', '9', 'Ass']

export function RulesScreen({ onClose }: { onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 grid place-items-center bg-felt-950/80 p-4 backdrop-blur"
    >
      <motion.div
        initial={{ y: 24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="glass max-h-[85vh] w-full max-w-md overflow-y-auto rounded-3xl"
      >
        <div className="sticky top-0 flex items-center justify-between border-b border-gold-400/20 bg-felt-950/70 px-5 py-3 backdrop-blur">
          <h2 className="font-display text-2xl text-gold-300">Regeln</h2>
          <button onClick={onClose} className="text-gold-200/70" aria-label="Schliessen">
            ✕
          </button>
        </div>

        <div className="space-y-5 px-5 py-4 text-sm leading-relaxed text-gold-200/85">
          <Section title="Ziel">
            Über <b>11 Runden</b> (6→5→4→3→2→1→2→3→4→5→6 Karten) sagst du vor jeder Runde an,
            wie viele <b>Stiche</b> du machst. Wer am genauesten ist, gewinnt. Gespielt wird
            <b> ohne Trumpf</b> – die Farbe ist egal, nur der Rang zählt.
          </Section>

          <Section title="Rangordnung (wichtig!)">
            <div className="flex flex-wrap items-center gap-1.5">
              {RANK_ORDER.map((r, i) => (
                <span key={r} className="flex items-center gap-1.5">
                  <span className="rounded-md bg-felt-800 px-2 py-1 font-display text-gold-200">{r}</span>
                  {i < RANK_ORDER.length - 1 && <span className="text-gold-400/60">‹</span>}
                </span>
              ))}
            </div>
            <p className="mt-2 text-gold-200/60">
              Die <b>9 ist zweithöchste</b> Karte (direkt unter dem Ass), die <b>10/Banner</b>{' '}
              liegt unter dem Under.
            </p>
          </Section>

          <Section title="Ansage">
            Reihum nennt jeder seine Stichzahl. Der <b>Geber sagt zuletzt</b> an – seine Summe mit
            allen anderen darf <b>nicht</b> der Kartenzahl entsprechen. Und: <b>niemand darf
            zweimal in Folge 0</b> ansagen.
          </Section>

          <Section title="Stich & Stechen">
            Jeder legt eine Karte, die höchste gewinnt. Bei <b>Gleichstand</b> (gleicher Rang)
            legen alle eine weitere Karte ab – der Gewinner erhält dann <b>mehrere Stiche</b>{' '}
            gutgeschrieben. Bei der letzten Karte entscheidet die <b>darunterliegende Karte</b>{' '}
            (Erben).
          </Section>

          <Section title="1-Karten-Runde">
            Du hältst deine Karte verdeckt „an der Stirn“ – du siehst alle anderen, nur dich
            selbst nicht – und sagst an, ob du den Stich machst.
          </Section>

          <Section title="Punkte">
            <ul className="ml-4 list-disc space-y-1">
              <li>
                Ansage <b>exakt getroffen</b> → <span className="text-emerald-300">+10</span> Punkte.
              </li>
              <li>
                Pro Stich <b>daneben</b> → <span className="text-rose-300">−5</span> Punkte.
              </li>
            </ul>
            <p className="mt-1 text-gold-200/60">Beispiele: 3 / 3 → +10 · 0 / 0 → +10 · 2 / 0 → −10.</p>
          </Section>
        </div>

        <div className="flex justify-center gap-3 px-5 pb-5 pt-1 opacity-40">
          {(['schellen', 'schilten', 'rosen', 'eichel'] as const).map((s) => (
            <SwissSuit key={s} suit={s} size={20} />
          ))}
        </div>
      </motion.div>
    </motion.div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="mb-1 font-display text-lg text-gold-300">{title}</h3>
      <div>{children}</div>
    </section>
  )
}
