"use client"

import { cn } from "@/lib/utils"

interface PlayingCardProps {
  card: string
  size?: "xs" | "sm" | "md" | "lg" | "xl"
  className?: string
  outlined?: boolean
}

const suitColors: Record<string, { text: string }> = {
  h: { text: "text-[#C8102E]" },
  d: { text: "text-[#C8102E]" },
  s: { text: "text-[#0b0d12]" },
  c: { text: "text-[#0b0d12]" },
}

const suitSymbols: Record<string, string> = {
  h: "♥",
  d: "♦",
  s: "♠",
  c: "♣",
}

function SuitIcon({ suit, className }: { suit: string; className?: string }) {
  // All icons fill with currentColor for perfect red/black matching
  if (suit === "h") {
    return (
      <svg viewBox="0 0 24 24" className={className} aria-hidden>
        <path fill="currentColor" d="M12 21s-7-4.6-7-10c0-2.9 2.2-5 5-5 1.1 0 2.2.4 3 1.1 0.8-0.7 1.9-1.1 3-1.1 2.8 0 5 2.1 5 5 0 5.4-7 10-7 10z"/>
      </svg>
    )
  }
  if (suit === "d") {
    return (
      <svg viewBox="0 0 24 24" className={className} aria-hidden>
        <path fill="currentColor" d="M12 2l6 10-6 10-6-10 6-10z"/>
      </svg>
    )
  }
  if (suit === "s") {
    return (
      <svg viewBox="0 0 24 24" className={className} aria-hidden>
        <path fill="currentColor" d="M12 2c-2.5 2.6-7 6.1-7 10.1 0 2.7 2.2 4.9 4.9 4.9.7 0 1.4-.1 2.1-.4-.4 2-1.7 3.6-3.8 4.7h7.6c-2.1-1.1-3.4-2.7-3.8-4.7.7.3 1.4.4 2.1.4 2.7 0 4.9-2.2 4.9-4.9C19 8.1 14.5 4.6 12 2z"/>
      </svg>
    )
  }
  // clubs
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <circle cx="12" cy="7.5" r="4" fill="currentColor"/>
      <circle cx="8.5" cy="12" r="4" fill="currentColor"/>
      <circle cx="15.5" cy="12" r="4" fill="currentColor"/>
      <rect x="11" y="12" width="2" height="8" rx="1" fill="currentColor"/>
    </svg>
  )
}

export function PlayingCard({ card, size = "md", className, outlined = false }: PlayingCardProps) {
  const rank = card.slice(0, -1)
  const suit = card.slice(-1).toLowerCase()
  const colors = suitColors[suit] || { text: "text-zinc-900" }
  const suitSymbol = suitSymbols[suit] || suit

  const sizeClasses = {
    xs: "w-7 h-9",
    sm: "w-9 h-12",
    md: "w-12 h-16",
    lg: "w-16 h-24",
    xl: "w-20 h-28",
  }

  const fontSizes = {
    xs: { rank: "text-[10px]", suit: "text-[8px]", center: "text-sm" },
    sm: { rank: "text-[12px]", suit: "text-[10px]", center: "text-base" },
    md: { rank: "text-[16px]", suit: "text-[12px]", center: "text-lg" },
    lg: { rank: "text-[18px]", suit: "text-[13px]", center: "text-xl" },
    xl: { rank: "text-[20px]", suit: "text-[14px]", center: "text-2xl" },
  }

  const cornerIconSizes: Record<NonNullable<PlayingCardProps['size']>, string> = {
    xs: "w-2.5 h-2.5",
    sm: "w-3 h-3",
    md: "w-3.5 h-3.5",
    lg: "w-4 h-4",
    xl: "w-5 h-5",
  }

  const centerIconSizes: Record<NonNullable<PlayingCardProps['size']>, string> = {
    xs: "w-3.5 h-3.5",
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-6 h-6",
    xl: "w-7 h-7",
  }
  const pipShadow = "drop-shadow-[0_0.5px_0_rgba(0,0,0,0.25)]"

  // Rank helpers and pip layout
  const rankChar = rank
  const rankValue = rank === 'A' ? 1 : rank === 'T' ? 10 : Number.isNaN(Number(rank)) ? null : parseInt(rank, 10)
  const isFace = rank === 'J' || rank === 'Q' || rank === 'K'

  // Pip layout positions (percentages)
  const cols = { left: 30, center: 50, right: 70 }
  const rows = { top: 20, upper: 34, middle: 50, lower: 66, bottom: 80 }

  type Pip = { x: number; y: number; rotate?: boolean }
  const pipsFor = (n: number): Pip[] => {
    switch (n) {
      case 2:
        return [
          { x: cols.center, y: rows.top },
          { x: cols.center, y: rows.bottom, rotate: true },
        ]
      case 3:
        return [
          { x: cols.center, y: rows.top },
          { x: cols.center, y: rows.middle },
          { x: cols.center, y: rows.bottom, rotate: true },
        ]
      case 4:
        return [
          { x: cols.left, y: rows.upper },
          { x: cols.right, y: rows.upper },
          { x: cols.left, y: rows.lower, rotate: true },
          { x: cols.right, y: rows.lower, rotate: true },
        ]
      case 5:
        return [...pipsFor(4), { x: cols.center, y: rows.middle }]
      case 6:
        return [
          { x: cols.left, y: rows.top },
          { x: cols.right, y: rows.top },
          { x: cols.left, y: rows.middle },
          { x: cols.right, y: rows.middle },
          { x: cols.left, y: rows.bottom, rotate: true },
          { x: cols.right, y: rows.bottom, rotate: true },
        ]
      case 7:
        return [...pipsFor(6), { x: cols.center, y: rows.upper }]
      case 8:
        return [...pipsFor(6), { x: cols.center, y: rows.upper }, { x: cols.center, y: rows.lower, rotate: true }]
      case 9:
        return [...pipsFor(8), { x: cols.center, y: rows.middle }]
      case 10:
        return [
          { x: cols.left, y: rows.top },
          { x: cols.right, y: rows.top },
          { x: cols.left, y: rows.upper },
          { x: cols.right, y: rows.upper },
          { x: cols.left, y: rows.middle },
          { x: cols.right, y: rows.middle },
          { x: cols.left, y: rows.lower, rotate: true },
          { x: cols.right, y: rows.lower, rotate: true },
          { x: cols.left, y: rows.bottom, rotate: true },
          { x: cols.right, y: rows.bottom, rotate: true },
        ]
      default:
        return []
    }
  }

  return (
    <div
      className={cn(
        "relative rounded-xl overflow-hidden",
        // White face with subtle warm tint for premium feel
        "bg-gradient-to-br from-white via-white to-zinc-50",
        // Neutral micro border
        outlined ? "border border-zinc-300" : "border border-zinc-200/70",
        // Soft neutral shadow
        "shadow-[0_6px_18px_rgba(0,0,0,0.20)]",
        sizeClasses[size],
        className,
      )}
    >
      {outlined ? (
        <>
          {/* Inner gold inlay and teal glow that respects theme */}
          <div className="absolute inset-px rounded-xl pointer-events-none ring-1 ring-zinc-400/25" />
          <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_top,rgba(0,0,0,0.06)_0%,transparent_46%)]" />
        </>
      ) : null}

      {/* Top left corner */}
      <div className={cn("absolute top-1 left-1.5 flex flex-col items-center leading-none z-10", colors.text)}>
        <span className={cn("font-serif font-black tracking-tight", fontSizes[size].rank)}>{rankChar}</span>
        <SuitIcon suit={suit} className={cn("mt-0.5", colors.text, cornerIconSizes[size], pipShadow)} />
      </div>

      {/* Face / Ace / Numbered center area */}
      <div className={cn("absolute inset-0 z-0", colors.text)}>
        {isFace ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className={cn("font-serif font-black", fontSizes[size].center)}>{rank}</span>
          </div>
        ) : rankValue === 1 ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <SuitIcon suit={suit} className={cn("opacity-95", centerIconSizes[size], pipShadow)} />
          </div>
        ) : rankValue && rankValue >= 2 && rankValue <= 10 ? (
          <div className="absolute inset-0">
            {pipsFor(rankValue).map((p, idx) => (
              <div
                key={idx}
                className={cn("absolute", p.rotate && "rotate-180")}
                style={{ left: `${p.x}%`, top: `${p.y}%`, transform: "translate(-50%, -50%)" }}
              >
                <SuitIcon suit={suit} className={cn(centerIconSizes[size], pipShadow)} />
              </div>
            ))}
          </div>
        ) : null}
      </div>

      {/* Bottom right corner (rotated) */}
      <div className={cn("absolute bottom-1 right-1.5 flex flex-col items-center leading-none z-10 rotate-180", colors.text)}>
        <span className={cn("font-serif font-black tracking-tight", fontSizes[size].rank)}>{rankChar}</span>
        <SuitIcon suit={suit} className={cn("mt-0.5", colors.text, cornerIconSizes[size], pipShadow)} />
      </div>
    </div>
  )
}
