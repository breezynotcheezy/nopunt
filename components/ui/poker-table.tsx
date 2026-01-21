"use client"

import { PlayingCard } from "./playing-card"
import type { Player } from "@/lib/mock-data"
import { cn } from "@/lib/utils"

interface PokerTableProps {
  heroPosition: string
  heroHand: [string, string]
  board?: string[]
  potSize: number
  action: string
  stackDepth: number
  blinds: string
  players: Player[]
}

// Positions are now percentages from center, spread evenly around the table edge
const SEAT_POSITIONS: Record<string, { angle: number; radiusX: number; radiusY: number }> = {
  // Top of table
  UTG: { angle: -120, radiusX: 48, radiusY: 55 },
  MP: { angle: -60, radiusX: 48, radiusY: 55 },
  // Right side
  CO: { angle: -20, radiusX: 52, radiusY: 50 },
  // Bottom right
  BTN: { angle: 20, radiusX: 52, radiusY: 50 },
  // Bottom (hero area - but we show opponents here too if they exist)
  SB: { angle: 70, radiusX: 35, radiusY: 60 },
  BB: { angle: 110, radiusX: 35, radiusY: 60 },
  // Left side
  EP: { angle: 160, radiusX: 52, radiusY: 50 },
}

function getPositionStyle(position: string) {
  const seat = SEAT_POSITIONS[position]
  if (!seat) return { left: "50%", top: "50%" }

  const angleRad = (seat.angle * Math.PI) / 180
  const x = 50 + seat.radiusX * Math.cos(angleRad)
  const y = 50 + seat.radiusY * Math.sin(angleRad)

  return { left: `${x}%`, top: `${y}%` }
}

export function PokerTable({
  heroPosition,
  heroHand,
  board,
  potSize,
  action,
  stackDepth,
  blinds,
  players,
}: PokerTableProps) {
  return (
    <div className="flex flex-col items-center w-full h-full">
      <div className="shrink-0 flex items-center justify-center gap-2 w-full mb-2">
        <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-white/5 backdrop-blur-sm border border-white/10">
          <span className="text-[10px] text-muted-foreground">Blinds</span>
          <span className="text-xs font-bold text-foreground">{blinds}</span>
        </div>
        <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-white/5 backdrop-blur-sm border border-white/10">
          <span className="text-[10px] text-muted-foreground">Stack</span>
          <span className="text-xs font-bold text-foreground">{stackDepth}bb</span>
        </div>
      </div>

      <div className="flex-1 w-full flex items-center justify-center min-h-0 py-1">
        <div className="relative w-full max-w-[320px] aspect-[1.6/1]">
          {/* Outer rail - dark wood look */}
          <div className="absolute inset-0 rounded-[50%] bg-gradient-to-b from-zinc-600 via-zinc-800 to-zinc-900 shadow-2xl" />

          {/* Inner rail highlight */}
          <div className="absolute inset-[3px] rounded-[50%] bg-gradient-to-b from-zinc-700 to-zinc-900" />

          {/* Felt surface - deep black with subtle texture */}
          <div className="absolute inset-[6px] rounded-[50%] bg-gradient-to-br from-zinc-900 via-black to-zinc-950 border border-zinc-700/30 shadow-[inset_0_0_60px_rgba(0,0,0,0.8)]">
            {/* Subtle center glow */}
            <div className="absolute inset-0 rounded-[50%] bg-[radial-gradient(ellipse_at_center,rgba(168,85,247,0.03)_0%,transparent_60%)]" />
          </div>

          {players.map((player) => {
            const style = getPositionStyle(player.position)
            const isHero = player.position === heroPosition

            // Skip rendering hero position as an opponent - we show hero separately
            if (isHero) return null

            return (
              <div
                key={player.position}
                className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-10"
                style={style}
              >
                {/* Player avatar */}
                <div
                  className={cn(
                    "relative w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold border-2 shadow-lg transition-all",
                    player.isFolded
                      ? "bg-zinc-800/90 border-zinc-700/50 text-zinc-500"
                      : player.isActive
                        ? "bg-gradient-to-b from-primary/40 to-primary/20 border-primary/60 text-primary shadow-primary/20"
                        : "bg-gradient-to-b from-zinc-700 to-zinc-800 border-zinc-600/50 text-zinc-200",
                  )}
                >
                  {player.position}
                  {/* Dealer button */}
                  {player.isDealer && (
                    <div className="absolute -right-1 -top-1 w-4 h-4 rounded-full bg-white text-black text-[8px] font-black flex items-center justify-center shadow-md border border-zinc-300">
                      D
                    </div>
                  )}
                </div>
                {/* Stack/status */}
                <div
                  className={cn(
                    "mt-0.5 px-1.5 py-0.5 rounded text-[9px] font-semibold",
                    player.isFolded ? "text-zinc-600" : "bg-black/40 text-zinc-300",
                  )}
                >
                  {player.isFolded ? "Fold" : `${player.stack}bb`}
                </div>
                {/* Current bet if any */}
                {player.currentBet && player.currentBet > 0 && !player.isFolded && (
                  <div className="mt-0.5 text-[8px] font-bold text-primary">{player.currentBet}bb</div>
                )}
              </div>
            )
          })}

          {/* Community Cards - centered on felt */}
          {board && board.length > 0 && (
            <div className="absolute top-[30%] left-1/2 -translate-x-1/2 flex gap-1 z-20">
              {board.map((card, i) => (
                <PlayingCard key={i} card={card} size="sm" />
              ))}
              {Array.from({ length: 5 - board.length }).map((_, i) => (
                <div
                  key={`empty-${i}`}
                  className="w-7 h-10 rounded-md border border-dashed border-zinc-700/40 bg-zinc-900/20"
                />
              ))}
            </div>
          )}

          {/* Pot Display - smaller, under cards */}
          <div className="absolute top-[52%] left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-25">
            <div className="px-2.5 py-1 rounded-xl bg-black/90 backdrop-blur-sm border border-primary/25 shadow-lg">
              <span className="text-[7px] text-zinc-500 uppercase tracking-widest font-medium">Pot</span>
              <p className="text-lg font-black text-primary text-center leading-none">
                {potSize}
                <span className="text-[11px] font-bold text-primary/70">bb</span>
              </p>
            </div>
          </div>

          {/* Hero Position - firmly below table */}
          <div className="absolute left-1/2 bottom-[-18%] -translate-x-1/2 z-15 flex flex-col items-center">
            <div className="px-3 py-1 rounded-full bg-gradient-to-r from-primary/80 to-primary border border-primary/50 shadow-lg shadow-primary/30">
              <span className="text-[10px] font-black text-primary-foreground tracking-wide">{heroPosition} (YOU)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Action Description */}
      <div className="shrink-0 w-full px-3 mb-2">
        <div className="bg-white/5 backdrop-blur-sm rounded-lg px-3 py-1.5 border border-white/10">
          <p className="text-[11px] text-center text-foreground/80 leading-snug">{action}</p>
        </div>
      </div>

      <div className="shrink-0 flex flex-col items-center">
        <div className="flex items-center gap-2 p-2 rounded-xl bg-gradient-to-b from-white/10 to-white/5 backdrop-blur-sm border border-white/10 shadow-xl">
          <PlayingCard card={heroHand[0]} size="lg" />
          <PlayingCard card={heroHand[1]} size="lg" />
        </div>
      </div>
    </div>
  )
}
