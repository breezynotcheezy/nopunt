"use client"

import React, { useEffect, useMemo, useRef, useState } from "react"
import { cn } from "@/lib/utils"

export type VerticalWheelProps = {
  options: number[]
  value: number
  onChange: (v: number) => void
  height?: number // px
  itemHeight?: number // px
  format?: (v: number) => string
  className?: string
}

export function VerticalWheel({
  options,
  value,
  onChange,
  height = 200,
  itemHeight = 36,
  format,
  className,
}: VerticalWheelProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const draggingRef = useRef(false)
  const accumRef = useRef(0) // accumulated pixel delta since last step
  const lastYRef = useRef(0)

  const fmt = (v: number) => (format ? format(v) : `${v}bb`)

  const clampedIndex = useMemo(() => {
    let idx = options.indexOf(value)
    if (idx < 0) {
      // find nearest
      let best = 0
      let bestDiff = Infinity
      options.forEach((o, i) => {
        const d = Math.abs(o - value)
        if (d < bestDiff) {
          best = i
          bestDiff = d
        }
      })
      idx = best
    }
    return Math.max(0, Math.min(options.length - 1, idx))
  }, [options, value])

  const center = height / 2
  const translateY = center - (clampedIndex + 0.5) * itemHeight

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const onPointerDown = (e: PointerEvent) => {
      draggingRef.current = true
      lastYRef.current = e.clientY
      accumRef.current = 0
      ;(e.target as HTMLElement).setPointerCapture?.(e.pointerId)
    }

    const onPointerMove = (e: PointerEvent) => {
      if (!draggingRef.current) return
      const dy = e.clientY - lastYRef.current
      lastYRef.current = e.clientY
      accumRef.current += dy
      const step = Math.floor(Math.abs(accumRef.current) / itemHeight)
      if (step > 0) {
        // Dragging down should move selection towards larger indices (lower visually)
        const dir = accumRef.current > 0 ? 1 : -1
        let idx = clampedIndex + dir * step
        idx = Math.max(0, Math.min(options.length - 1, idx))
        const next = options[idx]
        onChange(next)
        // keep residual
        accumRef.current -= dir * step * itemHeight
      }
    }

    const onPointerUp = (e: PointerEvent) => {
      draggingRef.current = false
      ;(e.target as HTMLElement).releasePointerCapture?.(e.pointerId)
      accumRef.current = 0
    }

    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      const delta = e.deltaY
      let idx = clampedIndex + (delta > 0 ? 1 : -1)
      idx = Math.max(0, Math.min(options.length - 1, idx))
      const next = options[idx]
      onChange(next)
    }

    el.addEventListener("pointerdown", onPointerDown)
    window.addEventListener("pointermove", onPointerMove)
    window.addEventListener("pointerup", onPointerUp)
    el.addEventListener("wheel", onWheel, { passive: false })
    return () => {
      el.removeEventListener("pointerdown", onPointerDown)
      window.removeEventListener("pointermove", onPointerMove)
      window.removeEventListener("pointerup", onPointerUp)
      el.removeEventListener("wheel", onWheel)
    }
  }, [clampedIndex, itemHeight, onChange, options])

  return (
    <div
      ref={containerRef}
      className={cn("relative w-full select-none touch-none overflow-hidden", className)}
      style={{ height }}
    >
      {/* List */}
      <div
        className="absolute left-1/2 -translate-x-1/2 w-full"
        style={{ transform: `translate(-50%, ${translateY}px)` }}
      >
        {options.map((opt, i) => {
          const isActive = i === clampedIndex
          const near = Math.abs(i - clampedIndex) <= 2
          return (
            <div
              key={opt}
              className={cn(
                "h-9 flex items-center justify-center transition-all", // base
                isActive ? "text-primary font-extrabold text-base" : near ? "text-foreground/80 font-semibold text-sm" : "text-foreground/50 text-xs",
              )}
              style={{ height: itemHeight }}
            >
              {fmt(opt)}
            </div>
          )}
        )}
      </div>

      {/* Center highlight */}
      <div
        className="pointer-events-none absolute left-1/2 -translate-x-1/2 w-[90%] rounded-full border border-primary/40 bg-primary/5"
        style={{ top: center - itemHeight / 2, height: itemHeight }}
      />

      {/* Gradient masks */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-8 bg-gradient-to-b from-background to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-background to-transparent" />
    </div>
  )
}
