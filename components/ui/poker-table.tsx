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
      <div className="shrink-0 flex items-center justify-center gap-3 w-full mb-3">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-sm border border-white/20">
          <span className="text-[10px] text-slate-400 font-medium">Blinds</span>
          <span className="text-xs font-bold text-white">{blinds}</span>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-violet-500/20 to-purple-500/10 backdrop-blur-sm border border-violet-500/30">
          <span className="text-[10px] text-violet-400 font-medium">Stack</span>
          <span className="text-xs font-bold text-violet-300">{stackDepth}bb</span>
        </div>
      </div>

      <div className="flex-1 w-full flex items-center justify-center min-h-0 py-2">
        <div className="relative w-full max-w-[340px] aspect-[1.6/1]">
          {/* Outer shadow ring */}
          <div className="absolute inset-0 rounded-[50%] bg-gradient-to-br from-slate-800 via-slate-900 to-black shadow-2xl" />
          
          {/* Outer rail - premium wood look */}
          <div className="absolute inset-[2px] rounded-[50%] bg-gradient-to-br from-amber-900 via-amber-800 to-amber-900 shadow-inner" />
          
          {/* Inner rail highlight */}
          <div className="absolute inset-[4px] rounded-[50%] bg-gradient-to-br from-amber-800 to-amber-900" />
          
          {/* Rail edge highlight */}
          <div className="absolute inset-[6px] rounded-[50%] bg-gradient-to-br from-amber-700/50 to-transparent" />
          
          {/* Felt surface - premium poker felt */}
          <div className="absolute inset-[8px] rounded-[50%] bg-gradient-to-br from-emerald-900 via-emerald-950 to-emerald-900 border border-amber-800/30 shadow-[inset_0_0_80px_rgba(0,0,0,0.9)]">
            {/* Subtle center glow */}
            <div className="absolute inset-0 rounded-[50%] bg-[radial-gradient(ellipse_at_center,rgba(168,85,247,0.05)_0%,transparent_70%)]" />
            {/* Felt texture overlay */}
            <div className="absolute inset-0 rounded-[50%] bg-gradient-to-br from-transparent via-emerald-800/10 to-emerald-900/20" />
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
                    "relative w-10 h-10 rounded-full flex items-center justify-center text-[10px] font-bold border-2 shadow-xl transition-all duration-200 hover:scale-105",
                    player.isFolded
                      ? "bg-slate-800/90 border-slate-700/50 text-slate-500"
                      : player.isActive
                        ? "bg-gradient-to-br from-violet-500/40 to-purple-500/20 border-violet-500/60 text-violet-300 shadow-violet-500/30 animate-pulse"
                        : "bg-gradient-to-br from-slate-700 to-slate-800 border-slate-600/50 text-slate-200",
                  )}
                >
                  {player.position}
                  {/* Dealer button */}
                  {player.isDealer && (
                    <div className="absolute -right-1 -top-1 w-5 h-5 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 text-black text-[8px] font-black flex items-center justify-center shadow-lg border border-amber-300">
                      D
                    </div>
                  )}
                </div>
                {/* Stack/status */}
                <div
                  className={cn(
                    "mt-1 px-2 py-1 rounded-lg text-[9px] font-semibold backdrop-blur-sm border",
                    player.isFolded 
                      ? "text-slate-600 bg-slate-900/50 border-slate-800/50" 
                      : "bg-black/60 text-slate-300 border-white/10",
                  )}
                >
                  {player.isFolded ? "Fold" : `${player.stack}bb`}
                </div>
                {/* Current bet if any */}
                {player.betAmount && player.betAmount > 0 && !player.isFolded && (
                  <div className="mt-1 px-2 py-0.5 text-[8px] font-bold text-violet-400 bg-violet-500/20 rounded-lg border border-violet-500/30">
                    {player.betAmount}bb
                  </div>
                )}
              </div>
            )
          })}

          <div className="absolute left-1/2 bottom-[3%] -translate-x-1/2 z-20 flex flex-col items-center">
            <div className="px-4 py-2 rounded-full bg-gradient-to-r from-violet-500/90 to-purple-600/90 border border-violet-400/50 shadow-xl shadow-violet-500/30 backdrop-blur-sm">
              <span className="text-[10px] font-black text-white tracking-wide">{heroPosition} (YOU)</span>
            </div>
          </div>

          {/* Pot Display - centered */}
          <div className="absolute top-[55%] left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
            <div className="px-4 py-2.5 rounded-2xl bg-gradient-to-br from-black/80 to-black/60 backdrop-blur-xl border border-violet-500/20 shadow-2xl">
              <span className="text-[8px] text-slate-500 uppercase tracking-widest font-medium">Pot</span>
              <p className="text-2xl font-black text-violet-400 text-center leading-none">
                {potSize}
                <span className="text-xs font-bold text-violet-500/70 ml-1">bb</span>
              </p>
            </div>
          </div>

          {/* Community Cards - positioned above pot */}
          {board && board.length > 0 && (
            <div className="absolute top-[25%] left-1/2 -translate-x-1/2 flex gap-1.5">
              {board.map((card, i) => (
                <div key={i} className="transform hover:scale-105 transition-transform duration-200">
                  <PlayingCard card={card} size="sm" />
                </div>
              ))}
              {Array.from({ length: 5 - board.length }).map((_, i) => (
                <div
                  key={`empty-${i}`}
                  className="w-8 h-11 rounded-lg border border-dashed border-slate-700/40 bg-slate-900/20"
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Action Description */}
      <div className="shrink-0 w-full px-4 mb-3">
        <div className="bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-sm rounded-2xl px-4 py-2.5 border border-white/10">
          <p className="text-[11px] text-center text-slate-300 leading-snug font-medium">{action}</p>
        </div>
      </div>

      <div className="shrink-0 flex flex-col items-center">
        <div className="flex items-center gap-3 p-3 rounded-2xl bg-gradient-to-br from-white/15 to-white/5 backdrop-blur-xl border border-white/20 shadow-2xl">
          <PlayingCard card={heroHand[0]} size="lg" />
          <PlayingCard card={heroHand[1]} size="lg" />
        </div>
      </div>
    </div>
  )
}
