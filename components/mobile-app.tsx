"use client"

import { useState, useMemo } from "react"
import { BottomNav } from "@/components/ui/bottom-nav"
import { HomeScreen } from "@/components/screens/home-screen"
import { DrillScreen } from "@/components/screens/drill-screen"
import { LeaksScreen } from "@/components/screens/leaks-screen"
import { ProfileScreen } from "@/components/screens/profile-screen"
import { ReviewScreen } from "@/components/screens/review-screen"
import { SessionSummaryScreen } from "@/components/screens/session-summary-screen"
import { mockLeaks, mockMistakes, mockScenarios, mockUserStats } from "@/lib/mock-data"
import { generateRandomMultiStreetHand } from "@/lib/hand-generator"
import type { HandScenario, MultiStreetHand, Mistake, Leak } from "@/lib/mock-data"

export type Screen = "home" | "drill" | "review" | "leaks" | "summary" | "profile"

export function MobileApp() {
  const [currentScreen, setCurrentScreen] = useState<Screen>("home")
  const [userStats, setUserStats] = useState(mockUserStats)
  const [currentHandIndex, setCurrentHandIndex] = useState(0)
  const [sessionMistakes, setSessionMistakes] = useState<Mistake[]>([])
  const [sessionCorrect, setSessionCorrect] = useState(0)
  const [drillType, setDrillType] = useState<"daily" | "weakness">("daily")
  const [sessionLeaks, setSessionLeaks] = useState<Leak[]>(mockLeaks)
  const [sessionTotalEvLoss, setSessionTotalEvLoss] = useState(0)
  
  // Generate random multi-street hands for daily training
  const randomHands: MultiStreetHand[] = useMemo(() => {
    return Array.from({ length: 10 }, (_, i) => generateRandomMultiStreetHand(`random-${i + 1}`))
  }, [currentScreen === "home"]) // Regenerate when returning to home

  const startDrill = (type: "daily" | "weakness" = "daily") => {
    setDrillType(type)
    setCurrentHandIndex(0)
    setSessionMistakes([])
    setSessionCorrect(0)
    setSessionLeaks(mockLeaks)
    setSessionTotalEvLoss(0)
    setCurrentScreen("drill")
  }

  const recomputeLeaksFromMistakes = (mistakes: Mistake[]): Leak[] => {
    if (!mistakes.length) return mockLeaks

    const EV_TOLERANCE = 0.5
    const byCategory: Record<string, { mistakeSteps: number; totalSteps: number; evLoss: number }> = {}

    for (const m of mistakes) {
      const steps = m.steps || []
      for (const step of steps) {
        const cat = step.category
        if (!byCategory[cat]) {
          byCategory[cat] = { mistakeSteps: 0, totalSteps: 0, evLoss: 0 }
        }
        byCategory[cat].totalSteps += 1
        if (step.evLoss > EV_TOLERANCE) {
          byCategory[cat].mistakeSteps += 1
        }
        byCategory[cat].evLoss += step.evLoss
      }
    }

    const leaks: Leak[] = Object.entries(byCategory).map(([category, stats], index) => ({
      id: String(index + 1),
      category,
      mistakeRate: stats.totalSteps ? Math.round((stats.mistakeSteps / stats.totalSteps) * 100) : 0,
      evLoss: Number(stats.evLoss.toFixed(1)),
      description: `${category} spots based on recent drills`,
    }))

    // Sort by highest EV loss first so worst leaks are on top
    leaks.sort((a, b) => b.evLoss - a.evLoss)
    return leaks
  }

  const handleDecision = (correct: boolean, mistake?: Mistake) => {
    if (correct) {
      setSessionCorrect((prev) => prev + 1)
    } else if (mistake) {
      setSessionMistakes((prev) => {
        const next = [...prev, mistake]
        setSessionLeaks(recomputeLeaksFromMistakes(next))
        const addedEvLoss = mistake.totalEvLoss ?? 0
        setSessionTotalEvLoss((prevLoss) => prevLoss + addedEvLoss)
        return next
      })
    }

    setUserStats((prev) => ({
      ...prev,
      todayDecisions: prev.todayDecisions + 1,
      rating: prev.rating + (correct ? 8 : -5),
    }))
  }

  const nextHand = () => {
    if (currentHandIndex >= 9) {
      setCurrentScreen("summary")
    } else {
      setCurrentHandIndex((prev) => prev + 1)
    }
  }

  const renderScreen = () => {
    switch (currentScreen) {
      case "home":
        return (
          <HomeScreen userStats={userStats} onStartDrill={() => startDrill("daily")} onNavigate={setCurrentScreen} />
        )
      case "drill":
        // Use random multi-street hands for daily training,
        // and wrap mockScenarios as single-step hands for weakness drills.
        const weaknessHands: MultiStreetHand[] = mockScenarios.map((s) => {
          if (s.street === "preflop") {
            return { id: s.id, steps: [s] }
          }
          const prefix = generateRandomMultiStreetHand(`weakness-${s.id}`).steps[0]
          const preflop: HandScenario = {
            ...prefix,
            id: `${s.id}-preflop`,
            stackDepth: s.stackDepth,
            blinds: s.blinds,
            heroHand: s.heroHand,
            category: s.category,
          }
          return { id: s.id, steps: [preflop, s] }
        })
        const hand: MultiStreetHand =
          drillType === "daily" ? randomHands[currentHandIndex] : weaknessHands[currentHandIndex % weaknessHands.length]

        return (
          <DrillScreen
            hand={hand}
            handNumber={currentHandIndex + 1}
            totalHands={10}
            drillType={drillType}
            onDecision={handleDecision}
            onNext={nextHand}
            onExit={() => setCurrentScreen("home")}
          />
        )
      case "review":
        return (
          <ReviewScreen
            mistakes={sessionMistakes.length ? sessionMistakes : mockMistakes}
            onReplaySpot={(id) => {
              setCurrentHandIndex(Number.parseInt(id) - 1)
              setCurrentScreen("drill")
            }}
            onBack={() => setCurrentScreen("home")}
          />
        )
      case "leaks":
        return (
          <LeaksScreen
            onStartWeaknessDrill={() => startDrill("weakness")}
            onBack={() => setCurrentScreen("home")}
            leaks={sessionLeaks}
          />
        )
      case "summary":
        return (
          <SessionSummaryScreen
            correctCount={sessionCorrect}
            totalHands={10}
            ratingChange={sessionCorrect * 8 - (10 - sessionCorrect) * 5}
            streak={userStats.streak}
            onWeaknessDrill={() => startDrill("weakness")}
            onHome={() => setCurrentScreen("home")}
          />
        )
      case "profile":
        return <ProfileScreen userStats={userStats} onBack={() => setCurrentScreen("home")} />
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-[390px] h-[844px] bg-background rounded-[2.5rem] overflow-hidden relative border border-border/50 shadow-2xl shadow-primary/5">
        {/* Screen content - fixed height, no scroll on home */}
        <div
          className={`h-full ${currentScreen === "home" || currentScreen === "drill" ? "overflow-hidden" : "overflow-y-auto"}`}
        >
          {renderScreen()}
        </div>

        {/* Bottom navigation */}
        {currentScreen !== "drill" && currentScreen !== "summary" && (
          <BottomNav currentScreen={currentScreen} onNavigate={setCurrentScreen} />
        )}
      </div>
    </div>
  )
}
