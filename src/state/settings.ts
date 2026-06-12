import { DEFAULT_RULES } from '../game/constants'
import type { GameRules } from '../game/types'

/**
 * Im Browser (localStorage) dauerhaft gespeicherte Einstellungen – Sound sowie
 * die konfigurierbaren Regelvarianten. Werden beim Start geladen, sodass eine
 * spätere Partie dieselben Einstellungen vorfindet.
 */
export interface PersistedSettings {
  sound: boolean
  rules: GameRules
}

export const DEFAULT_SETTINGS: PersistedSettings = {
  sound: true,
  rules: DEFAULT_RULES,
}

const STORAGE_KEY = 'fyn.settings.v1'

/** Lädt die Einstellungen und füllt fehlende Felder mit den Standardwerten auf. */
export function loadSettings(): PersistedSettings {
  if (typeof localStorage === 'undefined') return { ...DEFAULT_SETTINGS, rules: { ...DEFAULT_RULES } }
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { ...DEFAULT_SETTINGS, rules: { ...DEFAULT_RULES } }
    const parsed = JSON.parse(raw) as Partial<PersistedSettings>
    return {
      sound: parsed.sound ?? DEFAULT_SETTINGS.sound,
      rules: { ...DEFAULT_RULES, ...(parsed.rules ?? {}) },
    }
  } catch {
    return { ...DEFAULT_SETTINGS, rules: { ...DEFAULT_RULES } }
  }
}

export function saveSettings(settings: PersistedSettings): void {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
  } catch {
    // Speicher nicht verfügbar (z. B. privater Modus) – Einstellungen bleiben nur zur Laufzeit.
  }
}
