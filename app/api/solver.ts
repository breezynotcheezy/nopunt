import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge"; // optimize for speed!

// Fetch OPENAI key from env (make sure to set it in .env.local)
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!OPENAI_API_KEY) {
  throw new Error(
    "OPENAI_API_KEY missing in environment. Please set it in your .env.local in the root."
  );
}

// Minimal solved data snippet (replace with more robust sourcing as needed)
import { mockScenarios } from "@/lib/mock-data";

// Utility: Get the 'solved' answer from the local solved data
function getSolvedForHand(hand: any) {
  // Try to match by position, stackDepth, heroHand, board, and action (add more criteria as your dataset grows)
  return mockScenarios.find((s) =>
    s.position === hand.position &&
    s.heroHand[0] === hand.heroHand[0] &&
    s.heroHand[1] === hand.heroHand[1] &&
    (s.board?.join(",") || "") === (hand.board?.join(",") || "") &&
    s.action.trim().toLowerCase() === hand.action.trim().toLowerCase()
  );
}

export async function POST(req: NextRequest) {
  try {
    const hand = await req.json();

    // Find solution:
    const solved = getSolvedForHand(hand);

    // Compose OpenAI prompt – very minimal, supplement with solution
    const prompt = [
      `Poker Hand: ${JSON.stringify(hand)}`,
      solved ? `Solved Suggestion: ${JSON.stringify(solved)}` : "No solved data found.",
      "Given the above, provide the optimal action, EV, and a one-sentence rationale. Be concise."
    ].join("\n\n");

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo-1106", // Use GPT-4 turbo if desired
        messages: [{ role: "user", content: prompt }],
        max_tokens: 150,
        temperature: 0.2,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      return NextResponse.json({ error }, { status: 500 });
    }

    const data = await response.json();
    const aiResponse = data?.choices?.[0]?.message?.content || "";

    return NextResponse.json({ solution: aiResponse, solved });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

