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
    xs: "w-[22px] h-[34px]",
    sm: "w-[29px] h-[43px]",
    md: "w-[52px] h-[78px]",
    lg: "w-[74px] h-[108px]",
    xl: "w-[92px] h-[136px]",
  }

  const fontSizes = {
    xs: { rank: "text-[9px]", suit: "text-[8px]", center: "text-sm" },
    sm: { rank: "text-[10px]", suit: "text-[10px]", center: "text-base" },
    md: { rank: "text-[14px]", suit: "text-[12px]", center: "text-lg" },
    lg: { rank: "text-[16px]", suit: "text-[13px]", center: "text-xl" },
    xl: { rank: "text-[18px]", suit: "text-[14px]", center: "text-2xl" },
  }

  const cornerIconSizes: Record<NonNullable<PlayingCardProps['size']>, string> = {
    xs: "w-2.5 h-2.5",
    sm: "w-3 h-3",
    md: "w-3.5 h-3.5",
    lg: "w-4 h-4",
    xl: "w-5 h-5",
  }

  const centerIconSizes: Record<NonNullable<PlayingCardProps['size']>, string> = {
    xs: "w-[10px] h-[10px]",
    sm: "w-[13px] h-[13px]",
    md: "w-[21px] h-[21px]",
    lg: "w-[32px] h-[32px]",
    xl: "w-[42px] h-[42px]",
  }
  const pipShadow = "drop-shadow-[0_0.5px_0_rgba(0,0,0,0.25)]"

  const rankChar = rank

  return (
    <div
      className={cn(
        "relative rounded-[14px] overflow-hidden flex-none block align-top box-border",
        // Premium face + subtle paper grain via layered gradients
        "bg-[linear-gradient(145deg,rgba(255,255,255,1)_0%,rgba(255,255,255,1)_35%,rgba(248,248,252,1)_100%)]",
        // Crisp border + inner stroke
        outlined ? "border border-zinc-300" : "border border-zinc-200/90",
        "shadow-[0_14px_34px_rgba(0,0,0,0.26)]",
        sizeClasses[size],
        className,
      )}
    >
      <div className="absolute inset-[1px] rounded-[13px] pointer-events-none ring-1 ring-black/5" />
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_top,rgba(0,0,0,0.07)_0%,transparent_52%)]" />
      <div className="absolute inset-0 pointer-events-none opacity-40 mix-blend-overlay bg-[linear-gradient(120deg,transparent_0%,rgba(255,255,255,0.55)_18%,transparent_36%,rgba(255,255,255,0.20)_60%,transparent_86%)]" />

      {outlined ? (
        <>
          <div className="absolute inset-px rounded-[13px] pointer-events-none ring-1 ring-primary/20" />
        </>
      ) : null}

      {/* Top left corner */}
      <div className={cn("absolute top-1.5 left-1.5 flex flex-col items-center leading-none z-10", colors.text)}>
        <span className={cn("font-sans font-black tracking-tight", fontSizes[size].rank)}>{rankChar}</span>
        <span className={cn("-mt-0.5 font-black", fontSizes[size].suit)}>{suitSymbol}</span>
      </div>

      {/* Face / Ace / Numbered center area */}
      <div className={cn("absolute inset-0 z-0 flex items-center justify-center", colors.text)}>
        <SuitIcon suit={suit} className={cn("opacity-95", centerIconSizes[size], pipShadow)} />
      </div>

      {/* Bottom right corner (rotated) */}
      <div className={cn("absolute bottom-1.5 right-1.5 flex flex-col items-center leading-none z-10 rotate-180", colors.text)}>
        <span className={cn("font-sans font-black tracking-tight", fontSizes[size].rank)}>{rankChar}</span>
        <span className={cn("-mt-0.5 font-black", fontSizes[size].suit)}>{suitSymbol}</span>
      </div>
    </div>
  )
}
