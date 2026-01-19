"use client"

import * as React from "react"
import { PlayingCard } from "./playing-card"
import type { HandScenario, Player } from "@/lib/mock-data"
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
  dealerIsHero: boolean
  street: HandScenario["street"]
  villainThinking?: boolean
}

function parseStreetAction(s: string): { type: 'bet' | 'check' | 'none'; size?: number } {
  if (!s) return { type: 'none' }
  const betMatch = s.match(/bet[s]?\s+(\d+)/i)
  if (betMatch) return { type: 'bet', size: Number(betMatch[1]) }
  if (/check[s]?/i.test(s)) return { type: 'check' }
  return { type: 'none' }
}

// Positions are percentages from center, laid out evenly every 45° around a
// single ellipse. Hero / blinds seats are pulled slightly inward so their
// badges and bet labels sit clearly on the felt.
const SEAT_POSITIONS: Record<string, { angle: number; radiusX: number; radiusY: number }> = {
  // Even 45° steps around the ellipse, tuned for portrait
  BTN:  { angle: 0,    radiusX: 39, radiusY: 39 },   // right
  CO:   { angle: -45,  radiusX: 39, radiusY: 39 },   // top-right
  MP:   { angle: -90,  radiusX: 39, radiusY: 39 },   // top
  UTG:  { angle: -135, radiusX: 39, radiusY: 39 },   // top-left
  EP:   { angle: 180,  radiusX: 39, radiusY: 39 },   // left
  SB:   { angle: 135,  radiusX: 39, radiusY: 39 },   // bottom-left
  HERO: { angle: 90,   radiusX: 39, radiusY: 39 },   // bottom (hero)
  BB:   { angle: 45,   radiusX: 39, radiusY: 39 },   // bottom-right
}

function getAvatarPositionStyle(position: string) {
  const seat = SEAT_POSITIONS[position]
  if (!seat) return { left: "50%", top: "50%" }

  const angleRad = (seat.angle * Math.PI) / 180
  const x = 50 + seat.radiusX * Math.cos(angleRad)
  const y = 50 + seat.radiusY * Math.sin(angleRad)

  return { left: `${x}%`, top: `${y}%` }
}

function getChipPositionStyle(position: string) {
  const seat = SEAT_POSITIONS[position]
  if (!seat) return { left: "50%", top: "50%" }

  const angleRad = (seat.angle * Math.PI) / 180
  const factor = 0.72
  const x = 50 + seat.radiusX * factor * Math.cos(angleRad)
  const y = 50 + seat.radiusY * factor * Math.sin(angleRad)

  return { left: `${x}%`, top: `${y}%` }
}

function getDominantDenom(value: number) {
  const v = Math.max(1, Math.round(value || 1))
  const denoms = [100, 50, 25, 10, 5, 1]
  for (const d of denoms) {
    if (v >= d) return d
  }
  return 1
}

function getChipGradientClasses(denom: number) {
  switch (denom) {
    case 1:
      return "bg-gradient-to-b from-sky-400 to-sky-600"
    case 5:
      return "bg-gradient-to-b from-rose-400 to-rose-600"
    case 10:
      return "bg-gradient-to-b from-emerald-400 to-emerald-600"
    case 25:
      return "bg-gradient-to-b from-violet-400 to-violet-600"
    case 50:
      return "bg-gradient-to-b from-amber-300 to-amber-500"
    case 100:
      return "bg-gradient-to-b from-slate-300 to-slate-600"
    default:
      return "bg-gradient-to-b from-sky-400 to-sky-600"
  }
}

function renderChipStack(amount: number, size: "sm" | "md" | "lg" = "sm") {
  const v = Math.max(1, Math.round(amount || 1))
  const denoms = [100, 50, 25, 10, 5, 1]
  let remain = v
  const parts: { denom: number; count: number }[] = []
  for (const d of denoms) {
    const c = Math.floor(remain / d)
    if (c > 0) {
      parts.push({ denom: d, count: c })
      remain -= c * d
    }
  }

  const box = size === "lg" ? "w-10 h-10" : size === "md" ? "w-8 h-8" : "w-7 h-7"
  const disc = size === "lg" ? 22 : size === "md" ? 18 : 16

  return (
    <div className={cn("relative", box)}>
      {parts.map((p, i) => (
        <div
          key={`${p.denom}-${i}`}
          className={cn(
            "absolute rounded-full border border-white/50 shadow-md overflow-hidden",
            getChipGradientClasses(p.denom),
          )}
          style={{ left: i * (disc / 2.2), bottom: i * (disc / 4), width: disc, height: disc }}
        >
          <div className="absolute inset-0 rounded-full opacity-35 bg-[repeating-conic-gradient(rgba(255,255,255,0.6)_0deg,rgba(255,255,255,0.6)_10deg,transparent_10deg,transparent_25deg)] mix-blend-overlay pointer-events-none" />
          <div className="absolute inset-[3px] rounded-full bg-neutral-900/90 ring-1 ring-white/20" />
        </div>
      ))}
    </div>
  )
}

export function PokerTable({
  heroPosition,
  heroHand,
  board,
  potSize,
  action,
  stackDepth,
  players,
  heroAction,
  heroActionSizeBb,
  blinds,
  dealerIsHero,
  street,
  villainThinking,
}: PokerTableProps) {
  // We no longer render the hero as a seat on the table – hero is always
  // represented in the dedicated bottom section. Table seats are villains only.
  const tablePlayers = players.filter((p) => p.position !== heroPosition)

  const [sbAmountRaw, bbAmountRaw] = blinds.split("/")
  const sbAmount = Number(sbAmountRaw) || 1
  const bbAmount = Number(bbAmountRaw) || 2

  // Identify a primary active villain for simple entry animations
  const activeVillain = tablePlayers.find((p) => p.isActive && !p.isFolded)
  const villainFacingBet =
    activeVillain?.betAmount !== undefined && activeVillain.betAmount > 0
  const villainChecked = !!activeVillain && !villainFacingBet
  const heroBetting = !!heroAction && ["bet", "raise", "call"].includes(heroAction)
  const heroChecking = heroAction === "check"
  const VILLAIN_DECISION_DELAY_S = 0.6
  const displayedVillain =
    activeVillain || tablePlayers.find((p) => !p.isFolded) || tablePlayers[0] || null

  const parsedAction = parseStreetAction(action)
  const villainActingThisStreet = parsedAction.type === "bet" || parsedAction.type === "check"

  // Track previous board size to animate only newly revealed cards (peel effect)
  const prevBoardCountRef = React.useRef<number>(board?.length || 0)
  const currentBoardCount = board?.length || 0
  const previousBoardCount = prevBoardCountRef.current
  const newStartIndex = previousBoardCount < currentBoardCount ? previousBoardCount : currentBoardCount
  React.useEffect(() => {
    prevBoardCountRef.current = currentBoardCount
  }, [currentBoardCount])

  return (
    <div className="flex flex-col items-center w-full h-full">
      <div className="flex-1 w-full flex items-center justify-center min-h-0 py-1">
        <div className="relative w-[96vw] max-w-[520px] aspect-[1/1.4]">
          {/* Outer rail - wood-like */}
          <div className="absolute inset-0 rounded-[50%] bg-gradient-to-b from-amber-800 via-amber-900 to-stone-950 shadow-[0_14px_44px_rgba(0,0,0,0.6)]" />

          {/* Inner rail highlight */}
          <div className="absolute inset-[3px] rounded-[50%] bg-gradient-to-b from-amber-900 to-stone-900" />

          {/* Felt surface - rich green */}
          <div className="absolute inset-[6px] rounded-[50%] bg-gradient-to-br from-emerald-800 via-emerald-900 to-emerald-950 border border-emerald-800/40 shadow-[inset_0_0_90px_rgba(0,0,0,0.9)]">
            {/* Subtle center glow */}
            <div className="absolute inset-0 rounded-[50%] bg-[radial-gradient(ellipse_at_center,rgba(16,185,129,0.12)_0%,transparent_62%)]" />
            <div className="absolute inset-[9%] rounded-[50%] ring-1 ring-emerald-400/15 shadow-[inset_0_0_26px_rgba(16,185,129,0.14)] pointer-events-none" />
          </div>

          {/* Single opponent rendered at the opposite side (top center) */}
          {displayedVillain && (
            <div className="absolute inset-0">
              {(() => {
                // Force opponent avatar to top-center seat for heads-up layout
                const avatarStyle = getAvatarPositionStyle("MP")
                const chipStyle = getChipPositionStyle("MP")
                const isActive = displayedVillain === activeVillain
                const parsed = parseStreetAction(action)
                const showThinking = !!villainThinking
                const showBet = !showThinking && isActive && (villainFacingBet || parsed.type === 'bet')
                const showCheck = !showThinking && isActive && !villainFacingBet && parsed.type === 'check'

                return (
                  <>
                    {/* Opponent avatar on the rail */}
                    <div
                      className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-20"
                      style={avatarStyle}
                    >
                      <div
                        className={cn(
                          "relative w-14 h-14 rounded-full flex items-center justify-center text-[13px] font-bold border-2 shadow-xl transition-all",
                          displayedVillain.isFolded
                            ? "bg-zinc-800/90 border-zinc-700/50 text-zinc-500 opacity-60"
                            : "bg-gradient-to-b from-zinc-700 to-zinc-800 border-zinc-600/50 text-zinc-200",
                          !displayedVillain.isFolded && "ring-2 ring-primary/50",
                          (showBet || showCheck || showThinking) && "ring-red-500 animate-pulse",
                        )}
                      >
                        <div className="flex flex-col items-center leading-tight">
                          <span className="text-[12px] font-bold">
                            {showThinking ? "..." : showBet ? "BET" : showCheck ? "CHECK" : displayedVillain.position}
                          </span>
                          {!displayedVillain.isFolded && (
                            <span className="text-[10px] font-semibold opacity-90 mt-0.5">{displayedVillain.stack}bb</span>
                          )}
                        </div>
                        {!dealerIsHero && (
                          <div className="absolute -left-1 -top-1 w-5 h-5 rounded-full bg-white text-black text-[9px] font-black flex items-center justify-center shadow-md border border-zinc-300">
                            D
                          </div>
                        )}
                        {!displayedVillain.isFolded && (
                          <div className="absolute -right-7 top-1/2 -translate-y-1/2 flex">
                            <div className="w-6 h-9 rounded-[5px] border border-white/15 bg-gradient-to-br from-[#0a0f1a] to-[#0b1220] relative overflow-hidden shadow rotate-[-12deg]">
                              <div className="absolute inset-0 opacity-15 bg-[repeating-linear-gradient(45deg,rgba(255,255,255,0.45)_0,rgba(255,255,255,0.45)_2px,transparent_2px,transparent_5px)]" />
                              <div className="absolute inset-[3px] rounded-[4px] ring-1 ring-white/15" />
                            </div>
                            <div className="w-6 h-9 -ml-3 rounded-[5px] border border-white/15 bg-gradient-to-br from-[#0a0f1a] to-[#0b1220] relative overflow-hidden shadow rotate-[-4deg]">
                              <div className="absolute inset-0 opacity-15 bg-[repeating-linear-gradient(45deg,rgba(255,255,255,0.45)_0,rgba(255,255,255,0.45)_2px,transparent_2px,transparent_5px)]" />
                              <div className="absolute inset-[3px] rounded-[4px] ring-1 ring-white/15" />
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Signature face-down cards to indicate in-hand */}
                      {false && !displayedVillain.isFolded && (
                        <div className="mt-1 flex gap-1.5">
                          <div className="w-6 h-9 rounded-[5px] border border-indigo-300/40 bg-gradient-to-br from-indigo-800 to-slate-900 relative overflow-hidden shadow">
                            <div className="absolute inset-0 opacity-20 bg-[repeating-linear-gradient(45deg,rgba(255,255,255,0.6)_0,rgba(255,255,255,0.6)_2px,transparent_2px,transparent_5px)]" />
                            <div className="absolute inset-[3px] rounded-[4px] ring-1 ring-white/10" />
                          </div>
                          <div className="w-6 h-9 rounded-[5px] border border-indigo-300/40 bg-gradient-to-br from-indigo-800 to-slate-900 relative overflow-hidden shadow">
                            <div className="absolute inset-0 opacity-20 bg-[repeating-linear-gradient(45deg,rgba(255,255,255,0.6)_0,rgba(255,255,255,0.6)_2px,transparent_2px,transparent_5px)]" />
                            <div className="absolute inset-[3px] rounded-[4px] ring-1 ring-white/10" />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Opponent blinds/bets on the felt */}
                    <div
                      className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-10"
                      style={chipStyle}
                    >
                      <div className={cn("px-1.5 py-0.5 rounded text-[10px] font-semibold", "text-transparent")}>.</div>
                      {isActive && villainFacingBet && !displayedVillain.isFolded && !villainThinking && (
                        <div className="mt-1 relative flex items-end gap-1.5">
                          {renderChipStack(displayedVillain.betAmount ?? 1, "sm")}
                          <div
                            className="px-1.5 py-0.5 rounded-full bg-red-500/20 border border-red-400/50 text-[10px] font-bold text-red-200 shadow-sm"
                            style={
                              isActive && villainFacingBet
                                ? { animation: `chip-bet 0.6s ease-out ${VILLAIN_DECISION_DELAY_S}s`, animationFillMode: "both" }
                                : undefined
                            }
                          >
                            {`${displayedVillain.betAmount}bb`}
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                )
              })()}
            </div>
          )}

          {/* Hero seat - always at bottom-center of the table felt */}
          <div
            className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-10"
            style={getAvatarPositionStyle("HERO")}
          >
            {/** When hero acts, temporarily swap label to BET/CHECK instead of YOU. */}
            <div
              className={cn(
                "relative w-14 h-14 rounded-full flex items-center justify-center text-[11px] font-bold border-2 border-primary/70 bg-gradient-to-b from-primary/50 to-primary/30 text-primary-foreground shadow-xl shadow-primary/30",
                (heroBetting || heroChecking) && "animate-pulse",
              )}
            >
              {dealerIsHero && (
                <div className="absolute -right-1 -top-1 w-5 h-5 rounded-full bg-white text-black text-[9px] font-black flex items-center justify-center shadow-md border border-zinc-300">
                  D
                </div>
              )}
              <div className="flex flex-col items-center leading-tight">
                <span className="text-[12px] font-bold tracking-wide">
                  {heroBetting ? "BET" : heroChecking ? "CHECK" : "YOU"}
                </span>
                <span className="text-[10px] font-semibold opacity-90 mt-0.5">{stackDepth}bb</span>
              </div>
            </div>
            {/* Hero hole cards directly under hero icon, below the table line */}
            
            {heroAction && ["bet", "raise", "call"].includes(heroAction) && heroActionSizeBb && (
              <div
                className="mt-1 text-[11px] font-bold text-primary drop-shadow-[0_0_6px_rgba(5,150,105,0.45)]"
                style={{ animation: "chip-bet 0.35s ease-out" }}
              >
                {heroAction.toUpperCase()} {heroActionSizeBb.toFixed(1)}bb
              </div>
            )}
            {/* External hero CHECK label removed; hero chip label already shows CHECK */}
          </div>

          {/* Preflop blind chip overlays removed per request */}

          {/* Community Cards - centered on the felt */}
          {board && board.length > 0 && (
            <div className="absolute top-[37%] left-1/2 -translate-x-1/2 -translate-y-1/2 flex gap-2 z-10 drop-shadow-[0_10px_20px_rgba(0,0,0,0.45)]">
              {board.map((card, i) => {
                const isNew = i >= newStartIndex
                const delayMs = isNew ? (i - newStartIndex) * 120 : 0
                return (
                  <div
                    key={i}
                    className={cn(isNew && "animate-card-peel")}
                    style={isNew ? { animationDelay: `${delayMs}ms` } : undefined}
                  >
                    <PlayingCard card={card} size="lg" />
                  </div>
                )
              })}
              {Array.from({ length: 5 - board.length }).map((_, i) => (
                <div
                  key={`empty-${i}`}
                  className="w-16 h-24 rounded-md border border-dashed border-zinc-700/40 bg-zinc-900/20"
                />
              ))}
            </div>
          )}

          {/* Pot Display - simple text, slightly above hero seat */}
          <div className="absolute top-[62%] left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center justify-center z-20 text-center">
            <span className="text-[12px] font-semibold tracking-[0.18em] text-zinc-300 uppercase leading-none">
              Pot
            </span>
            <p className="mt-1 text-2xl font-semibold tracking-tight text-primary drop-shadow-[0_0_6px_rgba(0,0,0,0.7)]">
              {potSize}
              <span className="ml-1 text-base font-medium text-primary/80">bb</span>
            </p>
            <p className="mt-0.5 text-[10px] text-zinc-200/85">
              Blinds {sbAmount}/{bbAmount}
            </p>
            {/* Chip animation into the pot whenever someone bets/raises/calls */}
            {(((villainFacingBet && !villainThinking) || heroBetting)) && (
              <div className="mt-1 flex gap-1">
                {villainFacingBet && (
                  <div
                    className={cn(
                      "chip-token relative rounded-full border border-white/50 shadow-md",
                      getChipGradientClasses(getDominantDenom(activeVillain?.betAmount || 1)),
                    )}
                    style={{ animation: "chip-into-pot 1.5s ease-out", transform: `scale(${1 + Math.min(0.3, Math.max(0, (Math.round(activeVillain?.betAmount || 1) - 1) / 20))})` }}
                  >
                    <div className="absolute inset-0 rounded-full opacity-35 bg-[repeating-conic-gradient(rgba(255,255,255,0.6)_0deg,rgba(255,255,255,0.6)_10deg,transparent_10deg,transparent_25deg)] mix-blend-overlay pointer-events-none" />
                    <div className="absolute inset-[3px] rounded-full bg-neutral-900/90 ring-1 ring-white/20" />
                  </div>
                )}
                {heroBetting && (
                  <div
                    className={cn(
                      "chip-token relative rounded-full border border-white/50 shadow-md",
                      getChipGradientClasses(getDominantDenom(heroActionSizeBb || 1)),
                    )}
                    style={{ animation: "chip-into-pot 0.9s ease-out", transform: `scale(${1 + Math.min(0.25, Math.max(0, ((heroActionSizeBb || 1) - 1) / 24))})` }}
                  >
                    <div className="absolute inset-0 rounded-full opacity-35 bg-[repeating-conic-gradient(rgba(255,255,255,0.6)_0deg,rgba(255,255,255,0.6)_10deg,transparent_10deg,transparent_25deg)] mix-blend-overlay pointer-events-none" />
                    <div className="absolute inset-[3px] rounded-full bg-neutral-900/90 ring-1 ring-white/20" />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="shrink-0 flex items-center justify-center mb-1">
        <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-gradient-to-b from-white/10 to-white/5 backdrop-blur-sm border border-white/10 shadow-2xl">
          <PlayingCard card={heroHand[0]} size="xl" />
          <PlayingCard card={heroHand[1]} size="xl" />
        </div>
      </div>

      {/* Action Description */}
      <div className="shrink-0 w-full px-3 mb-1">
        <div className="bg-white/5 backdrop-blur-sm rounded-lg px-3 py-1.5 border border-white/10">
          <p className="text-[10px] text-center text-muted-foreground/85 mb-0.5">
            {street === "preflop"
              ? `Preflop · Blinds ${sbAmount}/${bbAmount} · Hero ${heroPosition} vs Villain ${displayedVillain?.position ?? ""}`
              : street.charAt(0).toUpperCase() + street.slice(1)}
          </p>
          <p className="text-[11px] text-center text-foreground/80 leading-snug">
            {villainThinking && villainActingThisStreet ? "Villain thinking..." : action}
          </p>
        </div>
      </div>

      {/* Removed separate hero hand section; hero cards now render under the hero icon on the felt */}
    </div>
  )
}
