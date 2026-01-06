"use client"

import { ArrowLeft, Lock, Zap, TrendingDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { mockLeaks } from "@/lib/mock-data"

interface LeaksScreenProps {
  onStartWeaknessDrill: () => void
  onBack: () => void
}

export function LeaksScreen({ onStartWeaknessDrill, onBack }: LeaksScreenProps) {
  return (
    <div className="px-5 py-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={onBack} className="p-2 -ml-2 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-foreground">Leaks</h1>
          <p className="text-sm text-muted-foreground">Your weaknesses</p>
        </div>
      </div>

      {/* Weakness Drill CTA - Updated to accent purple */}
      <Card className="glass p-5 mb-6 border-accent/30">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center">
            <Zap className="w-6 h-6 text-accent" />
          </div>
          <div>
            <h2 className="font-semibold text-lg text-foreground">Targeted Drill</h2>
            <p className="text-sm text-muted-foreground">5 min • Focus on your worst leaks</p>
          </div>
        </div>
        <Button
          onClick={onStartWeaknessDrill}
          className="w-full h-12 bg-accent hover:bg-accent/90 text-accent-foreground"
        >
          Start Weakness Drill
        </Button>
      </Card>

      {/* Leaks List */}
      <div className="space-y-3 mb-6">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Your Leaks</h2>
        {mockLeaks.map((leak) => (
          <Card key={leak.id} className="glass p-4">
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="font-medium text-foreground">{leak.category}</p>
                <p className="text-sm text-muted-foreground">{leak.description}</p>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-1 text-accent">
                  <TrendingDown className="w-4 h-4" />
                  <span className="font-semibold">{leak.evLoss.toFixed(1)}bb</span>
                </div>
                <p className="text-xs text-muted-foreground">EV Loss</p>
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Mistake rate</span>
                <span className="text-accent font-medium">{leak.mistakeRate}%</span>
              </div>
              <Progress value={leak.mistakeRate} className="h-1.5 bg-secondary [&>div]:bg-accent" />
            </div>
          </Card>
        ))}
      </div>

      {/* Pro Teaser */}
      <Card className="glass p-4 border-primary/30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
            <Lock className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1">
            <p className="font-medium text-foreground">Full Leak Report</p>
            <p className="text-sm text-muted-foreground">Deep analysis • Pro</p>
          </div>
          <div className="px-2 py-1 bg-primary/20 rounded-full">
            <span className="text-xs font-semibold text-primary">PRO</span>
          </div>
        </div>
      </Card>
    </div>
  )
}
