/**
 * Leichtgewichtige Soundeffekte über die Web Audio API – komplett synthetisch,
 * daher ohne Asset-Dateien und offline lauffähig.
 */

type Sfx = 'bid' | 'play' | 'trickWin' | 'roundEnd' | 'gameEnd' | 'click' | 'error'

let ctx: AudioContext | null = null
let master: GainNode | null = null
let soundOn = true

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

export function isSoundEnabled(): boolean {
  return soundOn
}
