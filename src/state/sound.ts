/**
 * Leichtgewichtige Soundeffekte & Ambient-Musik über die Web Audio API –
 * komplett synthetisch, daher ohne Asset-Dateien und offline lauffähig.
 */

type Sfx = 'bid' | 'play' | 'trickWin' | 'roundEnd' | 'gameEnd' | 'click' | 'error'

let ctx: AudioContext | null = null
let master: GainNode | null = null
let soundOn = true
let musicOn = false
let musicNodes: { osc: OscillatorNode[]; gain: GainNode; lfo: OscillatorNode } | null = null

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

function startMusic(): void {
  const c = ensureCtx()
  if (!c || !master || musicNodes) return
  unlockAudio()
  const gain = c.createGain()
  gain.gain.value = 0.045
  gain.connect(master)

  // Sanfter Pad-Akkord (Em9-ish) mit langsamer Lautstärke-Modulation.
  const freqs = [82.41, 123.47, 164.81, 246.94]
  const osc = freqs.map((f, i) => {
    const o = c.createOscillator()
    o.type = i % 2 === 0 ? 'sine' : 'triangle'
    o.frequency.value = f
    o.detune.value = i * 4
    o.connect(gain)
    o.start()
    return o
  })

  const lfo = c.createOscillator()
  const lfoGain = c.createGain()
  lfo.frequency.value = 0.07
  lfoGain.gain.value = 0.03
  lfo.connect(lfoGain)
  lfoGain.connect(gain.gain)
  lfo.start()

  musicNodes = { osc, gain, lfo }
}

function stopMusic(): void {
  if (!musicNodes) return
  const { osc, gain, lfo } = musicNodes
  try {
    osc.forEach((o) => o.stop())
    lfo.stop()
    gain.disconnect()
  } catch {
    // already stopped
  }
  musicNodes = null
}
