import { create } from 'zustand'
import type { Card } from '../game/cards'
import { createGame, currentActor, nextRound, placeBid, playCard } from '../game/engine'
import { makeRng, randomSeed, type Rng } from '../game/rng'
import type { Difficulty, GameState, PlayedCard } from '../game/types'
import { buildView, createAi, type Ai } from '../ai'
import { playSfx, setMusicEnabled, setSoundEnabled, unlockAudio } from './sound'

const AI_BID_DELAY = 720
const AI_PLAY_DELAY = 580
const TRICK_FLASH_MS = 1300

/** Namenspool für KI-Gegner (Index 0 = Mensch „Du“). */
const NAMES = ['Du', 'Lena', 'Marco', 'Sven', 'Nadia', 'Reto']

export type Screen = 'start' | 'game'

export interface TrickFlash {
  winnerId: number
  cards: PlayedCard[]
  resolvedBy: 'high' | 'erben'
}

interface Settings {
  sound: boolean
  music: boolean
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

  startGame(opts: { numPlayers: number; difficulty: Difficulty }): void
  humanBid(bid: number): void
  humanPlay(card: Card): void
  continueRound(): void
  backToMenu(): void
  toggleSound(): void
  toggleMusic(): void
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
    await delay(TRICK_FLASH_MS)
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

export const useStore = create<StoreState>((set, get) => ({
  screen: 'start',
  game: null,
  ai: null,
  rng: null,
  settings: { sound: true, music: false },
  trickFlash: null,
  thinking: null,

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
    const { game } = get()
    if (!game) return
    const actor = currentActor(game)
    if (!actor || actor.kind !== 'bid' || !game.players[actor.playerId].isHuman) return
    const next = placeBid(game, actor.playerId, bid)
    playSfx('bid')
    set({ game: next })
    void runAi()
  },

  async humanPlay(card) {
    const { game } = get()
    if (!game) return
    const actor = currentActor(game)
    if (!actor || actor.kind !== 'play' || !game.players[actor.playerId].isHuman) return
    const next = playCard(game, actor.playerId, card)
    playSfx('play')
    await applyState(next, game)
    void runAi()
  },

  continueRound() {
    const { game } = get()
    if (!game || game.phase !== 'roundEnd') return
    playSfx('click')
    set({ game: nextRound(game) })
    void runAi()
  },

  backToMenu() {
    set({ screen: 'start', game: null, ai: null, rng: null, trickFlash: null, thinking: null })
  },

  toggleSound() {
    const next = !get().settings.sound
    setSoundEnabled(next)
    set((s) => ({ settings: { ...s.settings, sound: next } }))
  },

  toggleMusic() {
    const next = !get().settings.music
    setMusicEnabled(next)
    set((s) => ({ settings: { ...s.settings, music: next } }))
  },
}))
