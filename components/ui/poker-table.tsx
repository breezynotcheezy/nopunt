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

function pickSingleOpponent(players: Player[], heroPosition: string): Player | undefined {
  const opponents = players.filter((p) => p.position !== heroPosition)
  console.log('Opponents found:', opponents, 'Hero position:', heroPosition)
  const active = opponents.find((p) => !p.isFolded) ?? opponents[0]
  console.log('Selected opponent:', active)
  return active
}

function CasinoChip({ label, stacked = false }: { label: string; stacked?: boolean }) {
  return (
    <div className="relative h-10 w-16">
      {stacked && (
        <img 
          src="/poker-chip.png" 
          alt="Chip" 
          className="absolute left-0 top-0 w-8 h-8 opacity-80"
        />
      )}
      <img 
        src="/poker-chip.png" 
        alt="Chip" 
        className={cn("absolute w-8 h-8", stacked ? "left-2 top-2" : "left-2 top-0")}
      />
      <div className="absolute right-0 top-3">
        <span className="text-[12px] font-bold text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
          {label}
        </span>
      </div>
    </div>
  )
}

function PlayerAvatar({
  active = false,
  name,
  stackText,
}: {
  active?: boolean
  name: string
  stackText?: string
}) {
  return (
    <div className="flex flex-col items-center">
      <div
        className={cn(
          "relative w-14 h-14 rounded-full grid place-items-center shadow-2xl",
          active ? "shadow-emerald-500/25" : "shadow-black/30",
        )}
      >
        <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_30%_25%,rgba(255,255,255,0.25)_0%,rgba(255,255,255,0.00)_45%),linear-gradient(180deg,rgba(16,185,129,0.55)_0%,rgba(2,44,34,0.35)_65%,rgba(0,0,0,0.55)_100%)]" />
        <div className="absolute inset-0 rounded-full ring-2 ring-emerald-300/20" />
        {active ? <div className="absolute -inset-1 rounded-full blur-xl bg-emerald-400/15" /> : null}
        <div className="absolute inset-[2px] rounded-full bg-black/15" />
        <svg viewBox="0 0 24 24" className="w-7 h-7 relative text-zinc-50" aria-hidden>
          <path
            fill="currentColor"
            d="M12 12c2.76 0 5-2.24 5-5S14.76 2 12 2 7 4.24 7 7s2.24 5 5 5zm0 2c-4.42 0-8 2.24-8 5v1h16v-1c0-2.76-3.58-5-8-5z"
          />
        </svg>
      </div>
      <div className="-mt-1 flex flex-col items-center">
        <div className="px-2 py-0.5 rounded-full bg-black/55 border border-emerald-200/10">
          <span className="text-[10px] font-extrabold tracking-wide text-zinc-100">{name}</span>
        </div>
        {stackText ? (
          <div className="-mt-0.5">
            <span className="text-[12px] font-black text-zinc-100 tabular-nums drop-shadow-[0_1px_0_rgba(0,0,0,0.55)]">
              {stackText}
            </span>
          </div>
        ) : null}
      </div>
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
  blinds,
  players,
}: PokerTableProps) {
  console.log('PokerTable props:', { heroPosition, players, potSize, action })
  const opponent = pickSingleOpponent(players, heroPosition)
  console.log('Final opponent:', opponent)
  const heroBlindKind = heroPosition === "SB" ? ("sb" as const) : heroPosition === "BB" ? ("bb" as const) : null
  const oppBlindKind = opponent?.position === "SB" ? ("sb" as const) : opponent?.position === "BB" ? ("bb" as const) : null
  const isPreflop = !board || board.length === 0
  const blindText = (kind: "sb" | "bb") => (kind === "sb" ? "0.5BB" : "1BB")

  return (
    <div className="flex flex-col items-center w-full h-full">
      <div className="flex-1 w-full flex items-center justify-center min-h-0 py-1">
        <div className="relative w-full max-w-[420px] aspect-[0.72/1] drop-shadow-[0_22px_55px_rgba(0,0,0,0.65)]">
          {/* Portrait-friendly oval table */}
          <div className="absolute inset-0 rounded-[999px] bg-[linear-gradient(180deg,rgba(120,83,33,1)_0%,rgba(54,33,16,1)_38%,rgba(10,10,10,1)_100%)] shadow-2xl" />
          <div className="absolute inset-[3px] rounded-[999px] bg-[linear-gradient(180deg,rgba(154,111,51,1)_0%,rgba(36,24,14,1)_100%)]" />
          <div className="absolute inset-[7px] rounded-[999px] overflow-hidden border border-emerald-200/10 shadow-[inset_0_0_110px_rgba(0,0,0,0.92)] bg-[radial-gradient(ellipse_at_center,rgba(16,185,129,0.24)_0%,rgba(6,95,70,0.30)_38%,rgba(2,44,34,0.95)_78%,rgba(0,0,0,1)_100%)]">
            <div className="absolute inset-0 rounded-[999px] opacity-25 mix-blend-overlay bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.30)_0%,transparent_46%)]" />
            <div className="absolute inset-0 rounded-[999px] opacity-35 bg-[radial-gradient(ellipse_at_center,rgba(34,197,94,0.18)_0%,transparent_62%)]" />
          </div>

          <div className="absolute inset-[10px] grid grid-rows-[auto_1fr_auto] items-center">
            {/* Top zone */}
            <div className="flex items-start justify-center pt-1">
              <div className="flex flex-col items-center">
                <div className="relative">
                  <PlayerAvatar
                    active={!!opponent?.isActive && !opponent?.isFolded}
                    name="Opponent"
                    stackText={opponent?.isFolded ? "" : `${opponent?.stack || 0}bb`}
                  />
                </div>
              </div>
            </div>

            {/* Middle zone */}
            <div className="relative flex flex-col items-center justify-center">
              {/* Simple pot indicator */}
              <div className="absolute -top-6 left-1/2 -translate-x-1/2">
                <span className="text-[12px] font-black tracking-tight text-zinc-100/90 drop-shadow-[0_2px_10px_rgba(0,0,0,0.55)] tabular-nums">
                  {isPreflop ? "1.5BB" : `${potSize}bb`}
                </span>
              </div>

              {/* Blind chips in front of each player on preflop */}
              {isPreflop && oppBlindKind ? (
                <div className="absolute -top-16 left-1/2 -translate-x-1/2">
                  <CasinoChip label={blindText(oppBlindKind)} stacked={oppBlindKind === "bb"} />
                </div>
              ) : null}
              {isPreflop && heroBlindKind ? (
                <div className="absolute top-16 left-1/2 -translate-x-1/2">
                  <CasinoChip label={blindText(heroBlindKind)} stacked={heroBlindKind === "bb"} />
                </div>
              ) : null}

              {board && board.length > 0 ? (
                <div className="flex gap-1.5">
                  {board.map((card, i) => (
                    <PlayingCard key={i} card={card} size="md" />
                  ))}
                  {Array.from({ length: 5 - board.length }).map((_, i) => (
                    <div
                      key={`empty-${i}`}
                      className="w-[52px] h-[78px] rounded-[14px] border border-dashed border-emerald-200/10 bg-black/20"
                    />
                  ))}
                </div>
              ) : null}
            </div>

            {/* Bottom zone */}
            <div className="flex items-end justify-center pb-2">
              <div className="relative">
                <PlayerAvatar active name="You" stackText={`${stackDepth}bb`} />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="shrink-0 flex flex-col items-center">
        <div className="relative h-[108px] w-[160px]">
          <PlayingCard card={heroHand[0]} size="xl" className="absolute left-0 top-0 rotate-[-8deg]" outlined />
          <PlayingCard card={heroHand[1]} size="xl" className="absolute left-[46px] top-[4px] rotate-[8deg]" outlined />
        </div>
      </div>
    </div>
  )
}
