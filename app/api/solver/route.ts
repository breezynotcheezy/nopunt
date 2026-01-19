import { NextRequest, NextResponse } from "next/server";

// Fetch OPENAI key from env (make sure to set it in .env.local)
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

function buildFallbackAnalysis(hand: any) {
  const activePlayers = hand.players?.filter((p: any) => p.isActive && !p.isFolded) || [];
  const activeOpponent = activePlayers[0] || null;
  const facingBet = activeOpponent?.betAmount !== undefined && activeOpponent.betAmount > 0;
  const betToCall = facingBet ? activeOpponent.betAmount : 0;

  const correctRaw: string | undefined =
    typeof hand.correctAction === "string" ? String(hand.correctAction).toLowerCase() : undefined;

  type FAction = "fold" | "call" | "raise" | "check" | "bet";
  const validFacing: FAction[] = ["fold", "call", "raise"];
  const validNoBet: FAction[] = ["check", "bet"];
  const legal: FAction[] = facingBet ? validFacing : validNoBet;

  const baseEv = 0;
  const correctKey: FAction | undefined =
    (legal as string[]).includes(correctRaw || "") ? (correctRaw as FAction) : undefined;

  const actionsMap: { [k in FAction]?: { ev: number; sizing: number | null; explanation: string } } = {};

  legal.forEach((act) => {
    let ev = baseEv;
    if (correctKey && act === correctKey) {
      ev = baseEv + 2.0;
    } else if (facingBet && act === "fold") {
      ev = baseEv - 1.0;
    } else if (facingBet && act === "call") {
      ev = baseEv + 0.5;
    } else if (!facingBet && act === "bet") {
      ev = baseEv + 0.5;
    }

    const sizing = act === "raise" || act === "bet"
      ? betToCall && betToCall > 0
        ? betToCall * 2
        : 4
      : null;

    const explanation =
      act === correctKey
        ? "Baseline optimal action based on curated scenario."
        : "Baseline fallback action; EV is approximate because AI is offline.";

    actionsMap[act] = { ev, sizing, explanation };
  });

  // Determine optimal
  let optimalAction: FAction = facingBet ? "call" : "check";
  let optimalEv = -Infinity;
  let optimalSizing: number | null = null;
  let optimalExplanation = "";

  const preferred = (correctKey && actionsMap[correctKey]) ? correctKey : undefined;
  const legalList: FAction[] = legal;

  if (preferred) {
    const a = actionsMap[preferred]!;
    optimalAction = preferred;
    optimalEv = a.ev;
    optimalSizing = a.sizing;
    optimalExplanation = a.explanation;
  } else {
    legalList.forEach((act) => {
      const a = actionsMap[act];
      if (!a) return;
      if (a.ev > optimalEv) {
        optimalEv = a.ev;
        optimalAction = act;
        optimalSizing = a.sizing;
        optimalExplanation = a.explanation;
      }
    });
  }

  if (!Number.isFinite(optimalEv)) optimalEv = 0;

  return {
    solution: optimalExplanation || "Baseline analysis (AI offline)",
    action: optimalAction,
    sizing: optimalSizing,
    ev: optimalEv,
    actions: actionsMap,
    optimalAction,
    optimalSizing,
    optimalEv,
    solved: false,
  };
}

export async function POST(req: NextRequest) {
  try {
    const hand = await req.json();

    // Build ACCURATE hand context - only use actual player states
    const activePlayers = hand.players?.filter((p: any) => p.isActive && !p.isFolded) || [];
    const activeOpponent = activePlayers[0]; // Should only be one
    const facingBet = activeOpponent?.betAmount !== undefined && activeOpponent.betAmount > 0;
    const betToCall = facingBet ? activeOpponent.betAmount : 0;
    
    const boardText = hand.board && hand.board.length > 0 
      ? `Board: ${hand.board.join(" ")}` 
      : "Preflop";
    
    // Build accurate action description
    let actionDescription = "";
    if (facingBet) {
      actionDescription = `${activeOpponent.position} bet ${betToCall}bb. Hero must act.`;
    } else {
      actionDescription = activeOpponent 
        ? `${activeOpponent.position} checked. Hero can bet or check.`
        : "Hero is first to act.";
    }

    // If OpenAI is not configured, fall back to a simple deterministic solver
    // so the client still receives usable per-action EVs.
    if (!OPENAI_API_KEY) {
      const fallback = buildFallbackAnalysis(hand);
      return NextResponse.json(fallback);
    }

    // Compose ACCURATE OpenAI prompt with REAL game state.
    // Ask for EV for EVERY legal action so the client can grade by EV loss.
    const prompt = `You are a GTO (Game Theory Optimal) poker solver. Analyze this EXACT poker situation and provide EV for ALL legal actions.

CRITICAL: Only use the information provided. Do NOT invent or assume any actions that didn't happen.

Hand State:
- Position: ${hand.position}
- Stack Depth: ${hand.stackDepth}bb
- Blinds: ${hand.blinds}
- Hero Hand: ${hand.heroHand.join(" ")}
- ${boardText}
- Pot Size: ${hand.potSize}bb
- Current Action: ${actionDescription}
${facingBet ? `- Bet to Call: ${betToCall}bb` : "- No bet to call - Hero can bet or check"}
- Active Opponent: ${activeOpponent ? `${activeOpponent.position} (${activeOpponent.stack}bb)` : "None"}

Available Actions (exact strings to use):
${facingBet
  ? "- \"fold\": Give up the hand\n- \"call\": Match the bet\n- \"raise\": Raise to a larger amount"
  : "- \"check\": Pass action\n- \"bet\": Bet an amount"}

Return your analysis in this exact JSON format (valid JSON only):
{
  "actions": [
    {
      "action": ${facingBet ? '"fold" | "call" | "raise"' : '"check" | "bet"'},
      "sizing": <number in bb if raise/bet, null otherwise>,
      "ev": <expected value in bb for THIS action, can be negative>,
      "explanation": "<one concise sentence explaining this action>"
    }
  ]
}

Rules:
- Include EVERY legal action exactly once (${facingBet ? '"fold", "call", and "raise"' : '"check" and "bet"'}).
- For fold, sizing MUST be null.
- For call/check, sizing MUST be null.
- For raise/bet, sizing MUST be a reasonable, single bet size in bb.
- EVs should be comparable between actions so the best action has the highest EV.`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are a GTO poker solver. Always respond with STRICT, valid JSON only, no additional text."
          },
          { role: "user", content: prompt }
        ],
        max_tokens: 300,
        temperature: 0.1,
        response_format: { type: "json_object" }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = "OpenAI API error";
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.error?.message || errorText;
      } catch {
        errorMessage = errorText.substring(0, 200);
      }
      return NextResponse.json({ error: errorMessage }, { status: 500 });
    }

    const data = await response.json();
    const aiResponseText = data?.choices?.[0]?.message?.content || "{}";

    // Parse AI response which should contain an "actions" array
    type RawAction = {
      action?: string;
      sizing?: number | null;
      ev?: number;
      explanation?: string;
    };

    let raw: { actions?: RawAction[] } = {};
    try {
      raw = JSON.parse(aiResponseText);
    } catch {
      // Fallback if JSON parsing fails - fabricate a neutral baseline
      raw = {
        actions: [
          {
            action: facingBet ? "call" : "check",
            sizing: null,
            ev: 0,
            explanation: aiResponseText.substring(0, 150),
          },
        ],
      };
    }

    const validActionsFacingBet = ["fold", "call", "raise"] as const;
    const validActionsNoBet = ["check", "bet"] as const;
    const validActions = facingBet ? validActionsFacingBet : validActionsNoBet;

    const normalizedActions: RawAction[] = (raw.actions || [])
      .map((a) => ({
        action: a.action?.toLowerCase(),
        sizing: a.sizing ?? null,
        ev: typeof a.ev === "number" && Number.isFinite(a.ev) ? a.ev : 0,
        explanation: a.explanation || "",
      }))
      .filter((a) => a.action && (validActions as readonly string[]).includes(a.action));

    // Ensure we have every legal action exactly once; if missing, add neutral placeholders
    validActions.forEach((act) => {
      if (!normalizedActions.find((a) => a.action === act)) {
        normalizedActions.push({
          action: act,
          sizing: act === "raise" || act === "bet" ? betToCall && betToCall > 0 ? betToCall * 2 : 2.5 : null,
          ev: 0,
          explanation: "Fallback baseline action added by server.",
        });
      }
    });

    // Deduplicate by action, keeping the highest-EV variant
    const byAction = new Map<string, RawAction>();
    for (const a of normalizedActions) {
      const key = a.action as string;
      const existing = byAction.get(key);
      if (!existing || (a.ev ?? 0) > (existing.ev ?? 0)) {
        byAction.set(key, a);
      }
    }

    const finalActions: { [k: string]: { ev: number; sizing: number | null; explanation: string } } = {};
    byAction.forEach((val, key) => {
      finalActions[key] = {
        ev: val.ev ?? 0,
        sizing: val.sizing ?? null,
        explanation: val.explanation || "",
      };
    });

    // If the hand carries a curated correctAction, force it to be the highest-EV
    // action in the map so grading and UI always treat it as the single solution.
    const correctFromHand: string | undefined =
      typeof hand.correctAction === "string" ? String(hand.correctAction).toLowerCase() : undefined;

    const legalActions = validActions as readonly string[];

    if (correctFromHand && finalActions[correctFromHand]) {
      let maxEv = -Infinity;
      legalActions.forEach((act) => {
        const a = finalActions[act];
        if (a && a.ev > maxEv) maxEv = a.ev;
      });
      if (!Number.isFinite(maxEv)) maxEv = 0;

      if (finalActions[correctFromHand].ev < maxEv) {
        finalActions[correctFromHand].ev = maxEv + 0.1;
      }
    }

    // Determine optimal action by EV, preferring curated correctAction when present
    let optimalAction = facingBet ? "call" : "check";
    let optimalEv = -Infinity;
    let optimalSizing: number | null = null;
    let optimalExplanation = "";

    const preferred = correctFromHand && finalActions[correctFromHand] ? correctFromHand : undefined;

    if (preferred) {
      const a = finalActions[preferred];
      optimalAction = preferred;
      optimalEv = a.ev;
      optimalSizing = a.sizing;
      optimalExplanation = a.explanation;
    } else {
      legalActions.forEach((act) => {
        const a = finalActions[act];
        if (!a) return;
        if (a.ev > optimalEv) {
          optimalEv = a.ev;
          optimalAction = act;
          optimalSizing = a.sizing;
          optimalExplanation = a.explanation;
        }
      });
    }

    if (!Number.isFinite(optimalEv)) {
      optimalEv = 0;
    }

    return NextResponse.json({
      // Backwards-compatible fields
      solution: optimalExplanation || "Analysis complete",
      action: optimalAction,
      sizing: optimalSizing,
      ev: optimalEv,
      // Rich EV map for frontend grading
      actions: finalActions,
      optimalAction,
      optimalSizing,
      optimalEv,
      solved: true,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Internal server error" },
      { status: 500 }
    );
  }
}

