/**
 * Leichtgewichtige Soundeffekte & Ambient-Musik über die Web Audio API –
 * komplett synthetisch, daher ohne Asset-Dateien und offline lauffähig.
 */

type Sfx = 'bid' | 'play' | 'trickWin' | 'roundEnd' | 'gameEnd' | 'click' | 'error'

let ctx: AudioContext | null = null
let master: GainNode | null = null
let soundOn = true
let musicOn = false
let musicHandle: { stop(): void } | null = null

function ensureCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null
  if (!ctx) {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!Ctor) return null
    ctx = new Ctor()
    master = ctx.createGain()
    master.gain.value = 0.5
    master.connect(ctx.destination)
  }
  return ctx
}

/** Muss von einer Nutzergeste aus aufgerufen werden (Autoplay-Policy). */
export function unlockAudio(): void {
  const c = ensureCtx()
  if (c && c.state === 'suspended') void c.resume()
}

function blip(freq: number, durationMs: number, type: OscillatorType, gain = 0.18, delayMs = 0): void {
  const c = ensureCtx()
  if (!c || !master) return
  const start = c.currentTime + delayMs / 1000
  const osc = c.createOscillator()
  const g = c.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(freq, start)
  g.gain.setValueAtTime(0.0001, start)
  g.gain.exponentialRampToValueAtTime(gain, start + 0.01)
  g.gain.exponentialRampToValueAtTime(0.0001, start + durationMs / 1000)
  osc.connect(g)
  g.connect(master)
  osc.start(start)
  osc.stop(start + durationMs / 1000 + 0.02)
}

export function playSfx(type: Sfx): void {
  if (!soundOn) return
  switch (type) {
    case 'play':
      blip(320, 90, 'triangle', 0.14)
      break
    case 'bid':
      blip(520, 120, 'sine', 0.16)
      break
    case 'trickWin':
      blip(660, 110, 'sine', 0.18)
      blip(880, 150, 'sine', 0.16, 90)
      break
    case 'roundEnd':
      blip(523, 140, 'sine', 0.18)
      blip(659, 140, 'sine', 0.18, 120)
      blip(784, 220, 'sine', 0.18, 240)
      break
    case 'gameEnd':
      blip(523, 160, 'sine', 0.2)
      blip(659, 160, 'sine', 0.2, 140)
      blip(784, 160, 'sine', 0.2, 280)
      blip(1047, 320, 'sine', 0.2, 420)
      break
    case 'click':
      blip(420, 60, 'square', 0.08)
      break
    case 'error':
      blip(160, 180, 'sawtooth', 0.12)
      break
  }
}

export function setSoundEnabled(on: boolean): void {
  soundOn = on
  if (on) unlockAudio()
}

export function setMusicEnabled(on: boolean): void {
  musicOn = on
  if (on) startMusic()
  else stopMusic()
}

export function isSoundEnabled(): boolean {
  return soundOn
}
export function isMusicEnabled(): boolean {
  return musicOn
}

/**
 * Generative Ambient-Begleitung statt eines konstanten Dauertons: ein sanftes,
 * sich langsam wandelndes Pad führt durch eine Akkordfolge, darüber tropfen
 * sparsame Melodietöne aus einer Pentatonik (klingt immer konsonant). Weiche
 * Hüllkurven, ein Tiefpass und ein Echo-Delay geben Raum – ruhig und im
 * Hintergrund, ohne zu nerven. Alles synthetisch, keine Asset-Dateien.
 */

// Akkordfolge als Pad-Grundtöne (Hz): C – Am – F – G, je 8 Schritte.
const MUSIC_CHORDS = [
  [130.81, 164.81, 196.0], // C-Dur
  [110.0, 164.81, 220.0], // a-Moll
  [174.61, 220.0, 261.63], // F-Dur
  [196.0, 246.94, 293.66], // G-Dur
]
// C-/a-Pentatonik über zwei Oktaven für die Melodie (Hz).
const MUSIC_SCALE = [261.63, 293.66, 329.63, 392.0, 440.0, 523.25, 587.33, 659.25]
const STEP_DUR = 0.55 // Sekunden pro Schritt – gemächliches Tempo

function startMusic(): void {
  const c = ensureCtx()
  if (!c || !master || musicHandle) return
  unlockAudio()

  // Bus mit sanftem Einblenden.
  const bus = c.createGain()
  bus.gain.setValueAtTime(0.0001, c.currentTime)
  bus.gain.exponentialRampToValueAtTime(0.5, c.currentTime + 2.5)
  bus.connect(master)

  // Warme Tiefpass-Färbung.
  const tone = c.createBiquadFilter()
  tone.type = 'lowpass'
  tone.frequency.value = 1900
  tone.Q.value = 0.4
  tone.connect(bus)

  // Echo-Delay für Räumlichkeit.
  const delay = c.createDelay(1.0)
  delay.delayTime.value = 0.42
  const feedback = c.createGain()
  feedback.gain.value = 0.33
  const echo = c.createGain()
  echo.gain.value = 0.28
  delay.connect(feedback)
  feedback.connect(delay)
  delay.connect(echo)
  echo.connect(bus)

  // Anhaltendes Pad – drei leicht verstimmte Stimmen, die je Akkord umgestimmt werden.
  const padGain = c.createGain()
  padGain.gain.value = 0.05
  padGain.connect(tone)
  const pad = MUSIC_CHORDS[0].map((f, i) => {
    const o = c.createOscillator()
    o.type = i === 0 ? 'sine' : 'triangle'
    o.frequency.value = f
    o.detune.value = (i - 1) * 3
    o.connect(padGain)
    o.start()
    return o
  })

  // Kurzer, glockiger Melodieton mit weicher Hüllkurve.
  function pluck(freq: number, time: number, gain: number): void {
    const o = c!.createOscillator()
    const g = c!.createGain()
    o.type = 'sine'
    o.frequency.value = freq
    g.gain.setValueAtTime(0.0001, time)
    g.gain.exponentialRampToValueAtTime(gain, time + 0.05)
    g.gain.exponentialRampToValueAtTime(0.0001, time + 1.7)
    o.connect(g)
    g.connect(tone)
    g.connect(delay)
    o.start(time)
    o.stop(time + 1.8)
  }

  let step = 0
  let melodyIdx = 2
  let nextTime = c.currentTime + 0.2

  function scheduleStep(): void {
    const chordIdx = Math.floor(step / 8) % MUSIC_CHORDS.length
    const beat = step % 8
    if (beat === 0) {
      // Akkordwechsel: Pad sanft umstimmen, leiser Basston dazu.
      const chord = MUSIC_CHORDS[chordIdx]
      pad.forEach((o, i) => o.frequency.setTargetAtTime(chord[i], nextTime, 0.7))
      pluck(chord[0] / 2, nextTime, 0.07)
    }
    // Sparsame Melodie: nicht auf jedem Schritt, kleiner Zufallsgang in der Tonleiter.
    if (beat % 2 === 0 || Math.random() < 0.35) {
      melodyIdx = Math.max(0, Math.min(MUSIC_SCALE.length - 1, melodyIdx + Math.floor(Math.random() * 3) - 1))
      pluck(MUSIC_SCALE[melodyIdx], nextTime, 0.11)
    }
    nextTime += STEP_DUR
    step++
  }

  // Lookahead-Scheduler: plant Töne knapp im Voraus, läuft unabhängig vom Frame-Takt.
  const timer = window.setInterval(() => {
    while (nextTime < c!.currentTime + 0.3) scheduleStep()
  }, 60)

  musicHandle = {
    stop() {
      window.clearInterval(timer)
      const t = c!.currentTime
      bus.gain.cancelScheduledValues(t)
      bus.gain.setValueAtTime(bus.gain.value, t)
      bus.gain.exponentialRampToValueAtTime(0.0001, t + 0.6)
      pad.forEach((o) => {
        try {
          o.stop(t + 0.7)
        } catch {
          // bereits gestoppt
        }
      })
      window.setTimeout(() => {
        try {
          bus.disconnect()
        } catch {
          // bereits getrennt
        }
      }, 900)
    },
  }
}

function stopMusic(): void {
  if (!musicHandle) return
  musicHandle.stop()
  musicHandle = null
}
