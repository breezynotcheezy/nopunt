"use client"

import { Zap, Play, TrendingUp, AlertTriangle, History, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { TIER_THRESHOLDS, type UserStats, type Screen } from "@/lib/mock-data"

interface HomeScreenProps {
  userStats: UserStats
  onStartDrill: () => void
  onNavigate: (screen: Screen) => void
}

export function HomeScreen({ userStats, onStartDrill, onNavigate }: HomeScreenProps) {
  const tierInfo = TIER_THRESHOLDS[userStats.tier]
  const nextTier = Object.entries(TIER_THRESHOLDS).find(([, info]) => info.min > tierInfo.max)

  return (
    <div className="h-full flex flex-col px-4 pt-3 pb-20 overflow-hidden">
      {/* Header - Centered app name */}
      <div className="shrink-0 flex items-center justify-center relative mb-4">
        {/* Streak badge - absolute positioned left */}
        <div className="absolute left-0 flex items-center gap-1 bg-primary/15 px-2 py-1 rounded-full border border-primary/25">
          <Zap className="w-3.5 h-3.5 text-primary fill-primary" />
          <span className="font-bold text-xs text-primary">{userStats.streak}</span>
        </div>
        {/* App name - centered */}
        <div className="text-center">
          <h1 className="text-2xl font-black tracking-tight">
            <span className="text-foreground">NO</span>
            <span className="text-primary ml-1">PUNT</span>
          </h1>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col gap-3 min-h-0">
        {/* Rating Card */}
        <div className="shrink-0 glass-strong rounded-2xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium mb-1">
                Your Rating
              </p>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-black tabular-nums tracking-tight" style={{ color: tierInfo.color }}>
                  {userStats.rating}
                </span>
                <span
                  className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                  style={{ backgroundColor: `${tierInfo.color}25`, color: tierInfo.color }}
                >
                  {userStats.tier}
                </span>
              </div>
            </div>
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/25 to-primary/10 flex items-center justify-center border border-primary/20">
              <TrendingUp className="w-6 h-6 text-primary" />
            </div>
          </div>
          {nextTier && (
            <div className="mt-3 pt-3 border-t border-white/10">
              <div className="flex justify-between text-[10px] text-muted-foreground mb-1.5">
                <span className="font-medium">{userStats.tier}</span>
                <span>
                  <span className="text-primary font-semibold">{nextTier[1].min - userStats.rating}</span> pts to{" "}
                  {nextTier[0]}
                </span>
              </div>
              <Progress value={userStats.tierProgress} className="h-1.5" />
            </div>
          )}
        </div>

        {/* Daily Drill Card - Large CTA */}
        <div className="shrink-0 glass rounded-2xl p-4 animate-glow relative overflow-hidden">
          {/* Background glow effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent pointer-events-none" />
          <div className="relative">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="font-bold text-lg text-foreground">Daily Training</h2>
                <p className="text-xs text-muted-foreground">10 hands • ~3 min</p>
              </div>
              <div className="w-11 h-11 rounded-xl bg-primary/20 flex items-center justify-center animate-float border border-primary/30">
                <Play className="w-5 h-5 text-primary ml-0.5" />
              </div>
            </div>
            <Button
              onClick={onStartDrill}
              className="w-full h-12 text-base font-bold bg-primary hover:bg-primary/90 text-black rounded-xl shadow-lg shadow-primary/30 transition-all hover:shadow-xl hover:shadow-primary/40"
            >
              Start Training
            </Button>
          </div>
        </div>

        {/* Today's Progress */}
        <div className="shrink-0 glass rounded-xl p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-foreground">Today's Goal</span>
            <span className="text-xs font-bold text-primary">
              {userStats.todayDecisions}/{userStats.todayGoal} hands
            </span>
          </div>
          <Progress value={(userStats.todayDecisions / userStats.todayGoal) * 100} className="h-2" />
        </div>

        <div className="shrink-0 flex flex-col gap-2">
          <button
            onClick={() => onNavigate("leaks")}
            className="glass-strong rounded-xl p-3 flex items-center gap-3 hover:border-primary/40 transition-all duration-200 hover:bg-primary/5 active:scale-[0.98] group"
          >
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-500/20 to-orange-500/5 flex items-center justify-center border border-orange-500/20 shrink-0">
              <AlertTriangle className="w-5 h-5 text-orange-400" />
            </div>
            <div className="flex-1 text-left">
              <p className="font-semibold text-sm text-foreground">Leaks</p>
              <p className="text-[11px] text-muted-foreground">Identify and fix your weaknesses</p>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
          </button>

          <button
            onClick={() => onNavigate("review")}
            className="glass-strong rounded-xl p-3 flex items-center gap-3 hover:border-primary/40 transition-all duration-200 hover:bg-primary/5 active:scale-[0.98] group"
          >
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500/20 to-blue-500/5 flex items-center justify-center border border-blue-500/20 shrink-0">
              <History className="w-5 h-5 text-blue-400" />
            </div>
            <div className="flex-1 text-left">
              <p className="font-semibold text-sm text-foreground">Review</p>
              <p className="text-[11px] text-muted-foreground">Study your past hands</p>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
          </button>
        </div>
      </div>
    </div>
  )
}
