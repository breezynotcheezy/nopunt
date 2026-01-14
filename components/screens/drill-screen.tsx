"use client"

import { useState, useEffect } from "react"
import { X, Bookmark, ChevronDown, Eye, Minus, Plus, HelpCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { PokerTable } from "@/components/ui/poker-table"
import type { HandScenario, Mistake, MultiStreetHand } from "@/lib/mock-data"
import { cn } from "@/lib/utils"

interface DrillScreenProps {
  hand: MultiStreetHand
  handNumber: number
  totalHands: number
  drillType: "daily" | "weakness"
  onDecision: (correct: boolean, mistake?: Mistake) => void
  onNext: () => void
  onExit: () => void
}

export function DrillScreen({
  hand,
  handNumber,
  totalHands,
  drillType,
  onDecision,
  onNext,
  onExit,
}: DrillScreenProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const currentScenario: HandScenario = hand.steps[currentStepIndex]

  const [selectedAction, setSelectedAction] = useState<string | null>(null)
  const [showVerdict, setShowVerdict] = useState(false)
  const [showRange, setShowRange] = useState(false)
  const [bookmarked, setBookmarked] = useState(false)
  const [raiseSize, setRaiseSize] = useState(2.5)
  const [showRaiseSlider, setShowRaiseSlider] = useState(false)
  const [aiSolution, setAiSolution] = useState<string | null>(null)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState<string | null>(null)
  const [aiAction, setAiAction] = useState<string | null>(null)
  const [aiSizing, setAiSizing] = useState<number | null>(null)
  const [aiEv, setAiEv] = useState<number>(0)
  const [aiActions, setAiActions] = useState<Record<string, { ev: number; sizing: number | null; explanation: string }> | null>(null)
  const [heroVisualAction, setHeroVisualAction] = useState<string | null>(null)
  const [heroVisualSize, setHeroVisualSize] = useState<number | null>(null)

  type StepResult = {
    street: HandScenario["street"]
    userAction: string
    optimalAction: string
    optimalSizing: number | null
    ev: number
    explanation: string
    correct: boolean
    evLoss: number
  }

  const [stepResults, setStepResults] = useState<StepResult[]>([])

  const EV_TOLERANCE = 0.5
  const EV_PUNT_THRESHOLD = 3

  // Reset when a new hand starts
  useEffect(() => {
    setCurrentStepIndex(0)
    setStepResults([])
    setSelectedAction(null)
    setShowVerdict(false)
    setShowRange(false)
    setBookmarked(false)
    setShowRaiseSlider(false)
    setRaiseSize(2.5)
    setHeroVisualAction(null)
    setHeroVisualSize(null)
  }, [hand.id])

  // Fetch AI solution whenever the current scenario (street) changes
  useEffect(() => {
    let cancelled = false;
    setAiSolution(null);
    setAiError(null);
    setAiLoading(true);
    setAiAction(null);
    setAiSizing(null);
    setAiEv(0);
    setAiActions(null);
    
    fetch('/api/solver', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(currentScenario),
    })
      .then(async res => {
        const contentType = res.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          const text = await res.text();
          throw new Error(`Invalid response: ${text.substring(0, 100)}`);
        }
        return res.json();
      })
      .then(data => {
        if (!cancelled) {
          if (data.error) {
            setAiError(data.error);
          } else {
            setAiSolution(data.solution || 'No solution available');
            setAiAction(data.optimalAction || data.action || null);
            setAiSizing((data.optimalSizing ?? data.sizing) || null);
            setAiEv(typeof data.optimalEv === "number" ? data.optimalEv : data.ev || 0);
            setAiActions(data.actions || null);
          }
          setAiLoading(false);
        }
      })
      .catch(err => {
        if (!cancelled) {
          setAiError(err.message || 'Error contacting AI solver');
          setAiLoading(false);
        }
      });
    
    return () => { cancelled = true; };
  }, [currentScenario]);

  const handleAction = (action: string, sizing?: number) => {
    const finalAction = sizing ? `${action} ${sizing}bb` : action
    setHeroVisualAction(action.toLowerCase())
    setHeroVisualSize(sizing ?? null)
    setSelectedAction(finalAction)

    // Use the scenario's correctAction as the SINGLE authoritative solution.
    // The AI is only used for EV estimates and explanations.
    const correctAction = currentScenario.correctAction
    const userActionNormalized = action.toLowerCase()

    let optimalEvForStreet = correctEv
    let userEv = correctEv

    if (aiActions && aiActions[userActionNormalized]) {
      const entry = aiActions[userActionNormalized]
      if (typeof entry.ev === "number") {
        userEv = entry.ev
      }
    }

    const evLoss = Math.max(0, optimalEvForStreet - userEv)
    const isCorrect = evLoss <= EV_TOLERANCE

    // Record per-street result and compute updated results array
    const nextResults: StepResult[] = [...stepResults]

    const correctKey = correctAction.toLowerCase()
    let stepExplanation = currentScenario.explanation
    if (!stepExplanation) {
      if (aiActions && aiActions[correctKey] && aiActions[correctKey].explanation) {
        stepExplanation = aiActions[correctKey].explanation
      } else if (aiSolution) {
        stepExplanation = aiSolution
      }
    }

    nextResults[currentStepIndex] = {
      street: currentScenario.street,
      userAction: finalAction,
      optimalAction: correctAction,
      optimalSizing: correctSizing ?? null,
      ev: correctEv,
      explanation: stepExplanation,
      correct: isCorrect,
      evLoss,
    }
    setStepResults(nextResults)

    // If the user folds at any point, the hand is over immediately.
    const foldedEarly = userActionNormalized === "fold"
    const isLastStep = foldedEarly || currentStepIndex >= hand.steps.length - 1

    if (isLastStep) {
      const allCorrect = nextResults.every((r) => r?.correct)
      const totalEvLoss = nextResults.reduce((sum, r) => sum + (r?.evLoss ?? 0), 0)

      const stepsSummary = nextResults
        .map((r, index) => {
          const step = hand.steps[index]
          if (!r || !step) return null
          return {
            street: r.street,
            category: step.category,
            userAction: r.userAction,
            optimalAction: r.optimalAction,
            evLoss: r.evLoss,
          }
        })
        .filter(Boolean) as {
          street: HandScenario["street"]
          category: string
          userAction: string
          optimalAction: string
          evLoss: number
        }[]

      onDecision(
        allCorrect,
        allCorrect
          ? undefined
          : {
              id: currentScenario.id,
              category: currentScenario.category,
              hand: currentScenario,
              userAction: finalAction,
              timestamp: new Date(),
              totalEvLoss,
              steps: stepsSummary,
            },
      )

      setShowRaiseSlider(false)
      setTimeout(() => setShowVerdict(true), 200)
    } else {
      // Allow animations (hero/villain bets & checks) to play before
      // transitioning to the next street.
      setShowRaiseSlider(false)
      setTimeout(() => {
        setRaiseSize(2.5)
        setHeroVisualAction(null)
        setHeroVisualSize(null)
        setSelectedAction(null)
        setCurrentStepIndex((prev) => prev + 1)
      }, 600)
    }
  }

  const handleRaiseClick = () => {
    if (showRaiseSlider) {
      handleAction(facingBet ? "Raise" : "Bet", raiseSize)
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
    setHeroVisualAction(null)
    setHeroVisualSize(null)
    setCurrentStepIndex(0)
    setStepResults([])
    onNext()
  }

  // Determine correct action strictly from the scenario.
  // AI may refine EV/sizing, but never changes which action is "optimal".
  const correctAction = currentScenario.correctAction

  // Prefer scenario sizing; if absent, fall back to AI sizing suggestion.
  const correctSizing = currentScenario.correctSizing ?? aiSizing ?? null

  // Compute EV for the correct action:
  // - If the AI provided an EV entry for the scenario's correctAction, use it.
  // - Otherwise, fall back to the scenario's evDelta.
  // - If neither is available, use the best AI EV as a baseline.
  let correctEv = currentScenario.evDelta

  if (aiActions) {
    const key = correctAction.toLowerCase()
    const entry = aiActions[key]
    if (entry && typeof entry.ev === "number") {
      correctEv = entry.ev
    } else {
      const values = Object.values(aiActions)
      if (values.length) {
        correctEv = values.reduce((max, v) => (v.ev > max ? v.ev : max), values[0].ev)
      }
    }
  } else if (aiEv !== 0) {
    // Backwards-compatible fallback if EV map is missing but a scalar EV exists
    correctEv = aiEv
  }
  const activeOpponent = currentScenario.players.find(p => p.isActive && !p.isFolded)
  const facingBet = activeOpponent?.betAmount !== undefined && activeOpponent.betAmount > 0

  const totalEvLossForHand = stepResults.reduce((sum, r) => sum + (r?.evLoss ?? 0), 0)
  const isCorrect = stepResults.length > 0 && stepResults.every((r) => r?.correct)
  const verdictType = isCorrect ? "correct" : totalEvLossForHand > EV_PUNT_THRESHOLD ? "punt" : "mistake"

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
          heroPosition={currentScenario.position}
          heroHand={currentScenario.heroHand}
          board={currentScenario.board}
          potSize={currentScenario.potSize}
          action={currentScenario.action}
          stackDepth={currentScenario.stackDepth}
          blinds={currentScenario.blinds}
          players={currentScenario.players}
          heroAction={heroVisualAction as any}
          heroActionSizeBb={heroVisualSize}
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
                  <span className="text-xs font-semibold text-foreground shrink-0">{facingBet ? "Raise:" : "Bet:"}</span>
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
                    onClick={() => handleAction(facingBet ? "Raise" : "Bet", currentScenario.stackDepth)}
                    className="flex-1 py-1.5 text-xs font-semibold rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-all active:scale-95"
                  >
                    All-in
                  </button>
                </div>
              </div>
            )}

            {/* Main Action Buttons */}
            <div className={cn("grid gap-3", facingBet ? "grid-cols-3" : "grid-cols-2")}>
              {/* Fold/Cancel - Only show if facing a bet */}
              {facingBet && (
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
              )}

              {/* Check/Call */}
              <button
                onClick={() => handleAction(facingBet ? "Call" : "Check")}
                disabled={showRaiseSlider}
                className={cn(
                  "h-14 flex flex-col items-center justify-center rounded-xl border-2 font-semibold transition-all active:scale-[0.97]",
                  showRaiseSlider
                    ? "bg-white/5 border-white/5 text-muted-foreground/40 cursor-not-allowed"
                    : facingBet
                      ? "bg-blue-500/20 border-blue-500/40 text-blue-300 hover:bg-blue-500/30 hover:border-blue-500/60"
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
                <span className="text-sm">
                  {showRaiseSlider
                    ? `${facingBet ? "Raise" : "Bet"} ${raiseSize}x`
                    : facingBet
                      ? "Raise"
                      : "Bet"}
                </span>
              </button>
            </div>
          </div>
        ) : null}
      </div>

      {/* Verdict Overlay - fixed overlay outside action panel, doesn't push content */}
      {showVerdict && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100] flex items-end justify-center p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-[390px] max-h-[85vh] overflow-y-auto animate-in slide-in-from-bottom-4 duration-300">
            <Card
              className={cn(
                "p-4 border-2 rounded-xl",
                isCorrect
                  ? "border-primary/60 bg-gradient-to-b from-primary/20 to-primary/5"
                  : "border-red-500/60 bg-gradient-to-b from-red-500/20 to-red-500/5",
              )}
            >
              {/* Verdict Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center text-base font-bold shadow-lg shrink-0",
                      isCorrect
                        ? "bg-primary text-primary-foreground shadow-primary/40"
                        : "bg-red-500 text-white shadow-red-500/40",
                    )}
                  >
                    {isCorrect ? "✓" : "✗"}
                  </div>
                  <div className="min-w-0">
                    <p className={cn("text-lg font-bold leading-tight mb-0.5", isCorrect ? "text-primary" : "text-red-400")}>
                      {verdictType === "correct" ? "Correct!" : verdictType === "mistake" ? "Mistake" : "Punt!"}
                    </p>
                    <span className={cn("text-xs font-semibold block", isCorrect ? "text-primary/80" : "text-red-400/80")}>
                      EV: {correctEv >= 0 ? "+" : ""}
                      {correctEv.toFixed(1)}bb
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setBookmarked(!bookmarked)}
                  className={cn(
                    "w-9 h-9 rounded-lg flex items-center justify-center transition-all shrink-0",
                    bookmarked
                      ? "bg-primary/20 text-primary"
                      : "bg-white/10 text-muted-foreground hover:text-foreground",
                  )}
                >
                  <Bookmark className="w-4 h-4" fill={bookmarked ? "currentColor" : "none"} />
                </button>
              </div>

              {/* Multi-step reflection: each street's decision */}
              <div className="mb-4 space-y-2">
                {hand.steps.map((step, index) => {
                  const res = stepResults[index]
                  const isThisStep = index === currentStepIndex
                  return (
                    <div
                      key={step.id}
                      className={cn(
                        "px-3 py-2.5 rounded-lg border flex flex-col gap-1",
                        res?.correct
                          ? "border-primary/40 bg-primary/5"
                          : "border-red-500/40 bg-red-500/5",
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                          {step.street.toUpperCase()}
                        </span>
                        {res && (
                          <span className="text-[10px] font-semibold text-foreground/80">
                            {res.correct ? "Optimal" : "Off-plan"}
                          </span>
                        )}
                      </div>
                      <div className="flex text-[11px] gap-3">
                        <div className="flex-1 min-w-0">
                          <span className="block text-[10px] text-muted-foreground uppercase tracking-wider">You</span>
                          <span className="block font-semibold truncate">{res?.userAction ?? "(no action)"}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="block text-[10px] text-muted-foreground uppercase tracking-wider">Optimal</span>
                          <span className="block font-semibold text-primary truncate">
                            {res?.optimalAction ?? "-"}
                            {res?.optimalSizing ? ` ${res.optimalSizing}bb` : ""}
                          </span>
                        </div>
                        <div className="w-[70px] text-right">
                          <span className="block text-[10px] text-muted-foreground uppercase tracking-wider">EV</span>
                          <span className="block text-[11px] font-semibold">
                            {res
                              ? `${res.ev >= 0 ? "+" : ""}${res.ev.toFixed(1)}bb`
                              : "--"}
                          </span>
                        </div>
                      </div>
                      {res && (
                        <p className="mt-1 text-[10px] text-foreground/80 leading-snug">
                          {res.explanation}
                        </p>
                      )}
                    </div>
                  )
                })}
              </div>

              {/* Range toggle */}
              <button
                onClick={() => setShowRange(!showRange)}
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-3 w-full"
              >
                <Eye className="w-3.5 h-3.5 shrink-0" />
                <span>{showRange ? "Hide" : "View"} Range</span>
                <ChevronDown className={cn("w-3.5 h-3.5 transition-transform ml-auto", showRange && "rotate-180")} />
              </button>

              {showRange && (
                <div className="bg-white/5 rounded-lg p-2.5 mb-4 animate-in fade-in duration-150 overflow-x-auto">
                  <div className="grid grid-cols-13 gap-px min-w-max">
                    {Array.from({ length: 13 * 13 }).map((_, i) => (
                      <div
                        key={i}
                        className={cn(
                          "aspect-square rounded-sm w-3 h-3",
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
                className="w-full h-12 font-bold bg-primary text-primary-foreground rounded-xl text-sm hover:bg-primary/90 shadow-lg shadow-primary/30 mt-2"
              >
                Next Hand
              </Button>
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}
