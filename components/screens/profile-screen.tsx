"use client"

import { ArrowLeft, Volume2, Smartphone, Moon, ChevronRight, LogOut } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { TIER_THRESHOLDS, categoryRatings, ratingHistory, type UserStats } from "@/lib/mock-data"
import { cn } from "@/lib/utils"

interface ProfileScreenProps {
  userStats: UserStats
  onBack: () => void
}

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  )
}

function AppleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
    </svg>
  )
}

export function ProfileScreen({ userStats, onBack }: ProfileScreenProps) {
  const tierInfo = TIER_THRESHOLDS[userStats.tier]

  return (
    <div className="px-5 py-4 pb-24">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <button onClick={onBack} className="p-2 -ml-2 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-bold text-foreground">Profile</h1>
      </div>

      <Card className="glass-strong p-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
            <span className="text-lg font-bold text-primary">{userStats.username.charAt(0).toUpperCase()}</span>
          </div>
          <div className="flex-1">
            <p className="font-semibold text-foreground">{userStats.username}</p>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              {userStats.connectedAccount === "google" ? (
                <GoogleIcon className="w-3.5 h-3.5" />
              ) : userStats.connectedAccount === "apple" ? (
                <AppleIcon className="w-3.5 h-3.5" />
              ) : null}
              <span>{userStats.email}</span>
            </div>
          </div>
        </div>
      </Card>

      <Card className="glass p-4 mb-4">
        <div className="text-center mb-3">
          <p className="text-xs text-muted-foreground mb-1">Overall Rating</p>
          <div className="flex items-center justify-center gap-3">
            <span className="text-5xl font-bold" style={{ color: tierInfo.color }}>
              {userStats.rating}
            </span>
          </div>
          <div
            className="inline-block mt-2 text-sm font-medium px-3 py-1 rounded-full"
            style={{ backgroundColor: `${tierInfo.color}20`, color: tierInfo.color }}
          >
            {userStats.tier}
          </div>
        </div>

        <div className="flex justify-around pt-3 border-t border-border">
          <div className="text-center">
            <p className="text-lg font-bold text-foreground">{userStats.totalHands}</p>
            <p className="text-[10px] text-muted-foreground">Total Hands</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-primary">{userStats.streak}</p>
            <p className="text-[10px] text-muted-foreground">Day Streak</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-foreground">{userStats.tierProgress}%</p>
            <p className="text-[10px] text-muted-foreground">To Next Tier</p>
          </div>
        </div>

        {/* Sparkline */}
        <div className="h-12 flex items-end gap-0.5 mt-4 px-2">
          {ratingHistory.map((rating, i) => {
            const min = Math.min(...ratingHistory)
            const max = Math.max(...ratingHistory)
            const height = ((rating - min) / (max - min)) * 100
            return (
              <div
                key={i}
                className="flex-1 bg-primary/50 rounded-t-sm transition-all hover:bg-primary"
                style={{ height: `${Math.max(height, 15)}%` }}
              />
            )
          })}
        </div>
        <p className="text-[10px] text-muted-foreground mt-1.5 text-center">Last 12 sessions</p>
      </Card>

      {/* Category Ratings */}
      <div className="mb-4">
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Category Ratings</h2>
        <div className="grid grid-cols-2 gap-2">
          {categoryRatings.map((cat) => (
            <Card key={cat.name} className="glass p-2.5">
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">{cat.name}</p>
                <span
                  className={cn(
                    "text-[10px] px-1 py-0.5 rounded",
                    cat.trend === "up" ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground",
                  )}
                >
                  {cat.trend === "up" ? "↑" : "↓"}
                </span>
              </div>
              <p className="text-lg font-bold text-foreground">{cat.rating}</p>
            </Card>
          ))}
        </div>
      </div>

      {/* Settings */}
      <div>
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Settings</h2>
        <Card className="glass divide-y divide-border overflow-hidden">
          <div className="flex items-center justify-between p-3">
            <div className="flex items-center gap-2.5">
              <Volume2 className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-foreground">Sound</span>
            </div>
            <Switch defaultChecked />
          </div>
          <div className="flex items-center justify-between p-3">
            <div className="flex items-center gap-2.5">
              <Smartphone className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-foreground">Haptics</span>
            </div>
            <Switch defaultChecked />
          </div>
          <div className="flex items-center justify-between p-3">
            <div className="flex items-center gap-2.5">
              <Moon className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-foreground">Dark Mode</span>
            </div>
            <Switch defaultChecked disabled />
          </div>
          <button className="flex items-center justify-between p-3 w-full text-left hover:bg-secondary/30">
            <span className="text-sm text-foreground">About</span>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </button>
          <button className="flex items-center justify-between p-3 w-full text-left hover:bg-secondary/30">
            <div className="flex items-center gap-2.5">
              <LogOut className="w-4 h-4 text-destructive" />
              <span className="text-sm text-destructive">Sign Out</span>
            </div>
          </button>
        </Card>
      </div>
    </div>
  )
}
