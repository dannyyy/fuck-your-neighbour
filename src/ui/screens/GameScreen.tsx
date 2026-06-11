import { useState } from 'react'
import { legalBids } from '../../game/bidding'
import { currentActor } from '../../game/engine'
import { seatOrderFrom } from '../../game/seating'
import { T } from '../../i18n/de'
import { useStore } from '../../state/store'
import { BiddingPanel } from '../components/BiddingPanel'
import { GameOver } from '../components/GameOver'
import { Hand } from '../components/Hand'
import { Hud } from '../components/Hud'
import { OpponentSeat } from '../components/OpponentSeat'
import { RoundSummary } from '../components/RoundSummary'
import { ScoreBoard } from '../components/ScoreBoard'
import { TrickArea } from '../components/TrickArea'

export function GameScreen({ onMenu, onRules }: { onMenu: () => void; onRules: () => void }) {
  const game = useStore((s) => s.game)
  const thinking = useStore((s) => s.thinking)
  const flash = useStore((s) => s.trickFlash)
  const humanBid = useStore((s) => s.humanBid)
  const humanPlay = useStore((s) => s.humanPlay)
  const [showScores, setShowScores] = useState(false)

  if (!game) return null

  const humanId = game.config.humanIndex
  const human = game.players[humanId]
  const actor = currentActor(game)
  const isHumanBid = game.phase === 'bidding' && actor?.kind === 'bid' && actor.playerId === humanId
  const isHumanPlay =
    game.phase === 'playing' && actor?.kind === 'play' && actor.playerId === humanId && !flash

  const orderedOpponents = seatOrderFrom(humanId, game.config.numPlayers)
    .slice(1)
    .map((id) => game.players[id])

  const mustDiscard =
    isHumanPlay && !!game.trick?.isStechen && !game.trick.contenders.includes(humanId)
  const turnHint = isHumanBid
    ? T.yourTurn
    : isHumanPlay
      ? mustDiscard
        ? T.discardACard
        : T.playACard
      : actor
        ? `${game.players[actor.playerId].name} ${thinking === actor.playerId ? T.thinking : T.waiting}`
        : ''

  return (
    <div className="grain relative mx-auto flex h-full max-w-md flex-col">
      <Hud onMenu={onMenu} onRules={onRules} onScores={() => setShowScores(true)} />

      {/* Gegner */}
      <div className="flex flex-wrap items-start justify-center gap-1 px-2 pt-3">
        {orderedOpponents.map((p) => (
          <OpponentSeat
            key={p.id}
            player={p}
            isActive={actor?.playerId === p.id}
            isThinking={thinking === p.id}
            isDealer={game.dealer === p.id}
            isOneCardRound={game.isOneCardRound}
            phase={game.phase}
          />
        ))}
      </div>

      {/* Tischmitte */}
      <TrickArea />

      {/* Eigener Bereich */}
      <div className="glass z-10 rounded-t-3xl pb-3">
        <div className="flex items-center justify-between px-4 pt-3">
          <div className="flex items-center gap-2">
            <div
              className={`grid size-9 place-items-center rounded-full font-display text-lg ${
                actor?.playerId === humanId ? 'bg-gold-400 text-felt-950' : 'bg-felt-700 text-gold-200'
              }`}
            >
              {human.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-1 text-sm font-600 text-gold-200">
                {human.name}
                {game.dealer === humanId && (
                  <span className="grid size-4 place-items-center rounded-full bg-gold-400 text-[9px] font-700 text-felt-950">
                    G
                  </span>
                )}
              </div>
              <div className="flex gap-2 text-[11px] text-gold-200/70">
                <span>
                  {T.bid}: {human.bid ?? '–'}
                </span>
                <span className="text-gold-300">
                  {T.tricks}: {human.tricksWon}
                </span>
              </div>
            </div>
          </div>
          <div className="text-right text-xs font-500 text-gold-300">{turnHint}</div>
        </div>

        {isHumanBid && (
          <BiddingPanel
            cardCount={game.cardCount}
            legalBids={legalBids(game, humanId)}
            onBid={humanBid}
          />
        )}
        {/* Eigene Hand immer sichtbar – ausser in der 1-Karten-Runde (verdeckt „an der Stirn“). */}
        <Hand
          cards={human.hand}
          playable={isHumanPlay}
          faceDown={game.isOneCardRound}
          onPlay={humanPlay}
        />
      </div>

      {/* Wertung/Game-Over erst zeigen, wenn der letzte Stich fertig eingeblendet ist. */}
      {game.phase === 'roundEnd' && !flash && <RoundSummary />}
      {game.phase === 'gameEnd' && !flash && <GameOver onMenu={onMenu} />}
      {showScores && <ScoreBoard onClose={() => setShowScores(false)} />}
    </div>
  )
}
