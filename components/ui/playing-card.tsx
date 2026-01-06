"use client"

import type React from "react"

import { cn } from "@/lib/utils"

interface PlayingCardProps {
  card: string
  size?: "xs" | "sm" | "md" | "lg" | "xl"
  className?: string
}

const SuitIcon = ({ suit, className }: { suit: string; className?: string }) => {
  const icons: Record<string, React.ReactNode> = {
    h: (
      <svg viewBox="0 0 32 32" className={className} fill="currentColor">
        <path d="M16 28C16 28 4 18 4 10C4 5 8 2 12 6C14 8 16 10 16 10C16 10 18 8 20 6C24 2 28 5 28 10C28 18 16 28 16 28Z" />
      </svg>
    ),
    d: (
      <svg viewBox="0 0 32 32" className={className} fill="currentColor">
        <path d="M16 2L28 16L16 30L4 16L16 2Z" />
      </svg>
    ),
    s: (
      <svg viewBox="0 0 32 32" className={className} fill="currentColor">
        <path d="M16 2C16 2 4 12 4 20C4 26 8 28 12 24C14 22 16 20 16 20C16 20 16 26 16 28L14 28L14 30L18 30L18 28L16 28C16 26 16 20 16 20C16 20 18 22 20 24C24 28 28 26 28 20C28 12 16 2 16 2Z" />
      </svg>
    ),
    c: (
      <svg viewBox="0 0 32 32" className={className} fill="currentColor">
        <path d="M16 6C18.5 6 20.5 8 20.5 10.5C20.5 12 19.8 13.3 18.7 14C20.8 14.3 22.5 16 22.5 18.5C22.5 21 20.5 23 18 23C17.2 23 16.5 22.8 16 22.5C16 22.5 16 26 16 28L14 28L14 30L18 30L18 28L16 28C16 26 16 22.5 16 22.5C15.5 22.8 14.8 23 14 23C11.5 23 9.5 21 9.5 18.5C9.5 16 11.2 14.3 13.3 14C12.2 13.3 11.5 12 11.5 10.5C11.5 8 13.5 6 16 6Z" />
      </svg>
    ),
  }
  return <>{icons[suit] || null}</>
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
    xs: "w-6 h-8",
    sm: "w-8 h-11",
    md: "w-11 h-15",
    lg: "w-14 h-20",
    xl: "w-18 h-24",
  }

  const fontSizes = {
    xs: { rank: "text-[9px]", suit: "text-[7px]", center: "w-3 h-3" },
    sm: { rank: "text-[11px]", suit: "text-[9px]", center: "w-3.5 h-3.5" },
    md: { rank: "text-sm", suit: "text-[11px]", center: "w-5 h-5" },
    lg: { rank: "text-lg", suit: "text-sm", center: "w-7 h-7" },
    xl: { rank: "text-xl", suit: "text-base", center: "w-9 h-9" },
  }

  return (
    <div
      className={cn(
        "relative rounded-lg overflow-hidden",
        "bg-gradient-to-br from-white via-gray-50 to-gray-100",
        "border border-gray-300/60",
        "shadow-[0_2px_12px_rgba(0,0,0,0.15)]",
        sizeClasses[size],
        className,
      )}
    >
      {/* Card shine effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/80 via-transparent to-transparent" />

      {/* Top left corner */}
      <div className={cn("absolute top-0.5 left-1 flex flex-col items-center leading-none z-10", colors.text)}>
        <span className={cn("font-black", fontSizes[size].rank)}>{rank}</span>
        <span className={cn("font-bold -mt-0.5", fontSizes[size].suit)}>{suitSymbol}</span>
      </div>

      {/* Center suit icon */}
      <div className={cn("absolute inset-0 flex items-center justify-center z-10", colors.text, colors.glow)}>
        <SuitIcon suit={suit} className={cn(fontSizes[size].center)} />
      </div>

      {/* Bottom right corner (rotated) */}
      <div
        className={cn(
          "absolute bottom-0.5 right-1 flex flex-col items-center leading-none z-10 rotate-180",
          colors.text,
        )}
      >
        <span className={cn("font-black", fontSizes[size].rank)}>{rank}</span>
        <span className={cn("font-bold -mt-0.5", fontSizes[size].suit)}>{suitSymbol}</span>
      </div>
    </div>
  )
}
