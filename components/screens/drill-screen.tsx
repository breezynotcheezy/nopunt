"use client"

import { useState, useEffect } from "react"
import { X, Bookmark, ChevronDown, Eye, Minus, Plus, HelpCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { PokerTable } from "@/components/ui/poker-table"
import { VerticalWheel } from "@/components/ui/vertical-wheel"
import type { HandScenario, Mistake, MultiStreetHand, Player } from "@/lib/mock-data"
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
  const [raiseSize, setRaiseSize] = useState(1)
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
  const [dealerIsHero, setDealerIsHero] = useState<boolean>(true)
  const [isVillainAnimating, setIsVillainAnimating] = useState(false)
  const [playersLocal, setPlayersLocal] = useState<Player[]>(currentScenario.players)
  const [potLocal, setPotLocal] = useState<number>(currentScenario.potSize)
  const [heroStackLocal, setHeroStackLocal] = useState<number>(currentScenario.stackDepth)
  const [villainBetLocal, setVillainBetLocal] = useState<number>(0)
  const [villainBetAdded, setVillainBetAdded] = useState<boolean>(false)
  const [villainThinking, setVillainThinking] = useState<boolean>(false)
  const [preflopPosted, setPreflopPosted] = useState<boolean>(false)

  type StepResult = {
    street: HandScenario["street"]
    userAction: string
    userSizing: number | null
    optimalAction: string
    optimalSizing: number | null
    ev: number
    explanation: string
    correct: boolean
    evLoss: number
    verdictLabel: "Good" | "Close" | "Mistake"
    shortReason: string
    concept: string
    actionRule: string
    confidence: "High" | "Medium" | "Low"
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
    setRaiseSize(1)
    setHeroVisualAction(null)
    setHeroVisualSize(null)
    const firstStep = hand.steps[0]
    const players0 = firstStep?.players || []
    const pos = (firstStep?.position || "").toUpperCase()
    const heroIsDealer = players0.some((p) => p.isDealer && p.position === firstStep?.position) || ["BTN", "SB", "BU"].includes(pos)
    setDealerIsHero(heroIsDealer)
    setVillainThinking(false)
    setPreflopPosted(false)
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

  // Initialize live stacks/pot based on the scenario and parsed villain action each street
  useEffect(() => {
    const opp = currentScenario.players.find((p) => p.isActive && !p.isFolded)
    let vb = 0
    const betMatch = currentScenario.action?.match(/bet[s]?\s+(\d+)/i)
    if (betMatch) vb = Number(betMatch[1]) || 0
    else if (typeof opp?.betAmount === "number" && opp.betAmount > 0) vb = opp.betAmount

    const nextPlayers = currentScenario.players.map((p) => {
      if (p === opp && vb > 0) {
        return { ...p, betAmount: vb, stack: Math.max(0, (p.stack || 0) - vb) }
      }
      return p
    })

    setPlayersLocal(nextPlayers)
    const potWithoutVillainBet = vb > 0 ? Math.max(0, currentScenario.potSize - vb) : currentScenario.potSize
    setPotLocal(potWithoutVillainBet)
    setHeroStackLocal(currentScenario.stackDepth)
    setVillainBetLocal(Math.max(0, Math.round(vb)))
    setVillainBetAdded(false)
  }, [currentScenario])

  const handleAction = (action: string, sizing?: number) => {
    const finalAction = sizing ? `${action} ${sizing}bb` : action
    setHeroVisualAction(action.toLowerCase())
    setHeroVisualSize(sizing ?? null)
    setSelectedAction(finalAction)

    // Use the effectiveCorrectAction as the authoritative solution for this street
    // (AI optimalAction when available, otherwise the scenario's correctAction).
    const correctAction = effectiveCorrectAction
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

    // Live stack/pot updates for intuitive chip movement
    const vb = villainBetLocal
    if (userActionNormalized === "check") {
      // no change
    } else if (userActionNormalized === "call") {
      const alreadyPosted = currentScenario.street === 'preflop' ? (dealerIsHero ? 1 : 2) : 0
      const needed = Math.max(0, Math.round(vb) - alreadyPosted)
      const commit = Math.max(0, Math.min(needed, Math.round(heroStackLocal)))
      if (commit > 0) {
        setHeroStackLocal((s) => Math.max(0, s - commit))
        setPotLocal((p) => p + commit)
        setPlayersLocal((arr) => arr.map((p) => (p.isActive && !p.isFolded ? { ...p, betAmount: 0 } : p)))
        setVillainBetLocal(0)
      }
    } else if (userActionNormalized === "bet") {
      const betTo = Math.max(1, Math.round(sizing ?? 1))
      const commit = Math.max(0, Math.min(betTo, Math.round(heroStackLocal)))
      if (commit > 0) {
        setHeroStackLocal((s) => Math.max(0, s - commit))
        setPotLocal((p) => p + commit)
      }
    } else if (userActionNormalized === "raise") {
      const raiseTo = Math.max(1, Math.round(sizing ?? 1))
      const diff = Math.max(0, raiseTo - Math.round(vb))
      const commit = Math.max(0, Math.min(diff, Math.round(heroStackLocal)))
      if (commit > 0) {
        setHeroStackLocal((s) => Math.max(0, s - commit))
        setPotLocal((p) => p + commit)
        setPlayersLocal((arr) => arr.map((p) => (p.isActive && !p.isFolded ? { ...p, betAmount: 0 } : p)))
        setVillainBetLocal(0)
      }
    }

    // Helpers to translate EV to human labels and generate concise coaching
    const toVerdictLabel = (loss: number): "Good" | "Close" | "Mistake" => {
      if (loss <= EV_TOLERANCE) return "Good"
      if (loss <= 1.0) return "Close"
      return "Mistake"
    }

    const confidenceLevel = (): "High" | "Medium" | "Low" => {
      if (aiActions && aiAction) return "High"
      if (aiActions) return "Medium"
      return "Low"
    }

    const nextTimeRule = (): string => {
      const s = currentScenario.street
      const act = correctAction
      const sizeTxt = typeof correctSizing === "number" ? ` ${correctSizing}bb` : ""
      if (s === "preflop") return act === "fold" ? "Tighten up out of position vs raises." : act === "call" ? "Call more in position vs smaller opens." : `Prefer ${act}${sizeTxt} from this position.`
      if (s === "flop") return act === "bet" || act === "raise" ? "On dry boards, take initiative with small bets." : act === "call" ? "Keep your range wide; call and realize equity." : "Slow down on unfavorable textures."
      if (s === "turn") return act === "bet" || act === "raise" ? "Continue barreling strong draws and top pairs." : act === "call" ? "Control pot and take your equity when pressured." : "Avoid over-bluffing once ranges tighten."
      // river
      return act === "call" ? "Bluff-catch when you don't block missed draws." : act === "bet" || act === "raise" ? "Value bet thinly when worse hands call." : "Fold when blockers are bad and story is strong."
    }

    const oneConcept = (): string => {
      const s = currentScenario.street
      if (s === "preflop") return dealerIsHero ? "In position you can loosen vs small opens." : "Out of position you should tighten vs pressure."
      if (s === "flop") return "Range advantage dictates small-bet frequency on dry boards."
      if (s === "turn") return "Turn cards shrink bluffing ranges; continue with equity/value."
      return "Bluff-catch with good unblockers; avoid blocking missed draws."
    }

    const shortReason = (): string => {
      if (correctAction === "bet" || correctAction === "raise") return "This pressure prints versus capped ranges."
      if (correctAction === "call") return "Calling realizes equity and avoids thin spew."
      return "Folding avoids paying off stronger ranges."
    }

    // Record per-street result and compute updated results array
    const nextResults: StepResult[] = [...stepResults]

    const correctKey = correctAction.toLowerCase()
    const userSize = typeof sizing === "number" ? Math.round(sizing) : null
    // Build solver-specific explanation with precise context
    const suitMap: Record<string, string> = { s: "♠", h: "♥", d: "♦", c: "♣" }
    const fmtCard = (c: string) => `${c.slice(0, -1)}${suitMap[c.slice(-1).toLowerCase()] || c.slice(-1)}`
    const fmtHand = (h: [string, string]) => `${fmtCard(h[0])} ${fmtCard(h[1])}`
    const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)
    const actionPhrase = (a: string, sz: number | null) => {
      const t = a.toLowerCase()
      if (t === "raise") return typeof sz === "number" ? `Raise to ${sz}bb` : "Raise"
      if (t === "bet") return typeof sz === "number" ? `Bet ${sz}bb` : "Bet"
      if (t === "call") return "Call"
      if (t === "fold") return "Fold"
      return cap(t)
    }
    const facing = currentScenario.action
    const streetLabel = cap(currentScenario.street)
    const rec = actionPhrase(correctAction, correctSizing ?? null)
    const header = `With ${fmtHand(currentScenario.heroHand)} at ${currentScenario.position} on ${streetLabel}, facing: ${facing}. Recommended: ${rec}.`
    const aiExpl = aiActions && aiActions[correctKey] && aiActions[correctKey].explanation ? aiActions[correctKey].explanation : (aiSolution || "")
    let stepExplanation = header + (aiExpl ? ` ${aiExpl}` : "")

    nextResults[currentStepIndex] = {
      street: currentScenario.street,
      userAction: finalAction,
      userSizing: userSize,
      optimalAction: correctAction,
      optimalSizing: correctSizing ?? null,
      ev: correctEv,
      explanation: stepExplanation,
      correct: isCorrect,
      evLoss,
      verdictLabel: toVerdictLabel(evLoss),
      shortReason: shortReason(),
      concept: oneConcept(),
      actionRule: nextTimeRule(),
      confidence: confidenceLevel(),
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
      setTimeout(() => {
        if (!aiLoading) setShowVerdict(true)
        else setTimeout(() => setShowVerdict(true), 800)
      }, 200)
    } else {
      // Allow a short "villain thinking" phase before we reveal the next street.
      setShowRaiseSlider(false)
      setVillainThinking(true)
      setTimeout(() => {
        setVillainThinking(false)
        setRaiseSize(1)
        setHeroVisualAction(null)
        setHeroVisualSize(null)
        setSelectedAction(null)
        setCurrentStepIndex((prev) => prev + 1)
      }, 2000)
    }
  }

  const handleRaiseClick = () => {
    if (showRaiseSlider) {
      const min = facingBet
        ? Math.min(currentScenario.stackDepth, Math.max(1, (activeOpponent?.betAmount ?? 0) + 1))
        : 1
      const max = currentScenario.stackDepth
      const chosen = Math.max(min, Math.min(max, Math.round(raiseSize)))
      handleAction(facingBet ? "Raise" : "Bet", chosen)
    } else {
      const min = facingBet
        ? Math.min(currentScenario.stackDepth, Math.max(1, (activeOpponent?.betAmount ?? 0) + 1))
        : 1
      setRaiseSize(min)
      setShowRaiseSlider(true)
    }
  }

  const handleCancelRaise = () => {
    setShowRaiseSlider(false)
    setRaiseSize(1)
  }

  const handleNext = () => {
    setSelectedAction(null)
    setShowVerdict(false)
    setShowRange(false)
    setBookmarked(false)
    setShowRaiseSlider(false)
    setRaiseSize(1)
    setHeroVisualAction(null)
    setHeroVisualSize(null)
    setCurrentStepIndex(0)
    setStepResults([])
    onNext()
  }

  // Determine correct action, preferring the AI solver's optimalAction once loaded.
  const effectiveCorrectAction = (aiAction || currentScenario.correctAction || "call").toLowerCase()

  // Prefer scenario sizing; if absent, fall back to AI sizing suggestion.
  const correctSizing = currentScenario.correctSizing ?? aiSizing ?? null

  // Compute EV for the effective correct action:
  // - If the AI provided an EV entry for that action, use it.
  // - Otherwise, fall back to the scenario's evDelta.
  // - If neither is available, use the best AI EV as a baseline.
  let correctEv = currentScenario.evDelta

  if (aiActions) {
    const key = effectiveCorrectAction
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
  const activeOpponent = currentScenario.players.find(p => p.isActive && !p.isFolded && p.position !== currentScenario.position)
  const parseStreetAction = (s: string): { type: 'bet' | 'check' | 'none'; size?: number } => {
    if (!s) return { type: 'none' }
    const betMatch = s.match(/bet[s]?\s+(\d+)/i)
    if (betMatch) return { type: 'bet', size: Number(betMatch[1]) }
    if (/check[s]?/i.test(s)) return { type: 'check' }
    return { type: 'none' }
  }
  const parsed = parseStreetAction(currentScenario.action)
  const facingBetFromAction = parsed.type === 'bet' ? true : parsed.type === 'check' ? false : undefined
  const postedHeroPreflop = currentScenario.street === 'preflop' ? (dealerIsHero ? 1 : 2) : 0
  const oppBetEffective = currentScenario.street === 'preflop'
    ? Math.max(villainBetLocal, activeOpponent?.betAmount ?? 0)
    : Math.max(villainBetLocal, activeOpponent?.betAmount ?? 0)
  const facingBet = (() => {
    if (typeof facingBetFromAction === 'boolean') return facingBetFromAction
    if (currentScenario.street === 'preflop') {
      return oppBetEffective > postedHeroPreflop
    }
    return oppBetEffective > 0
  })()
  const callCostUnits = facingBet ? Math.max(0, Math.round(oppBetEffective) - postedHeroPreflop) : 0

  useEffect(() => {
    if (currentScenario.street !== 'preflop' || preflopPosted) return
    const parseBlinds = (b: string): [number, number] => {
      const m = (b || '').split('/')
      const sb = Math.max(1, Math.round(Number(m[0] || 1)))
      const bb = Math.max(sb, Math.round(Number(m[1] || sb * 2)))
      return [sb, bb]
    }
    const [sbAmt, bbAmt] = parseBlinds(currentScenario.blinds)
    const heroPost = dealerIsHero ? sbAmt : bbAmt
    const oppPost = dealerIsHero ? bbAmt : sbAmt
    const opp = currentScenario.players.find((p) => p.isActive && !p.isFolded && p.position !== currentScenario.position)

    setPlayersLocal((arr) =>
      arr.map((p) => {
        if (p.position === currentScenario.position) {
          return { ...p, betAmount: heroPost, stack: Math.max(0, (p.stack || 0) - heroPost) }
        }
        if (opp && p.position === opp.position) {
          return { ...p, betAmount: oppPost, stack: Math.max(0, (p.stack || 0) - oppPost) }
        }
        return p
      }),
    )
    setHeroStackLocal(Math.max(0, currentScenario.stackDepth - heroPost))
    setPotLocal(heroPost + oppPost)
    setVillainBetLocal(0)
    setPreflopPosted(true)

    if (!dealerIsHero && opp) {
      setVillainThinking(true)
      const openTo = Math.max(bbAmt * 2, bbAmt + 3)
      const add = Math.max(0, openTo - oppPost)
      const t = setTimeout(() => {
        setPlayersLocal((arr) =>
          arr.map((p) =>
            p.position === opp.position ? { ...p, betAmount: openTo, stack: Math.max(0, (p.stack || 0) - add) } : p,
          ),
        )
        setVillainBetLocal(openTo)
        setPotLocal((p) => p + add)
        setVillainThinking(false)
      }, 1000)
      return () => clearTimeout(t)
    }
  }, [currentScenario.id, dealerIsHero, preflopPosted])

  const totalEvLossForHand = stepResults.reduce((sum, r) => sum + (r?.evLoss ?? 0), 0)
  const isCorrect = stepResults.length > 0 && stepResults.every((r) => r?.correct)
  const verdictType = isCorrect ? "correct" : totalEvLossForHand > EV_PUNT_THRESHOLD ? "punt" : "mistake"

  // When a new street loads where the villain acts first (bet or check),
  // briefly show a "thinking" phase so their action is not instant.
  useEffect(() => {
    const a = parseStreetAction(currentScenario.action)
    if (a.type === 'bet' || a.type === 'check') {
      setVillainThinking(true)
      const ms = a.type === 'bet' ? 1200 : 800
      const t = setTimeout(() => setVillainThinking(false), ms)
      return () => clearTimeout(t)
    }
    setVillainThinking(false)
  }, [currentScenario.id])

  // Preflop SB-first interval: if hero is BB and scenario doesn't specify a villain bet/check yet,
  // briefly show villain thinking before hero can act.
  useEffect(() => {
    if (currentScenario.street === 'preflop' && currentScenario.position === 'BB') {
      const a = parseStreetAction(currentScenario.action)
      if (a.type === 'none') {
        setVillainThinking(true)
        const t = setTimeout(() => setVillainThinking(false), 800)
        return () => clearTimeout(t)
      }
    }
  }, [currentScenario.id])

  useEffect(() => {
    const a = parseStreetAction(currentScenario.action)
    if (a.type === 'bet' || a.type === 'check') {
      setIsVillainAnimating(true)
      const ms = a.type === 'bet' ? 1500 : 800
      const t = setTimeout(() => setIsVillainAnimating(false), ms)
      return () => clearTimeout(t)
    }
    setIsVillainAnimating(false)
  }, [currentScenario.id])

  // After villain bet animation completes, push their bet into the pot
  useEffect(() => {
    if (villainBetLocal > 0 && !villainBetAdded) {
      const betMatch = currentScenario.action?.match(/bet[s]?\s+(\d+)/i)
      if (betMatch) {
        const t = setTimeout(() => {
          setPotLocal((p) => p + villainBetLocal)
          setVillainBetAdded(true)
        }, 1500)
        return () => clearTimeout(t)
      }
    }
  }, [currentScenario.id, villainBetLocal, villainBetAdded])

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
          <span className="text-[10px] font-semibold text-muted-foreground/80">
            Blinds {currentScenario.blinds} · Stack {currentScenario.stackDepth}bb
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
      <div className="flex-1 min-h-0 px-2 pt-3">
        <PokerTable
          heroPosition={currentScenario.position}
          heroHand={currentScenario.heroHand}
          board={currentScenario.board}
          potSize={potLocal}
          action={currentScenario.action}
          stackDepth={heroStackLocal}
          blinds={currentScenario.blinds}
          players={playersLocal}
          heroAction={heroVisualAction as any}
          heroActionSizeBb={heroVisualSize}
          dealerIsHero={dealerIsHero}
          villainThinking={villainThinking}
          street={currentScenario.street}
        />
      </div>

      {/* Action Panel - fixed at bottom */}
      <div className="shrink-0 px-3 pb-4 pt-2 border-t border-white/5 bg-gradient-to-t from-background to-background/80">
        {!showVerdict ? (
          <div className="space-y-2">
            

            {/* Main Action Buttons */}
            <div className={cn("grid gap-3", facingBet ? "grid-cols-3" : "grid-cols-2")}>
              {/* Fold/Cancel - Only show if facing a bet */}
              {facingBet && (
                <button
                  disabled={showRaiseSlider || isVillainAnimating || villainThinking}
                  onClick={showRaiseSlider ? handleCancelRaise : () => handleAction("Fold")}
                  className={cn(
                    "h-14 flex flex-col items-center justify-center rounded-xl border-2 font-semibold transition-all active:scale-[0.97]",
                    showRaiseSlider
                      ? "bg-white/5 border-white/10 text-muted-foreground hover:text-foreground hover:bg-white/10"
                      : cn("bg-zinc-800/90 border-zinc-700/60 text-zinc-300 hover:bg-zinc-700/90 hover:border-zinc-600", (showRaiseSlider || isVillainAnimating) && "opacity-60 cursor-not-allowed"),
                  )}
                >
                  <span className="text-sm">{showRaiseSlider ? "Cancel" : "Fold"}</span>
                </button>
              )}

              {/* Check/Call */}
              <button
                onClick={() => handleAction(facingBet ? "Call" : "Check")}
                disabled={showRaiseSlider || isVillainAnimating || villainThinking}
                className={cn(
                  "h-14 flex flex-col items-center justify-center rounded-xl border-2 font-semibold transition-all active:scale-[0.97]",
                  (showRaiseSlider || isVillainAnimating)
                    ? "bg-white/5 border-white/5 text-muted-foreground/40 cursor-not-allowed"
                    : facingBet
                      ? "bg-blue-500/20 border-blue-500/40 text-blue-300 hover:bg-blue-500/30 hover:border-blue-500/60"
                      : "bg-white/10 border-white/20 text-foreground hover:bg-white/15 hover:border-white/30",
                )}
              >
                <span className="text-sm">{facingBet ? `Call ${callCostUnits}bb` : "Check"}</span>
              </button>

              {/* Raise/Bet/Confirm */}
              {!showRaiseSlider ? (
                <button
                  onClick={handleRaiseClick}
                  disabled={isVillainAnimating || villainThinking}
                  className={cn(
                    "h-14 flex flex-col items-center justify-center rounded-xl border-2 font-semibold transition-all active:scale-[0.97]",
                    "bg-primary/90 text-primary-foreground border-primary/60 hover:bg-primary hover:shadow-lg hover:shadow-primary/30",
                    isVillainAnimating && "opacity-60 cursor-not-allowed",
                  )}
                >
                  <span className="text-sm">{facingBet ? "Raise" : "Bet"}</span>
                </button>
              ) : (
                <div className={cn(
                  "relative h-14 rounded-xl border-2 border-primary/60 bg-primary/20 text-primary-foreground flex items-center justify-center",
                  "shadow-lg shadow-primary/30",
                )}>
                  <div className="absolute bottom-[calc(100%+8px)] left-1/2 -translate-x-1/2 w-[156px] p-2 rounded-xl border border-primary/40 bg-background/95 backdrop-blur-xl shadow-[0_12px_32px_rgba(16,185,129,0.35)]">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-semibold">{facingBet ? "Raise" : "Bet"}</span>
                      <span className="text-sm font-black text-primary tabular-nums">{Math.round(raiseSize)}bb</span>
                    </div>
                    {(() => {
                      const min = facingBet
                        ? Math.min(heroStackLocal, Math.max(1, (activeOpponent?.betAmount ?? villainBetLocal) + 1))
                        : 2
                      const max = heroStackLocal
                      const options: number[] = []
                      for (let v = Math.max(min, 1); v <= max; v += 1) options.push(v)
                      if (!options.includes(min)) options.unshift(min)
                      if (!options.includes(max)) options.push(max)
                      return (
                        <VerticalWheel options={options} value={Math.round(raiseSize)} onChange={setRaiseSize} height={120} itemHeight={28} />
                      )
                    })()}
                    <div className="flex gap-1 mt-2">
                      <button onClick={handleCancelRaise} className="flex-1 py-1 text-[10px] font-semibold rounded-md bg-white/5 border border-white/10 hover:bg-white/10">Cancel</button>
                      <button onClick={handleRaiseClick} className="flex-1 py-1 text-[10px] font-bold rounded-md bg-primary text-primary-foreground shadow shadow-primary/30 hover:bg-primary/90">Confirm</button>
                    </div>
                  </div>
                  <span className="text-sm">Adjust</span>
                </div>
              )}
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
                      {verdictType === "correct"
                        ? hand.steps.length > 1
                          ? "Great Decisions"
                          : "Great Decision"
                        : verdictType === "mistake"
                        ? hand.steps.length > 1
                          ? "Review Needed"
                          : "Review Needed"
                        : "Punished"}
                    </p>
                    <span className="text-xs font-semibold block text-foreground/70">
                      {hand.steps.length > 1 ? "Solver-backed summary by street" : "Solver-backed summary for this street"}
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

              {/* Multi-step reflection: minimalist per-street coaching (verdict, action, reason, confidence) */}
              <div className="mb-4 space-y-2">
                {hand.steps.map((step, index) => {
                  const res = stepResults[index]
                  if (!res) return null
                  return (
                    <div
                      key={step.id}
                      className={cn(
                        "px-3 py-2.5 rounded-lg border flex flex-col gap-2",
                        res.verdictLabel === "Good"
                          ? "border-primary/40 bg-primary/5"
                          : res.verdictLabel === "Close"
                          ? "border-blue-400/40 bg-blue-500/5"
                          : "border-red-500/40 bg-red-500/5",
                      )}
                    >
                      {(() => {
                        const cap = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : "")
                        const act = cap(res.optimalAction?.toLowerCase() || "")
                        const reason = (() => {
                          const a = (res.optimalAction || "").toLowerCase()
                          if (a === "call") return "You beat bluffs and lose to value."
                          if (a === "fold") return "Too many better hands continue; save chips."
                          if (a === "bet") return "Build pot when called; they fold often enough."
                          if (a === "raise") return "Pressure weaker ranges; build value when called."
                          return "Make the solid choice and avoid thin spots."
                        })()
                        const dots = res.confidence === "High" ? "●●●" : res.confidence === "Medium" ? "●●" : "●"
                        return (
                          <>
                            <div className="flex items-center justify-between gap-2">
                              <span
                                className={cn(
                                  "text-[12px] font-bold px-2 py-0.5 rounded-full",
                                  res.verdictLabel === "Good"
                                    ? "bg-primary text-primary-foreground"
                                    : res.verdictLabel === "Close"
                                    ? "bg-blue-500 text-white"
                                    : "bg-red-600 text-white",
                                )}
                              >
                                {res.verdictLabel}
                              </span>
                              <span className="text-[12px] font-bold">{act}</span>
                              <span className="text-[12px] font-bold text-foreground/80">{dots} {res.confidence}</span>
                            </div>
                            <div className="text-[12px] text-foreground/90">{reason}</div>
                          </>
                        )
                      })()}
                    </div>
                  )
                })}
              </div>


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
