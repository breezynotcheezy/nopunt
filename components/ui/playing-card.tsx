"use client"

import { cn } from "@/lib/utils"

interface PlayingCardProps {
  card: string
  size?: "xs" | "sm" | "md" | "lg" | "xl"
  className?: string
}

const suitColors: Record<string, { text: string; glow: string }> = {
  h: { text: "text-rose-500", glow: "drop-shadow-[0_0_6px_rgba(244,63,94,0.4)]" },
  d: { text: "text-rose-500", glow: "drop-shadow-[0_0_6px_rgba(244,63,94,0.4)]" },
  s: { text: "text-zinc-800", glow: "" },
  c: { text: "text-zinc-800", glow: "" },
}

const suitSymbols: Record<string, string> = {
  h: "♥",
  d: "♦",
  s: "♠",
  c: "♣",
}

export function PlayingCard({ card, size = "md", className }: PlayingCardProps) {
  const rank = card.slice(0, -1)
  const suit = card.slice(-1).toLowerCase()
  const colors = suitColors[suit] || { text: "text-zinc-800", glow: "" }
  const suitSymbol = suitSymbols[suit] || suit

  const sizeClasses = {
    xs: "w-7 h-9",
    sm: "w-9 h-12",
    md: "w-12 h-16",
    lg: "w-16 h-22",
    xl: "w-20 h-28",
  }

  const fontSizes = {
    xs: { rank: "text-[10px]", suit: "text-[8px]", center: "text-sm" },
    sm: { rank: "text-[13px]", suit: "text-[11px]", center: "text-base" },
    md: { rank: "text-lg", suit: "text-[13px]", center: "text-xl" },
    lg: { rank: "text-2xl", suit: "text-sm", center: "text-3xl" },
    xl: { rank: "text-3xl", suit: "text-base", center: "text-4xl" },
  }

  return (
    <div
      className={cn(
        "relative rounded-xl overflow-hidden",
        // Card surface
        "bg-gradient-to-br from-white via-neutral-50 to-neutral-200",
        // Outer border + soft inner border
        "border border-neutral-300/90",
        "shadow-[0_4px_18px_rgba(0,0,0,0.28)]",
        sizeClasses[size],
        className,
      )}
    >
      {/* Subtle inner border */}
      <div className="absolute inset-[2px] rounded-lg border border-white/60/50 pointer-events-none" />

      {/* Top left corner */}
      <div className={cn("absolute top-1 left-1.5 flex flex-col items-center leading-none z-10", colors.text)}>
        <span className={cn("font-extrabold tracking-tight", fontSizes[size].rank)}>{rank}</span>
        <span className={cn("font-semibold -mt-0.5", fontSizes[size].suit)}>{suitSymbol}</span>
      </div>

      {/* Center pip */}
      <div
        className={cn(
          "absolute inset-0 flex items-center justify-center z-0",
          colors.text,
          colors.glow,
        )}
      >
        <span className={cn("font-semibold", fontSizes[size].center)}>{suitSymbol}</span>
      </div>

      {/* Bottom right corner (rotated) */}
      <div
        className={cn(
          "absolute bottom-1 right-1.5 flex flex-col items-center leading-none z-10 rotate-180",
          colors.text,
        )}
      >
        <span className={cn("font-extrabold tracking-tight", fontSizes[size].rank)}>{rank}</span>
        <span className={cn("font-semibold -mt-0.5", fontSizes[size].suit)}>{suitSymbol}</span>
      </div>
    </div>
  )
}
