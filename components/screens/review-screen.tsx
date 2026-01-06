"use client"

import { ArrowLeft, TrendingUp, ChevronRight, RefreshCw } from "lucide-react"
import { Card } from "@/components/ui/card"
import { PlayingCard } from "@/components/ui/playing-card"
import type { Mistake } from "@/lib/mock-data"

interface ReviewScreenProps {
  mistakes: Mistake[]
  onReplaySpot: (id: string) => void
  onBack: () => void
}

export function ReviewScreen({ mistakes, onReplaySpot, onBack }: ReviewScreenProps) {
  return (
    <div className="px-5 py-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={onBack} className="p-2 -ml-2 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-foreground">Review</h1>
          <p className="text-sm text-muted-foreground">Your recent mistakes</p>
        </div>
      </div>

      {/* Improved Today Highlight */}
      <Card className="glass p-4 mb-6 border-primary/30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="font-medium text-foreground">River Value Improved!</p>
            <p className="text-sm text-muted-foreground">+12% accuracy this week</p>
          </div>
        </div>
      </Card>

      {/* Mistakes List */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Worst 3 Mistakes Today</h2>
        {mistakes.map((mistake, index) => (
          <Card
            key={mistake.id}
            className="glass p-4 cursor-pointer hover:border-primary/50 transition-colors"
            onClick={() => onReplaySpot(mistake.id)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-destructive/20 flex items-center justify-center text-destructive font-bold">
                  {index + 1}
                </div>
                <div>
                  <p className="font-medium text-foreground">{mistake.category}</p>
                  <p className="text-sm text-muted-foreground">
                    {mistake.hand.position} • {mistake.hand.street}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  <PlayingCard card={mistake.hand.heroHand[0]} size="sm" />
                  <PlayingCard card={mistake.hand.heroHand[1]} size="sm" />
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Replay Button */}
      <Card className="glass p-4 mt-6">
        <button
          onClick={() => onReplaySpot(mistakes[0]?.id || "1")}
          className="flex items-center justify-center gap-2 w-full text-primary font-medium"
        >
          <RefreshCw className="w-5 h-5" />
          Replay All Mistakes
        </button>
      </Card>
    </div>
  )
}
