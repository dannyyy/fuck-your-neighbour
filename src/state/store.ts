import { create } from 'zustand'
import type { Card } from '../game/cards'
import { createGame, currentActor, nextRound, placeBid, playCard } from '../game/engine'
import { makeRng, randomSeed, type Rng } from '../game/rng'
import type { Difficulty, GameRules, GameState, TrickFlash } from '../game/types'
import { buildView, createAi, type Ai } from '../ai'
import { loadSettings, saveSettings, type PersistedSettings } from './settings'
import { playSfx, setSoundEnabled, unlockAudio } from './sound'

const AI_BID_DELAY = 720
const AI_PLAY_DELAY = 580
const TRICK_FLASH_MS = 1300
/** Endet mit dem Stich auch die Runde, bleibt er länger stehen, bevor die Wertung erscheint. */
const ROUND_END_FLASH_MS = 2200

/** Namenspool für KI-Gegner (Index 0 = Mensch „Du“). */
const NAMES = ['Du', 'Lena', 'Marco', 'Sven', 'Nadia', 'Reto']

export type Screen = 'start' | 'game'

export type { TrickFlash } from '../game/types'

type Settings = PersistedSettings

/**
 * Brücke zum Online-/Lokal-Mehrspielermodus. Ist sie gesetzt, rendert die
 * bestehende Spiel-UI weiterhin aus diesem Store (die redigierte Sicht wird via
 * `pushNetView` gespiegelt), aber Aktionen des Menschen gehen an den Host bzw.
 * werden als Absicht versendet, statt die Engine lokal auszuführen.
 */
export interface NetBridge {
  bid(bid: number): void
  play(card: Card): void
  continue(): void
}

interface StoreState {
  screen: Screen
  game: GameState | null
  ai: Ai | null
  rng: Rng | null
  settings: Settings
  /** Während dieser Anzeige bleibt der abgeschlossene Stich kurz sichtbar. */
  trickFlash: TrickFlash | null
  /** Spieler-ID, deren KI gerade „nachdenkt“ (für Indikator). */
  thinking: number | null
  /** Gesetzt im Mehrspielermodus – lenkt Aktionen an den Host um. */
  netBridge: NetBridge | null
  /** Darf dieses Gerät die Runde weiterschalten? (Host/Solo ja, Client nein.) */
  canContinue: boolean

  startGame(opts: { numPlayers: number; difficulty: Difficulty }): void
  humanBid(bid: number): void
  humanPlay(card: Card): void
  continueRound(): void
  backToMenu(): void
  toggleSound(): void
  setRules(rules: GameRules): void
  /** Mehrspieler: redigierte Sicht in die UI spiegeln. */
  pushNetView(view: { state: GameState; flash: TrickFlash | null; thinking: number | null }): void
  /** Mehrspieler: Aktionen umlenken und Weiterschalt-Recht setzen. */
  attachNet(bridge: NetBridge, canContinue: boolean): void
  /** Mehrspieler beenden und Spielzustand räumen. */
  detachNet(): void
}

const delay = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms))

let aiRunning = false

/** Setzt einen neuen Zustand und blendet einen abgeschlossenen Stich kurz ein. */
async function applyState(next: GameState, prev: GameState): Promise<void> {
  const completed = next.completedTricks.length > prev.completedTricks.length
  useStore.setState({ game: next })

  if (completed) {
    const last = next.completedTricks[next.completedTricks.length - 1]
    const lastLayer = last.layers[last.layers.length - 1]
    useStore.setState({
      trickFlash: { winnerId: last.winner, cards: lastLayer, resolvedBy: last.resolvedBy },
    })
    playSfx('trickWin')
    // Letzter Stich der Runde länger zeigen – die Wertung (RoundSummary) wird in der
    // UI erst eingeblendet, wenn der trickFlash wieder verschwindet.
    const roundEnding = next.phase === 'roundEnd' || next.phase === 'gameEnd'
    await delay(roundEnding ? ROUND_END_FLASH_MS : TRICK_FLASH_MS)
    useStore.setState({ trickFlash: null })
  }

  if (next.phase === 'roundEnd') playSfx('roundEnd')
  if (next.phase === 'gameEnd') playSfx('gameEnd')
}

/** Lässt alle KI-Spieler ziehen, bis der Mensch dran ist oder die Runde endet. */
async function runAi(): Promise<void> {
  if (aiRunning) return
  aiRunning = true
  try {
    for (;;) {
      const { game, ai, rng } = useStore.getState()
      if (!game || !ai || !rng) break
      if (game.phase === 'roundEnd' || game.phase === 'gameEnd') break

      const actor = currentActor(game)
      if (!actor) break
      if (game.players[actor.playerId].isHuman) break

      useStore.setState({ thinking: actor.playerId })
      await delay(actor.kind === 'bid' ? AI_BID_DELAY : AI_PLAY_DELAY)

      const current = useStore.getState().game!
      const view = buildView(current, actor.playerId)
      let next: GameState
      if (actor.kind === 'bid') {
        next = placeBid(current, actor.playerId, ai.decideBid(view, rng))
        playSfx('bid')
      } else {
        next = playCard(current, actor.playerId, ai.chooseCard(view, rng))
        playSfx('play')
      }
      useStore.setState({ thinking: null })
      await applyState(next, current)
    }
  } finally {
    aiRunning = false
    useStore.setState({ thinking: null })
  }
}

const initialSettings = loadSettings()
setSoundEnabled(initialSettings.sound)

export const useStore = create<StoreState>((set, get) => ({
  screen: 'start',
  game: null,
  ai: null,
  rng: null,
  settings: initialSettings,
  trickFlash: null,
  thinking: null,
  netBridge: null,
  canContinue: true,

  startGame({ numPlayers, difficulty }) {
    unlockAudio()
    const seed = randomSeed()
    const playerNames = NAMES.slice(0, numPlayers)
    const game = createGame({
      numPlayers,
      difficulty,
      playerNames,
      humanIndex: 0,
      seed,
      rules: get().settings.rules,
    })
    set({
      screen: 'game',
      game,
      ai: createAi(difficulty),
      rng: makeRng(seed ^ 0x9e3779b9),
      trickFlash: null,
      thinking: null,
    })
    void runAi()
  },

  humanBid(bid) {
    const { game, netBridge } = get()
    if (!game) return
    if (netBridge) {
      const actor = currentActor(game)
      if (!actor || actor.kind !== 'bid' || actor.playerId !== game.config.humanIndex) return
      playSfx('bid')
      netBridge.bid(bid)
      return
    }
    const actor = currentActor(game)
    if (!actor || actor.kind !== 'bid' || !game.players[actor.playerId].isHuman) return
    const next = placeBid(game, actor.playerId, bid)
    playSfx('bid')
    set({ game: next })
    void runAi()
  },

  async humanPlay(card) {
    const { game, netBridge } = get()
    if (!game) return
    if (netBridge) {
      const actor = currentActor(game)
      if (!actor || actor.kind !== 'play' || actor.playerId !== game.config.humanIndex) return
      playSfx('play')
      netBridge.play(card)
      return
    }
    const actor = currentActor(game)
    if (!actor || actor.kind !== 'play' || !game.players[actor.playerId].isHuman) return
    const next = playCard(game, actor.playerId, card)
    playSfx('play')
    await applyState(next, game)
    void runAi()
  },

  continueRound() {
    const { game, netBridge, canContinue } = get()
    if (!game || game.phase !== 'roundEnd') return
    if (netBridge) {
      if (canContinue) {
        playSfx('click')
        netBridge.continue()
      }
      return
    }
    playSfx('click')
    set({ game: nextRound(game) })
    void runAi()
  },

  backToMenu() {
    set({
      screen: 'start',
      game: null,
      ai: null,
      rng: null,
      trickFlash: null,
      thinking: null,
      netBridge: null,
      canContinue: true,
    })
  },

  pushNetView({ state, flash, thinking }) {
    const prev = get().game
    set({ screen: 'game', game: state, trickFlash: flash, thinking })
    const grew = !prev || prev.completedTricks.length < state.completedTricks.length
    if (flash && grew) playSfx('trickWin')
    if (state.phase === 'roundEnd' && prev?.phase !== 'roundEnd') playSfx('roundEnd')
    if (state.phase === 'gameEnd' && prev?.phase !== 'gameEnd') playSfx('gameEnd')
  },

  attachNet(bridge, canContinue) {
    unlockAudio()
    set({ netBridge: bridge, canContinue, ai: null, rng: null, trickFlash: null, thinking: null })
  },

  detachNet() {
    set({
      netBridge: null,
      canContinue: true,
      game: null,
      trickFlash: null,
      thinking: null,
      screen: 'start',
    })
  },

  toggleSound() {
    const next = !get().settings.sound
    setSoundEnabled(next)
    const settings = { ...get().settings, sound: next }
    saveSettings(settings)
    set({ settings })
  },

  setRules(rules) {
    const settings = { ...get().settings, rules }
    saveSettings(settings)
    set({ settings })
  },
}))
