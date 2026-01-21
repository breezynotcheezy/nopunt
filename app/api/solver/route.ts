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

    // Build comprehensive hand context for AI
    const activePlayers = hand.players?.filter((p: any) => p.isActive && !p.isFolded) || [];
    const facingBet = hand.action?.toLowerCase().includes("bet") || 
                      hand.action?.toLowerCase().includes("raise") ||
                      activePlayers.some((p: any) => p.betAmount && p.betAmount > 0);
    
    const boardText = hand.board && hand.board.length > 0 
      ? `Board: ${hand.board.join(" ")}` 
      : "Preflop";
    
    const playersInfo = activePlayers.map((p: any) => 
      `${p.position}${p.isDealer ? " (D)" : ""}${p.betAmount ? ` bet ${p.betAmount}bb` : ""}`
    ).join(", ");

    // Compose comprehensive OpenAI prompt for solving ANY hand
    const prompt = `You are a GTO (Game Theory Optimal) poker solver. Analyze this poker hand and provide the optimal decision.

Hand Details:
- Position: ${hand.position}
- Stack Depth: ${hand.stackDepth}bb
- Blinds: ${hand.blinds}
- Hero Hand: ${hand.heroHand.join(" ")}
- ${boardText}
- Pot Size: ${hand.potSize}bb
- Action: ${hand.action}
- Active Players: ${playersInfo || "None"}

Provide your analysis in this exact JSON format:
{
  "action": "fold" | "call" | "raise",
  "sizing": <number in bb if raise, null otherwise>,
  "ev": <expected value in bb, can be negative>,
  "explanation": "<one sentence explaining the decision>"
}

Be precise and consider:
- Hand strength relative to board
- Position and stack depth
- Pot odds and implied odds
- Opponent ranges based on action
- GTO principles for this spot`;


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
        action: "call",
        sizing: null,
        ev: 0,
        explanation: aiResponseText.substring(0, 150)
      };
    }

    return NextResponse.json({
      solution: aiSolution.explanation || "Analysis complete",
      action: aiSolution.action || "call",
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

