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
  const active = opponents.find((p) => !p.isFolded) ?? opponents[0]
  return active
}

function PlayerAvatar({ active = false, name }: { active?: boolean; name: string }) {
  return (
    <div className="flex flex-col items-center">
      <div
        className={cn(
          "relative w-12 h-12 rounded-full grid place-items-center shadow-2xl",
          active ? "shadow-emerald-500/25" : "shadow-black/30",
        )}
      >
        <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_30%_25%,rgba(255,255,255,0.25)_0%,rgba(255,255,255,0.00)_45%),linear-gradient(180deg,rgba(16,185,129,0.55)_0%,rgba(2,44,34,0.35)_65%,rgba(0,0,0,0.55)_100%)]" />
        <div className="absolute inset-0 rounded-full ring-2 ring-emerald-300/20" />
        {active ? <div className="absolute -inset-1 rounded-full blur-xl bg-emerald-400/15" /> : null}
        <div className="absolute inset-[2px] rounded-full bg-black/15" />
        <svg viewBox="0 0 24 24" className="w-6 h-6 relative text-zinc-50" aria-hidden>
          <path
            fill="currentColor"
            d="M12 12c2.76 0 5-2.24 5-5S14.76 2 12 2 7 4.24 7 7s2.24 5 5 5zm0 2c-4.42 0-8 2.24-8 5v1h16v-1c0-2.76-3.58-5-8-5z"
          />
        </svg>
      </div>
      <div className="mt-1 px-2 py-0.5 rounded-full bg-black/35 border border-emerald-200/10 text-[10px] font-extrabold tracking-wide text-zinc-100">
        {name}
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
  const opponent = pickSingleOpponent(players, heroPosition)

  return (
    <div className="flex flex-col items-center w-full h-full">
      <div className="flex-1 w-full flex items-center justify-center min-h-0 py-1">
        <div className="relative w-full max-w-[420px] aspect-[0.72/1]">
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
              {opponent ? (
                <div className="flex flex-col items-center">
                  <PlayerAvatar active={!!opponent.isActive && !opponent.isFolded} name="Opponent" />
                  <div
                    className={cn(
                      "mt-1 px-2 py-0.5 rounded text-[10px] font-semibold",
                      opponent.isFolded ? "text-zinc-600" : "bg-black/40 text-zinc-300",
                    )}
                  >
                    {opponent.isFolded ? "Fold" : `${opponent.stack}bb`}
                  </div>
                  {opponent.currentBet && opponent.currentBet > 0 && !opponent.isFolded && (
                    <div className="mt-0.5 text-[9px] font-bold text-emerald-300">{opponent.currentBet}bb</div>
                  )}
                </div>
              ) : (
                <div />
              )}
            </div>

            {/* Middle zone */}
            <div className="relative flex flex-col items-center justify-center">
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
              <PlayerAvatar active name="You" />
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
        <div className="relative h-[108px] w-[160px]">
          <PlayingCard card={heroHand[0]} size="xl" className="absolute left-0 top-0 rotate-[-8deg]" outlined />
          <PlayingCard card={heroHand[1]} size="xl" className="absolute left-[46px] top-[4px] rotate-[8deg]" outlined />
        </div>
      </div>
    </div>
  )
}
