import { NextRequest, NextResponse } from "next/server";

// Fetch OPENAI key from env (make sure to set it in .env.local)
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

export async function POST(req: NextRequest) {
  try {
    if (!OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY not configured. Please add it to .env.local" },
        { status: 500 }
      );
    }

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

    // Compose ACCURATE OpenAI prompt with REAL game state
    const prompt = `You are a GTO (Game Theory Optimal) poker solver. Analyze this EXACT poker situation and provide the optimal decision.

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

Available Actions:
${facingBet ? "- Fold: Give up the hand\n- Call: Match the ${betToCall}bb bet\n- Raise: Raise to a larger amount" : "- Check: Pass action\n- Bet: Bet an amount"}

Provide your analysis in this exact JSON format:
{
  "action": "${facingBet ? '"fold" | "call" | "raise"' : '"check" | "bet"'}",
  "sizing": <number in bb if raise/bet, null otherwise>,
  "ev": <expected value in bb, can be negative>,
  "explanation": "<one sentence explaining why this is optimal given the EXACT situation above>"
}

IMPORTANT: 
- If facing a bet, action must be "fold", "call", or "raise"
- If NOT facing a bet, action must be "check" or "bet"
- Do NOT suggest calling when there is no bet to call
- Do NOT suggest checking when facing a bet`;


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
            content: "You are a GTO poker solver. Always respond with valid JSON only, no additional text."
          },
          { role: "user", content: prompt }
        ],
        max_tokens: 200,
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
    
    // Parse AI response
    let aiSolution;
    try {
      aiSolution = JSON.parse(aiResponseText);
    } catch {
      // Fallback if JSON parsing fails
      aiSolution = {
        action: facingBet ? "call" : "check",
        sizing: null,
        ev: 0,
        explanation: aiResponseText.substring(0, 150)
      };
    }

    // Validate AI response matches available actions
    const validActionsFacingBet = ["fold", "call", "raise"];
    const validActionsNoBet = ["check", "bet"];
    const validActions = facingBet ? validActionsFacingBet : validActionsNoBet;
    
    if (!validActions.includes(aiSolution.action?.toLowerCase())) {
      // Fix invalid action
      aiSolution.action = facingBet ? "call" : "check";
      aiSolution.explanation = (aiSolution.explanation || "") + " (Action corrected to match game state)";
    }

    return NextResponse.json({
      solution: aiSolution.explanation || "Analysis complete",
      action: aiSolution.action || (facingBet ? "call" : "check"),
      sizing: aiSolution.sizing || null,
      ev: aiSolution.ev || 0,
      solved: true
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Internal server error" },
      { status: 500 }
    );
  }
}

