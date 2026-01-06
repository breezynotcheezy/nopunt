"use client"

import { useState, useEffect } from "react"
import { Trophy, TrendingUp, Flame, Share2, Lightbulb, Target } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface SessionSummaryScreenProps {
  correctCount: number
  totalHands: number
  ratingChange: number
  streak: number
  onWeaknessDrill: () => void
  onHome: () => void
}

export function SessionSummaryScreen({
  correctCount,
  totalHands,
  ratingChange,
  streak,
  onWeaknessDrill,
  onHome,
}: SessionSummaryScreenProps) {
  const [showStreakAnimation, setShowStreakAnimation] = useState(false)
  const percentage = Math.round((correctCount / totalHands) * 100)

  const getGrade = () => {
    if (percentage >= 90) return "A"
    if (percentage >= 80) return "B"
    if (percentage >= 70) return "C"
    if (percentage >= 60) return "D"
    return "F"
  }

  const getGradeColor = () => {
    const grade = getGrade()
    if (grade === "A") return "text-primary"
    if (grade === "B") return "text-chart-2"
    if (grade === "C") return "text-accent"
    return "text-muted-foreground"
  }

  useEffect(() => {
    const timer = setTimeout(() => setShowStreakAnimation(true), 500)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="px-5 py-4 min-h-full flex flex-col">
      {/* Header */}
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-foreground mb-2">Session Complete!</h1>
        <p className="text-muted-foreground">Great work finishing your drill</p>
      </div>

      {/* Grade Card */}
      <Card className="glass p-6 text-center mb-4">
        <div className="relative inline-block mb-4">
          <div
            className={cn(
              "w-24 h-24 rounded-full flex items-center justify-center text-5xl font-bold border-4",
              getGradeColor(),
              "border-current",
            )}
          >
            {getGrade()}
          </div>
          {showStreakAnimation && (
            <div className="absolute -right-2 -top-2 animate-float">
              <div className="flex items-center gap-1 bg-primary px-2 py-1 rounded-full">
                <Flame className="w-4 h-4 text-primary-foreground" />
                <span className="text-sm font-bold text-primary-foreground">{streak}</span>
              </div>
            </div>
          )}
        </div>
        <p className="text-lg text-foreground mb-2">
          {correctCount}/{totalHands} Correct ({percentage}%)
        </p>
        <div className="flex items-center justify-center gap-2">
          <TrendingUp className={cn("w-5 h-5", ratingChange >= 0 ? "text-primary" : "text-accent")} />
          <span className={cn("text-2xl font-bold", ratingChange >= 0 ? "text-primary" : "text-accent")}>
            {ratingChange >= 0 ? "+" : ""}
            {ratingChange}
          </span>
          <span className="text-muted-foreground">rating</span>
        </div>
      </Card>

      {/* Takeaways */}
      <div className="space-y-3 mb-6">
        <Card className="glass p-4 border-primary/30">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
              <Trophy className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-medium text-foreground">One Thing You Did Well</p>
              <p className="text-sm text-muted-foreground">
                Strong 3-bet decisions from the button - you correctly identified value spots.
              </p>
            </div>
          </div>
        </Card>

        <Card className="glass p-4 border-accent/30">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center flex-shrink-0">
              <Lightbulb className="w-5 h-5 text-accent" />
            </div>
            <div>
              <p className="font-medium text-foreground">One Thing to Fix</p>
              <p className="text-sm text-muted-foreground">
                River bet sizing - consider larger value bets on brick runouts.
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Share Card Preview */}
      <Card className="glass p-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Target className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <p className="font-semibold text-foreground">Rating Card</p>
              <p className="text-sm text-muted-foreground">Share your progress</p>
            </div>
          </div>
          <button className="p-2 bg-secondary rounded-lg text-muted-foreground hover:text-foreground">
            <Share2 className="w-5 h-5" />
          </button>
        </div>
      </Card>

      {/* Action Buttons */}
      <div className="mt-auto space-y-3">
        <Button
          onClick={onWeaknessDrill}
          variant="outline"
          className="w-full h-12 text-accent border-accent/50 hover:bg-accent/10 bg-transparent"
        >
          5-min Weakness Drill
        </Button>
        <Button onClick={onHome} className="w-full h-12 bg-primary text-primary-foreground">
          Back to Home
        </Button>
      </div>
    </div>
  )
}
