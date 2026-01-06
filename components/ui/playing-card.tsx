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
      <svg viewBox="0 0 24 24" className={className} fill="currentColor">
        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
      </svg>
    ),
    d: (
      <svg viewBox="0 0 24 24" className={className} fill="currentColor">
        <path d="M19 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.11 0 2-.9 2-2V5c0-1.1-.89-2-2-2zm-10 14l-5-5 1.41-1.41L9 14.17l7.59-7.59L18 8l-9 9z"/>
      </svg>
    ),
    s: (
      <svg viewBox="0 0 24 24" className={className} fill="currentColor">
        <path d="M16.56 8.94L7.62 0 6.21 1.41l2.38 2.38-5.15 5.15c-.59.59-.59 1.54 0 2.12l5.5 5.5c.29.29.68.44 1.06.44s.77-.15 1.06-.44l5.5-5.5c.59-.58.59-1.53 0-2.12zM5.21 10L10 5.21 14.79 10H5.21zM19 11.5s-2 2.17-2 3.5c0 1.1.9 2 2 2s2-.9 2-2c0-1.33-2-3.5-2-3.5z"/>
      </svg>
    ),
    c: (
      <svg viewBox="0 0 24 24" className={className} fill="currentColor">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
      </svg>
    ),
  }
  return <>{icons[suit] || null}</>
}

const suitColors: Record<string, { text: string; bg: string }> = {
  h: { text: "text-red-500", bg: "bg-red-50" },
  d: { text: "text-red-500", bg: "bg-red-50" },
  s: { text: "text-gray-900", bg: "bg-gray-50" },
  c: { text: "text-gray-900", bg: "bg-gray-50" },
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
  const colors = suitColors[suit] || { text: "text-gray-900", bg: "bg-gray-50" }
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
        "relative bg-white border border-gray-300 rounded-lg shadow-md transition-all duration-200 hover:shadow-lg hover:scale-105",
        sizeClasses[size],
        className,
      )}
    >
      {/* Card background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="w-full h-full" style={{
          backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 2px, rgba(0,0,0,0.03) 2px, rgba(0,0,0,0.03) 4px)`,
        }} />
      </div>
      
      {/* Top left corner */}
      <div className="absolute top-2 left-2 flex flex-col items-center leading-none z-10">
        <span className={cn("font-bold", fontSizes[size].rank, colors.text)}>{rank}</span>
        <span className={cn("font-semibold", fontSizes[size].suit, colors.text)}>{suitSymbol}</span>
      </div>

      {/* Center suit icon */}
      <div className={cn("absolute inset-0 flex items-center justify-center z-10", colors.text)}>
        <div className={cn(colors.bg, "rounded-full p-2", size === "lg" ? "p-3" : size === "xl" ? "p-4" : "p-2")}>
          <SuitIcon suit={suit} className={cn(fontSizes[size].center)} />
        </div>
      </div>

      {/* Bottom right corner (rotated) */}
      <div className="absolute bottom-2 right-2 flex flex-col items-center leading-none z-10 rotate-180">
        <span className={cn("font-bold", fontSizes[size].rank, colors.text)}>{rank}</span>
        <span className={cn("font-semibold", fontSizes[size].suit, colors.text)}>{suitSymbol}</span>
      </div>
    </div>
  )
}
