"use client"

import { Home, BarChart2, Clock, User } from "lucide-react"
import type { Screen } from "@/components/mobile-app"
import { cn } from "@/lib/utils"

interface BottomNavProps {
  currentScreen: Screen
  onNavigate: (screen: Screen) => void
}

export function BottomNav({ currentScreen, onNavigate }: BottomNavProps) {
  const items: { screen: Screen; icon: typeof Home; label: string }[] = [
    { screen: "home", icon: Home, label: "Home" },
    { screen: "leaks", icon: BarChart2, label: "Leaks" },
    { screen: "review", icon: Clock, label: "Review" },
    { screen: "profile", icon: User, label: "Profile" },
  ]

  return (
    <div className="absolute bottom-0 left-0 right-0 bg-background/90 backdrop-blur-xl border-t border-border/50 px-2 py-1.5 pb-5">
      <div className="flex items-center justify-around">
        {items.map(({ screen, icon: Icon, label }) => (
          <button
            key={screen}
            onClick={() => onNavigate(screen)}
            className={cn(
              "flex flex-col items-center gap-0.5 py-1.5 px-4 rounded-xl transition-all",
              currentScreen === screen ? "text-primary" : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Icon
              className={cn("w-5 h-5", currentScreen === screen && "scale-110")}
              strokeWidth={currentScreen === screen ? 2.5 : 2}
            />
            <span className="text-[10px] font-medium">{label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
