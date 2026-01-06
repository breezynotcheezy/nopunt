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
    <div className="h-full flex flex-col bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 overflow-hidden">
      {/* Header */}
      <div className="h-14 shrink-0 flex items-center justify-between px-6 border-b border-white/10 bg-gradient-to-b from-white/5 to-transparent backdrop-blur-sm">
        <button
          onClick={onExit}
          className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition-all duration-200 hover:scale-105 active:scale-95"
        >
          <X className="w-5 h-5" />
        </button>
        <div className="flex flex-col items-center">
          <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">
            {drillType === "weakness" ? "Weakness Drill" : "Daily Training"}
          </span>
          <span className="text-sm font-bold text-white">
            Hand {handNumber}/{totalHands}
          </span>
        </div>
        <button className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition-all duration-200 hover:scale-105 active:scale-95">
          <HelpCircle className="w-5 h-5" />
        </button>
      </div>

      {/* Progress bar */}
      <div className="shrink-0 px-6 py-3 bg-gradient-to-b from-white/5 to-transparent">
        <div className="relative">
          <Progress value={(handNumber / totalHands) * 100} className="h-2 bg-slate-800/50" />
          <div className="absolute inset-0 bg-gradient-to-r from-violet-500/20 to-purple-500/20 rounded-full" style={{ width: `${(handNumber / totalHands) * 100}%` }} />
        </div>
      </div>

      {/* Poker Table - takes available space */}
      <div className="flex-1 min-h-0 px-4 py-2">
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
      <div className="shrink-0 px-6 pb-6 pt-4 border-t border-white/10 bg-gradient-to-t from-slate-900 via-slate-900/95 to-slate-900/80 backdrop-blur-xl">
        {!showVerdict ? (
          <div className="space-y-2">
            {/* Raise Slider */}
            {showRaiseSlider && (
              <div className="bg-gradient-to-br from-violet-500/10 to-purple-500/10 backdrop-blur-xl rounded-2xl p-4 border border-violet-500/30 shadow-2xl shadow-violet-500/20 animate-in slide-in-from-bottom-2 duration-300">
                <div className="flex items-center gap-4">
                  <span className="text-xs font-bold text-white uppercase tracking-wider shrink-0">Raise</span>
                  <button
                    onClick={() => setRaiseSize(Math.max(2, raiseSize - 0.5))}
                    className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-all duration-200 active:scale-95 hover:scale-105"
                  >
                    <Minus className="w-5 h-5" />
                  </button>
                  <div className="flex-1 h-3 bg-slate-800/50 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-violet-500 to-purple-500 rounded-full transition-all duration-300 shadow-lg shadow-violet-500/50"
                      style={{ width: `${((raiseSize - 2) / 8) * 100}%` }}
                    />
                  </div>
                  <button
                    onClick={() => setRaiseSize(Math.min(10, raiseSize + 0.5))}
                    className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-all duration-200 active:scale-95 hover:scale-105"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                  <span className="text-sm font-black text-violet-400 min-w-[52px] text-center tabular-nums">
                    {raiseSize.toFixed(1)}x
                  </span>
                </div>
                {/* Quick presets */}
                <div className="flex gap-2 mt-3">
                  {[2.2, 2.5, 3, 4].map((size) => (
                    <button
                      key={size}
                      onClick={() => setRaiseSize(size)}
                      className={cn(
                        "flex-1 py-2 text-xs font-bold rounded-xl transition-all duration-200 active:scale-95 hover:scale-105",
                        raiseSize === size
                          ? "bg-gradient-to-r from-violet-500 to-purple-500 text-white shadow-lg shadow-violet-500/40"
                          : "bg-white/10 text-slate-400 hover:text-white hover:bg-white/15",
                      )}
                    >
                      {size}x
                    </button>
                  ))}
                  <button
                    onClick={() => handleAction("Raise", scenario.stackDepth)}
                    className="flex-1 py-2 text-xs font-bold rounded-xl bg-gradient-to-r from-red-500/20 to-pink-500/20 text-red-400 hover:from-red-500/30 hover:to-pink-500/30 transition-all duration-200 active:scale-95 hover:scale-105 border border-red-500/30"
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
                  "h-16 flex flex-col items-center justify-center rounded-2xl border-2 font-bold transition-all duration-200 active:scale-[0.97] hover:scale-105",
                  showRaiseSlider
                    ? "bg-slate-800/50 border-slate-700/50 text-slate-400 hover:text-white hover:bg-slate-800/70"
                    : "bg-gradient-to-br from-slate-800/90 to-slate-900/90 border-slate-700/60 text-slate-300 hover:from-slate-700/90 hover:to-slate-800/90 hover:border-slate-600/80 hover:text-white shadow-lg shadow-black/20",
                )}
              >
                <span className="text-sm font-medium">{showRaiseSlider ? "Cancel" : "Fold"}</span>
              </button>

              {/* Check/Call */}
              <button
                onClick={() => handleAction(facingBet ? "Call" : "Check")}
                disabled={showRaiseSlider}
                className={cn(
                  "h-16 flex flex-col items-center justify-center rounded-2xl border-2 font-bold transition-all duration-200 active:scale-[0.97]",
                  showRaiseSlider
                    ? "bg-slate-800/30 border-slate-700/30 text-slate-600/40 cursor-not-allowed"
                    : "bg-gradient-to-br from-white/10 to-white/5 border-white/20 text-white hover:from-white/15 hover:to-white/10 hover:border-white/30 hover:scale-105 shadow-lg shadow-white/10",
                )}
              >
                <span className="text-sm font-medium">{facingBet ? "Call" : "Check"}</span>
              </button>

              {/* Raise/Bet/Confirm */}
              <button
                onClick={handleRaiseClick}
                className={cn(
                  "h-16 flex flex-col items-center justify-center rounded-2xl border-2 font-bold transition-all duration-200 active:scale-[0.97] hover:scale-105",
                  showRaiseSlider
                    ? "bg-gradient-to-br from-violet-500 to-purple-600 text-white border-violet-400 shadow-2xl shadow-violet-500/50"
                    : "bg-gradient-to-br from-violet-500/90 to-purple-600/90 text-white border-violet-400/60 hover:from-violet-500 hover:to-purple-600 hover:shadow-xl hover:shadow-violet-500/40",
                )}
              >
                <span className="text-sm font-medium">{showRaiseSlider ? `Raise ${raiseSize}x` : facingBet ? "Raise" : "Bet"}</span>
              </button>
            </div>
          </div>
        ) : (
          /* Verdict Panel */
          <div className="animate-in slide-in-from-bottom-4 duration-300">
            <div
              className={cn(
                "p-5 border-2 rounded-2xl backdrop-blur-xl shadow-2xl",
                isCorrect
                  ? "border-violet-500/40 bg-gradient-to-br from-violet-500/20 via-purple-500/10 to-transparent shadow-violet-500/20"
                  : "border-red-500/40 bg-gradient-to-br from-red-500/20 via-pink-500/10 to-transparent shadow-red-500/20",
              )}
            >
              {/* Verdict Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div
                    className={cn(
                      "w-12 h-12 rounded-2xl flex items-center justify-center text-lg font-bold shadow-xl transition-all duration-300",
                      isCorrect
                        ? "bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow-violet-500/40"
                        : "bg-gradient-to-br from-red-500 to-pink-600 text-white shadow-red-500/40",
                    )}
                  >
                    {isCorrect ? "✓" : "✗"}
                  </div>
                  <div>
                    <p className={cn("text-lg font-black leading-none mb-1", isCorrect ? "text-violet-400" : "text-red-400")}>
                      {verdictType === "correct" ? "Correct!" : verdictType === "mistake" ? "Mistake" : "Punt!"}
                    </p>
                    <span className={cn("text-sm font-bold", isCorrect ? "text-violet-500/80" : "text-red-500/80")}>
                      EV: {isCorrect ? "+" : ""}
                      {scenario.evDelta.toFixed(1)}bb
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setBookmarked(!bookmarked)}
                  className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95",
                    bookmarked
                      ? "bg-violet-500/20 text-violet-400 border border-violet-500/30"
                      : "bg-white/10 text-slate-400 hover:text-white hover:bg-white/15 border border-white/10",
                  )}
                >
                  <Bookmark className="w-5 h-5" fill={bookmarked ? "currentColor" : "none"} />
                </button>
              </div>

              {/* Actions comparison */}
              <div className="flex gap-3 mb-4">
                <div className="flex-1 px-4 py-3 rounded-2xl bg-white/5 border border-white/10">
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Your Action</span>
                  <p className="text-base font-black text-white mt-1">{selectedAction}</p>
                </div>
                <div className="flex-1 px-4 py-3 rounded-2xl bg-gradient-to-br from-violet-500/20 to-purple-500/10 border border-violet-500/30">
                  <span className="text-[10px] text-violet-400 uppercase tracking-wider font-bold">Optimal</span>
                  <p className="text-base font-black text-violet-400 mt-1 capitalize">
                    {scenario.correctAction}
                    {scenario.correctSizing ? ` ${scenario.correctSizing}bb` : ""}
                  </p>
                </div>
              </div>

              {/* Explanation */}
              <div className="px-4 py-3 rounded-2xl bg-white/5 border border-white/10 mb-4">
                <p className="text-sm text-slate-300 leading-relaxed">{scenario.explanation}</p>
              </div>

              {/* Range toggle */}
              <button
                onClick={() => setShowRange(!showRange)}
                className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors mb-4 hover:bg-white/5 px-3 py-2 rounded-xl transition-all duration-200"
              >
                <Eye className="w-4 h-4" />
                <span className="font-medium">{showRange ? "Hide" : "View"} Range</span>
                <ChevronDown className={cn("w-4 h-4 transition-transform duration-200", showRange && "rotate-180")} />
              </button>

              {showRange && (
                <div className="bg-gradient-to-br from-white/10 to-white/5 rounded-2xl p-4 mb-4 animate-in fade-in duration-300 border border-white/10">
                  <div className="grid grid-cols-13 gap-1">
                    {Array.from({ length: 13 * 13 }).map((_, i) => (
                      <div
                        key={i}
                        className={cn(
                          "aspect-square rounded-md transition-all duration-200 hover:scale-110",
                          Math.random() > 0.65 
                            ? "bg-gradient-to-br from-violet-500/70 to-purple-500/70 shadow-lg shadow-violet-500/30" 
                            : "bg-white/10 hover:bg-white/15",
                        )}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Next Button */}
              <button
                onClick={handleNext}
                className="w-full h-14 font-bold bg-gradient-to-r from-violet-500 to-purple-600 text-white rounded-2xl text-sm hover:from-violet-600 hover:to-purple-700 shadow-xl shadow-violet-500/30 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
              >
                Next Hand
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
