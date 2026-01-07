"use client"

import { useState } from "react"
import { X, Bookmark, ChevronDown, Eye, Minus, Plus, HelpCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { PokerTable } from "@/components/ui/poker-table"
import type { HandScenario, Mistake } from "@/lib/mock-data"
import { cn } from "@/lib/utils"

interface DrillScreenProps {
  scenario: HandScenario
  handNumber: number
  totalHands: number
  drillType: "daily" | "weakness"
  onDecision: (correct: boolean, mistake?: Mistake) => void
  onNext: () => void
  onExit: () => void
}

export function DrillScreen({
  scenario,
  handNumber,
  totalHands,
  drillType,
  onDecision,
  onNext,
  onExit,
}: DrillScreenProps) {
  const [selectedAction, setSelectedAction] = useState<string | null>(null)
  const [showVerdict, setShowVerdict] = useState(false)
  const [showRange, setShowRange] = useState(false)
  const [bookmarked, setBookmarked] = useState(false)
  const [raiseSize, setRaiseSize] = useState(2.5)
  const [showRaiseSlider, setShowRaiseSlider] = useState(false)

  const handleAction = (action: string, sizing?: number) => {
    const finalAction = sizing ? `${action} ${sizing}x` : action
    setSelectedAction(finalAction)

    const isCorrect =
      action.toLowerCase() === scenario.correctAction ||
      (action.toLowerCase() === "bet" && scenario.correctAction === "raise")

    onDecision(
      isCorrect,
      isCorrect
        ? undefined
        : {
            id: scenario.id,
            category: scenario.category,
            hand: scenario,
            userAction: finalAction,
            timestamp: new Date(),
          },
    )

    setShowRaiseSlider(false)
    setTimeout(() => setShowVerdict(true), 200)
  }

  const handleRaiseClick = () => {
    if (showRaiseSlider) {
      handleAction("Raise", raiseSize)
    } else {
      setShowRaiseSlider(true)
    }
  }

  const handleCancelRaise = () => {
    setShowRaiseSlider(false)
    setRaiseSize(2.5)
  }

  const handleNext = () => {
    setSelectedAction(null)
    setShowVerdict(false)
    setShowRange(false)
    setBookmarked(false)
    setShowRaiseSlider(false)
    setRaiseSize(2.5)
    onNext()
  }

  const isCorrect = selectedAction?.toLowerCase().startsWith(scenario.correctAction)
  const verdictType = isCorrect ? "correct" : Math.random() > 0.5 ? "mistake" : "punt"

  const facingBet =
    scenario.action.toLowerCase().includes("bet") ||
    scenario.action.toLowerCase().includes("raise") ||
    scenario.action.toLowerCase().includes("opens")

  return (
    <div className="h-full flex flex-col bg-background overflow-hidden">
      {/* Header */}
      <div className="h-12 shrink-0 flex items-center justify-between px-4 border-b border-white/5 bg-background">
        <button
          onClick={onExit}
          className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 text-muted-foreground hover:text-foreground hover:bg-white/10 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
        <div className="flex flex-col items-center">
          <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
            {drillType === "weakness" ? "Weakness Drill" : "Daily Training"}
          </span>
          <span className="text-sm font-bold text-foreground">
            Hand {handNumber}/{totalHands}
          </span>
        </div>
        <button className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 text-muted-foreground hover:text-foreground hover:bg-white/10 transition-colors">
          <HelpCircle className="w-4 h-4" />
        </button>
      </div>

      {/* Progress bar */}
      <div className="shrink-0 px-4 py-2">
        <Progress value={(handNumber / totalHands) * 100} className="h-1.5" />
      </div>

      {/* Poker Table - takes available space */}
      <div className="flex-1 min-h-0 px-2">
        <PokerTable
          heroPosition={scenario.position}
          heroHand={scenario.heroHand}
          board={scenario.board}
          potSize={scenario.potSize}
          action={scenario.action}
          stackDepth={scenario.stackDepth}
          blinds={scenario.blinds}
          players={scenario.players}
        />
      </div>

      {/* Action Panel - fixed at bottom */}
      <div className="shrink-0 px-3 pb-4 pt-2 border-t border-white/5 bg-gradient-to-t from-background to-background/80">
        {!showVerdict ? (
          <div className="space-y-2">
            {/* Raise Slider */}
            {showRaiseSlider && (
              <div className="bg-white/5 backdrop-blur-md rounded-xl p-3 border border-primary/30 animate-in slide-in-from-bottom-2 duration-200">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-semibold text-foreground shrink-0">Raise:</span>
                  <button
                    onClick={() => setRaiseSize(Math.max(2, raiseSize - 0.5))}
                    className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-foreground hover:bg-white/20 transition-colors active:scale-95"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-primary/80 to-primary rounded-full transition-all duration-100"
                      style={{ width: `${((raiseSize - 2) / 8) * 100}%` }}
                    />
                  </div>
                  <button
                    onClick={() => setRaiseSize(Math.min(10, raiseSize + 0.5))}
                    className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-foreground hover:bg-white/20 transition-colors active:scale-95"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                  <span className="text-sm font-black text-primary min-w-[44px] text-center tabular-nums">
                    {raiseSize.toFixed(1)}x
                  </span>
                </div>
                {/* Quick presets */}
                <div className="flex gap-2 mt-2">
                  {[2.2, 2.5, 3, 4].map((size) => (
                    <button
                      key={size}
                      onClick={() => setRaiseSize(size)}
                      className={cn(
                        "flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all active:scale-95",
                        raiseSize === size
                          ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30"
                          : "bg-white/10 text-muted-foreground hover:text-foreground hover:bg-white/15",
                      )}
                    >
                      {size}x
                    </button>
                  ))}
                  <button
                    onClick={() => handleAction("Raise", scenario.stackDepth)}
                    className="flex-1 py-1.5 text-xs font-semibold rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-all active:scale-95"
                  >
                    All-in
                  </button>
                </div>
              </div>
            )}

            {/* Main Action Buttons */}
            <div className="grid grid-cols-3 gap-3">
              {/* Fold/Cancel */}
              <button
                onClick={showRaiseSlider ? handleCancelRaise : () => handleAction("Fold")}
                className={cn(
                  "h-14 flex flex-col items-center justify-center rounded-xl border-2 font-semibold transition-all active:scale-[0.97]",
                  showRaiseSlider
                    ? "bg-white/5 border-white/10 text-muted-foreground hover:text-foreground hover:bg-white/10"
                    : "bg-zinc-800/90 border-zinc-700/60 text-zinc-300 hover:bg-zinc-700/90 hover:border-zinc-600",
                )}
              >
                <span className="text-sm">{showRaiseSlider ? "Cancel" : "Fold"}</span>
              </button>

              {/* Check/Call */}
              <button
                onClick={() => handleAction(facingBet ? "Call" : "Check")}
                disabled={showRaiseSlider}
                className={cn(
                  "h-14 flex flex-col items-center justify-center rounded-xl border-2 font-semibold transition-all active:scale-[0.97]",
                  showRaiseSlider
                    ? "bg-white/5 border-white/5 text-muted-foreground/40 cursor-not-allowed"
                    : "bg-white/10 border-white/20 text-foreground hover:bg-white/15 hover:border-white/30",
                )}
              >
                <span className="text-sm">{facingBet ? "Call" : "Check"}</span>
              </button>

              {/* Raise/Bet/Confirm */}
              <button
                onClick={handleRaiseClick}
                className={cn(
                  "h-14 flex flex-col items-center justify-center rounded-xl border-2 font-semibold transition-all active:scale-[0.97]",
                  showRaiseSlider
                    ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/40"
                    : "bg-primary/90 text-primary-foreground border-primary/60 hover:bg-primary hover:shadow-lg hover:shadow-primary/30",
                )}
              >
                <span className="text-sm">{showRaiseSlider ? `Raise ${raiseSize}x` : facingBet ? "Raise" : "Bet"}</span>
              </button>
            </div>
          </div>
        ) : (
          /* Verdict Panel */
          <div className="animate-in slide-in-from-bottom-4 duration-300">
            <Card
              className={cn(
                "p-3 border-2 rounded-xl",
                isCorrect
                  ? "border-primary/60 bg-gradient-to-b from-primary/20 to-primary/5"
                  : "border-red-500/60 bg-gradient-to-b from-red-500/20 to-red-500/5",
              )}
            >
              {/* Verdict Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shadow-lg",
                      isCorrect
                        ? "bg-primary text-primary-foreground shadow-primary/40"
                        : "bg-red-500 text-white shadow-red-500/40",
                    )}
                  >
                    {isCorrect ? "✓" : "✗"}
                  </div>
                  <div>
                    <p className={cn("text-base font-bold leading-none", isCorrect ? "text-primary" : "text-red-400")}>
                      {verdictType === "correct" ? "Correct!" : verdictType === "mistake" ? "Mistake" : "Punt!"}
                    </p>
                    <span className={cn("text-xs font-semibold", isCorrect ? "text-primary/80" : "text-red-400/80")}>
                      EV: {isCorrect ? "+" : ""}
                      {scenario.evDelta.toFixed(1)}bb
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setBookmarked(!bookmarked)}
                  className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center transition-all",
                    bookmarked
                      ? "bg-primary/20 text-primary"
                      : "bg-white/10 text-muted-foreground hover:text-foreground",
                  )}
                >
                  <Bookmark className="w-4 h-4" fill={bookmarked ? "currentColor" : "none"} />
                </button>
              </div>

              {/* Actions comparison */}
              <div className="flex gap-2 mb-3">
                <div className="flex-1 px-3 py-2 rounded-lg bg-white/5">
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Your Action</span>
                  <p className="text-sm font-bold text-foreground">{selectedAction}</p>
                </div>
                <div className="flex-1 px-3 py-2 rounded-lg bg-primary/10 border border-primary/20">
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Optimal</span>
                  <p className="text-sm font-bold text-primary capitalize">
                    {scenario.correctAction}
                    {scenario.correctSizing ? ` ${scenario.correctSizing}bb` : ""}
                  </p>
                </div>
              </div>

              {/* Explanation */}
              <p className="text-xs text-foreground/80 leading-relaxed mb-3">{scenario.explanation}</p>

              {/* Range toggle */}
              <button
                onClick={() => setShowRange(!showRange)}
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-3"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>{showRange ? "Hide" : "View"} Range</span>
                <ChevronDown className={cn("w-3.5 h-3.5 transition-transform", showRange && "rotate-180")} />
              </button>

              {showRange && (
                <div className="bg-white/5 rounded-lg p-2 mb-3 animate-in fade-in duration-150">
                  <div className="grid grid-cols-13 gap-px">
                    {Array.from({ length: 13 * 13 }).map((_, i) => (
                      <div
                        key={i}
                        className={cn(
                          "aspect-square rounded-sm",
                          Math.random() > 0.65 ? "bg-primary/70" : "bg-white/10",
                        )}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Next Button */}
              <Button
                onClick={handleNext}
                className="w-full h-11 font-bold bg-primary text-primary-foreground rounded-xl text-sm hover:bg-primary/90 shadow-lg shadow-primary/30"
              >
                Next Hand
              </Button>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
