import { NextRequest, NextResponse } from "next/server"
import type { HandScenario, Player } from "@/lib/mock-data"

// Deterministic, data-backed solver.
// Uses the HandScenario payload (correctAction, correctSizing, evDelta, explanation)
// plus live player state (betAmount, stacks) to produce a stable action + EV.

function computeFacingBet(players: Player[] | undefined) {
  const activePlayers = players?.filter((p) => p.isActive && !p.isFolded) ?? []
  const activeOpponent = activePlayers[0]

  const facingBet = activeOpponent?.betAmount !== undefined && activeOpponent.betAmount > 0
  const betToCall = facingBet ? activeOpponent!.betAmount! : 0

  return { activeOpponent, facingBet, betToCall }
}

export async function POST(req: NextRequest) {
  try {
    const hand = (await req.json()) as HandScenario

    const { activeOpponent, facingBet, betToCall } = computeFacingBet(hand.players)

    // Core "book" answer from the scenario data
    const baseAction = hand.correctAction
    const baseSizing = hand.correctSizing ?? null
    const baseEv = hand.evDelta ?? 0
    const baseExplanation = hand.explanation || "No explanation provided for this spot yet."

    // Derive simple numeric insights
    const potSize = hand.potSize
    const stackDepth = hand.stackDepth
    const potAfterCall = facingBet ? potSize + betToCall : potSize
    const potOdds = facingBet && betToCall > 0 ? potAfterCall / betToCall : null
    const spr = potSize > 0 ? stackDepth / potSize : null

    const insightBits: string[] = []

    if (facingBet && betToCall > 0 && potOdds) {
      insightBits.push(
        `You are being asked to call ${betToCall}bb to play for a pot of ${potAfterCall}bb, which is roughly ${potOdds.toFixed(1)}:1.`,
      )
    }

    if (baseSizing && potSize > 0) {
      const sizeToPot = baseSizing / potSize
      insightBits.push(
        `The recommended sizing of ${baseSizing}bb is about ${sizeToPot.toFixed(2)}× the pot, which is standard for this category (${hand.category}).`,
      )
    }

    if (spr !== null) {
      insightBits.push(`Effective stack-to-pot ratio is about ${spr.toFixed(1)}, so the hand can comfortably ${
        baseAction === "raise" ? "build a pot" : baseAction === "call" ? "realize its equity" : "fold without over-committing"
      }.`)
    }

    if (baseEv) {
      insightBits.push(
        `This line is worth approximately ${baseEv >= 0 ? "+" : ""}${baseEv.toFixed(
          1,
        )}bb compared to typical alternatives in this spot.`,
      )
    }

    const combinedExplanation = `${baseExplanation} ${insightBits.join(" ")}`

    return NextResponse.json({
      solution: combinedExplanation,
      action: baseAction,
      sizing: baseSizing,
      ev: baseEv,
      solved: true,
    })
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Internal server error" },
      { status: 500 },
    )
  }
}

