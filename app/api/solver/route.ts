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

    // Build hand context for AI
    const activePlayers = hand.players?.filter((p: any) => p.isActive && !p.isFolded) || [];
    const facingBet =
      hand.action?.toLowerCase().includes("bet") ||
      hand.action?.toLowerCase().includes("raise") ||
      activePlayers.some((p: any) => p.currentBet && p.currentBet > 0);
    
    const boardText = hand.board && hand.board.length > 0 
      ? `Board: ${hand.board.join(" ")}` 
      : "Preflop";
    
    const playersInfo = activePlayers
      .map((p: any) => `${p.position}${p.isDealer ? " (D)" : ""}${p.currentBet ? ` bet ${p.currentBet}bb` : ""}`)
      .join(", ");

    const prompt = `You are a deterministic, high-precision poker decision engine.

Hand Details:
- Position: ${hand.position}
- Stack Depth: ${hand.stackDepth}bb
- Blinds: ${hand.blinds}
- Hero Hand: ${hand.heroHand.join(" ")}
- ${boardText}
- Pot Size: ${hand.potSize}bb
- Action: ${hand.action}
- Active Players: ${playersInfo || "None"}

Constraints:
- Return the single best action (fold/call/raise).
- If raising, choose a single reasonable sizing in bb.
- Be consistent and repeatable: do NOT randomize.
- Output MUST be valid JSON and MUST match the schema exactly.

Provide your analysis in this exact JSON format:
{
  "action": "fold" | "call" | "raise",
  "sizing": <number in bb if raise, null otherwise>,
  "ev": <expected value in bb, can be negative>,
  "explanation": "<concise explanation (max 220 chars)>"
}
`;


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
        temperature: 0,
        top_p: 1,
        presence_penalty: 0,
        frequency_penalty: 0,
        // Seed improves repeatability when supported
        seed: 1337,
        response_format: { type: "json_object" },
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
    let aiSolution: any;
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

    const action = typeof aiSolution?.action === "string" ? aiSolution.action.toLowerCase() : "call";
    const normalizedAction = action === "fold" || action === "call" || action === "raise" ? action : "call";
    const sizing = normalizedAction === "raise" && typeof aiSolution?.sizing === "number" ? aiSolution.sizing : null;
    const ev = typeof aiSolution?.ev === "number" ? aiSolution.ev : 0;
    const explanation = typeof aiSolution?.explanation === "string" ? aiSolution.explanation : "Analysis complete";

    return NextResponse.json({
      solution: explanation,
      action: normalizedAction,
      sizing,
      ev,
      solved: true
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Internal server error" },
      { status: 500 }
    );
  }
}

