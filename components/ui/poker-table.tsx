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
  heroAction?: "fold" | "call" | "check" | "bet" | "raise" | null
  heroActionSizeBb?: number | null
}

// Positions are percentages from center, laid out evenly every 45° around a
// single ellipse. All seats share the same radii so spacing is uniform.
const SEAT_POSITIONS: Record<string, { angle: number; radiusX: number; radiusY: number }> = {
  // Even 45° steps around the ellipse, HERO fixed at bottom (90°)
  BTN:  { angle: 0,    radiusX: 46, radiusY: 58 },   // right
  CO:   { angle: -45,  radiusX: 46, radiusY: 58 },   // top-right
  MP:   { angle: -90,  radiusX: 46, radiusY: 58 },   // top
  UTG:  { angle: -135, radiusX: 46, radiusY: 58 },   // top-left
  EP:   { angle: 180,  radiusX: 46, radiusY: 58 },   // left
  SB:   { angle: 135,  radiusX: 46, radiusY: 58 },   // bottom-left
  HERO: { angle: 90,   radiusX: 46, radiusY: 58 },   // bottom (hero)
  BB:   { angle: 45,   radiusX: 46, radiusY: 58 },   // bottom-right
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
  heroAction,
  heroActionSizeBb,
}: PokerTableProps) {
  // We no longer render the hero as a seat on the table – hero is always
  // represented in the dedicated bottom section. Table seats are villains only.
  const tablePlayers = players.filter((p) => p.position !== heroPosition)

  // Identify a primary active villain for simple entry animations
  const activeVillain = tablePlayers.find((p) => p.isActive && !p.isFolded)
  const villainFacingBet =
    activeVillain?.betAmount !== undefined && activeVillain.betAmount > 0
  const villainChecked = !!activeVillain && !villainFacingBet
  const heroBetting = !!heroAction && ["bet", "raise", "call"].includes(heroAction)

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

          {tablePlayers.map((player) => {
            const style = getPositionStyle(player.position)

            return (
              <div
                key={player.position}
                className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-10"
                style={style}
              >
                {/* Player avatar */}
                <div
                  className={cn(
                    "relative w-9 h-9 rounded-full flex items-center justify-center text-[11px] font-bold border-2 shadow-lg transition-all",
                    player.isFolded
                      ? "bg-zinc-800/90 border-zinc-700/50 text-zinc-500"
                      : player.isActive
                        ? "bg-gradient-to-b from-red-500/70 to-red-500/40 border-red-500 text-red-50 shadow-red-500/40"
                        : "bg-gradient-to-b from-zinc-700 to-zinc-800 border-zinc-600/50 text-zinc-200",
                  )}
                >
                  <div className="flex flex-col items-center leading-none">
                    <span className="text-[11px] font-bold">
                      {player.position}
                    </span>
                  </div>
                  {/* Dealer button */}
                  {player.isDealer && (
                    <div className="absolute -right-1 -top-1 w-4 h-4 rounded-full bg-white text-black text-[8px] font-black flex items-center justify-center shadow-md border border-zinc-300">
                      D
                    </div>
                  )}
                </div>
                {/* Stack / status */}
                <div
                  className={cn(
                    "mt-0.5 px-1.5 py-0.5 rounded text-[10px] font-semibold",
                    player.isFolded ? "text-zinc-600" : "bg-black/40 text-zinc-300",
                  )}
                  style={player.isFolded ? { animation: "fold-fade 0.35s ease-out forwards" } : undefined}
                >
                  {player.isFolded ? "Fold" : `${player.stack}bb`}
                </div>
                {/* Current bet if any */}
                {player.betAmount !== undefined && player.betAmount > 0 && !player.isFolded && (
                  <div
                    className="mt-0.5 text-[8px] font-bold text-red-400"
                    style={
                      // Villain opening bet gets a small chip-bet style animation
                      player === activeVillain && villainFacingBet
                        ? { animation: "chip-bet 0.35s ease-out" }
                        : undefined
                    }
                  >
                    {`${player.betAmount}bb`}
                  </div>
                )}
                {/* Check animation */}
                {player === activeVillain && villainChecked && !player.isFolded && (
                  <div
                    className="mt-0.5 text-[8px] font-semibold text-emerald-300"
                    style={{ animation: "check-flash 0.35s ease-out" }}
                  >
                    CHECK
                  </div>
                )}
              </div>
            )
          })}

          {/* Hero seat - always at bottom-center of the table felt, on the same ellipse */}
          <div
            className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-10"
            style={getPositionStyle("HERO")}
          >
            <div className="relative w-10 h-10 rounded-full flex items-center justify-center text-[10px] font-bold border-2 border-primary/70 bg-gradient-to-b from-primary/50 to-primary/30 text-primary-foreground shadow-lg shadow-primary/30">
              <span className="text-[10px] font-bold tracking-wide">YOU</span>
            </div>
            <div className="mt-0.5 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-black/60 text-zinc-100">
              {stackDepth}bb
            </div>
            {heroAction && ["bet", "raise", "call"].includes(heroAction) && heroActionSizeBb && (
              <div
                className="mt-0.5 text-[9px] font-bold text-primary"
                style={{ animation: "chip-bet 0.35s ease-out" }}
              >
                {heroAction.toUpperCase()} {heroActionSizeBb.toFixed(1)}bb
              </div>
            )}
            {heroAction === "check" && (
              <div
                className="mt-0.5 text-[9px] font-semibold text-emerald-300"
                style={{ animation: "check-flash 0.35s ease-out" }}
              >
                CHECK
              </div>
            )}
          </div>

          {/* Community Cards - centered on the felt */}
          {board && board.length > 0 && (
            <div className="absolute top-[32%] left-1/2 -translate-x-1/2 -translate-y-1/2 flex gap-1 z-10">
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

          {/* Pot Display - simple text, slightly above hero seat */}
          <div className="absolute top-[55%] left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-20">
            <span className="text-[10px] font-semibold tracking-[0.18em] text-zinc-400 uppercase">
              Pot
            </span>
            <p className="mt-0.5 text-lg font-semibold tracking-tight text-primary drop-shadow-[0_0_6px_rgba(0,0,0,0.7)]">
              {potSize}
              <span className="ml-1 text-sm font-medium text-primary/80">bb</span>
            </p>
            {/* Chip animation into the pot whenever someone bets/raises/calls */}
            {(villainFacingBet || heroBetting) && (
              <div className="mt-1 flex gap-1">
                {villainFacingBet && (
                  <div
                    className="chip-token bg-primary/80"
                    style={{ animation: "chip-into-pot 0.45s ease-out" }}
                  />
                )}
                {heroBetting && (
                  <div
                    className="chip-token bg-emerald-400"
                    style={{ animation: "chip-into-pot 0.45s ease-out" }}
                  />
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Action Description */}
      <div className="shrink-0 w-full px-3 mb-1">
        <div className="bg-white/5 backdrop-blur-sm rounded-lg px-3 py-1.5 border border-white/10">
          <p className="text-[11px] text-center text-foreground/80 leading-snug">{action}</p>
        </div>
      </div>

      {/* Hero hand under the table */}
      <div className="shrink-0 flex flex-col items-center mb-1">
        <div className="flex items-center gap-2 mb-1">
          <div className="px-2 py-0.5 rounded-full bg-primary/10 border border-primary/40 text-[10px] font-semibold text-primary uppercase tracking-wide">
            YOU
          </div>
          <span className="text-[10px] font-medium text-muted-foreground">Hand</span>
        </div>
        <div className="flex items-center gap-2 p-2 rounded-xl bg-gradient-to-b from-white/10 to-white/5 backdrop-blur-sm border border-white/10 shadow-xl">
          <PlayingCard card={heroHand[0]} size="lg" />
          <PlayingCard card={heroHand[1]} size="lg" />
        </div>
      </div>
    </div>
  )
}
