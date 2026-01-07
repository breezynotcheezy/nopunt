import type { HandScenario, Player } from "./mock-data";

const RANKS = ["A", "K", "Q", "J", "T", "9", "8", "7", "6", "5", "4", "3", "2"];
const SUITS = ["s", "h", "d", "c"];
const POSITIONS = ["UTG", "MP", "CO", "BTN", "SB", "BB", "EP"];
const STREETS: ("preflop" | "flop" | "turn" | "river")[] = ["preflop", "flop", "turn", "river"];

function getRandomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function generateRandomCard(): string {
  const rank = getRandomElement(RANKS);
  const suit = getRandomElement(SUITS);
  return `${rank}${suit}`;
}

function generateRandomHand(): [string, string] {
  const card1 = generateRandomCard();
  let card2 = generateRandomCard();
  // Ensure cards are different
  while (card2 === card1) {
    card2 = generateRandomCard();
  }
  return [card1, card2];
}

function generateRandomBoard(street: "preflop" | "flop" | "turn" | "river"): string[] | undefined {
  if (street === "preflop") return undefined;
  
  const deck = [];
  for (const rank of RANKS) {
    for (const suit of SUITS) {
      deck.push(`${rank}${suit}`);
    }
  }
  
  const shuffled = shuffleArray(deck);
  const boardSize = street === "flop" ? 3 : street === "turn" ? 4 : 5;
  return shuffled.slice(0, boardSize);
}

function generateAction(position: string, street: string, hasBet: boolean, opponentPosition: string, betAmount?: number): string {
  if (street === "preflop") {
    if (hasBet) {
      return `${opponentPosition} raises to ${betAmount || 6}bb, folds to Hero`;
    } else {
      return "Folds to Hero";
    }
  } else {
    // Postflop
    if (hasBet) {
      return `${opponentPosition} bets ${betAmount || 15}bb`;
    } else {
      return `${opponentPosition} checks`;
    }
  }
}

function generatePlayers(position: string, street: string, hasBet: boolean): Player[] {
  const positions = ["UTG", "MP", "CO", "BTN", "SB", "BB"];
  const heroPosIndex = positions.indexOf(position);
  const players: Player[] = [];
  
  // Ensure exactly ONE opponent is active (not folded)
  const activeOpponentIndex = Math.floor(Math.random() * (positions.length - 1));
  let activeCount = 0;
  
  for (let i = 0; i < positions.length; i++) {
    const pos = positions[i];
    if (pos === position) continue; // Skip hero
    
    const shouldBeActive = activeCount === 0 && i === activeOpponentIndex;
    const isFolded = !shouldBeActive;
    
    if (shouldBeActive) activeCount++;
    
    // Only set betAmount if there's actually a bet and this is the active opponent
    const betAmount = hasBet && shouldBeActive ? Math.floor(Math.random() * 15) + 3 : undefined;
    
    players.push({
      position: pos,
      stack: 85 + Math.floor(Math.random() * 30),
      isActive: shouldBeActive,
      isFolded: isFolded,
      isDealer: pos === "BTN",
      betAmount: betAmount,
    });
  }
  
  return players;
}

export function generateRandomHandScenario(id: string): HandScenario {
  const position = getRandomElement(POSITIONS);
  const street = getRandomElement(STREETS);
  const heroHand = generateRandomHand();
  const board = generateRandomBoard(street);
  const stackDepth = 50 + Math.floor(Math.random() * 100);
  const blinds = getRandomElement(["1/2", "2/5", "1/3"]);
  
  // Determine if there's a bet (60% chance postflop, 40% preflop)
  const hasBet = street === "preflop" 
    ? Math.random() > 0.4 
    : Math.random() > 0.4;
  
  // Generate players first to get the active opponent
  const players = generatePlayers(position, street, hasBet);
  const activeOpponent = players.find(p => p.isActive && !p.isFolded);
  const opponentPosition = activeOpponent?.position || "BB";
  const betAmount = activeOpponent?.betAmount;
  
  // Generate action string that matches the actual state
  const action = generateAction(position, street, hasBet, opponentPosition, betAmount);
  
  // Calculate pot size accurately
  const [sb, bb] = blinds.split("/").map(Number);
  let potSize = sb + bb; // Start with blinds
  
  // Add any bets
  if (betAmount) {
    potSize += betAmount;
  }
  
  // If postflop, add previous street action
  if (street !== "preflop") {
    potSize += Math.floor(Math.random() * 20) + 5; // Previous action
  }
  
  return {
    id,
    position,
    stackDepth,
    blinds,
    action,
    potSize,
    heroHand,
    board,
    street,
    correctAction: "fold", // Will be determined by AI
    evDelta: 0, // Will be determined by AI
    explanation: "", // Will be determined by AI
    category: `${street.charAt(0).toUpperCase() + street.slice(1)} Decision`,
    players,
  };
}

