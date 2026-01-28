import type { HandScenario, Player, MultiStreetHand } from "./mock-data";

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

function generateAction(position: string, street: string, hasBet: boolean, opponentPosition: string, betAmount?: number, sb?: number, bb?: number): string {
  const betText = betAmount ? `${betAmount}bb` : `${Math.max(2, Math.round((bb || 2) * 2.5))}bb`;
  if (street === "preflop") {
    if (hasBet) {
      return `${opponentPosition} raises to ${betText}, folds to Hero`;
    } else {
      return position === "BB" ? `${opponentPosition} folds, action on Hero in BB` : "Folds to Hero";
    }
  } else {
    // Postflop
    if (hasBet) {
      return `${opponentPosition} bets ${betText}`;
    } else {
      return `${opponentPosition} checks`;
    }
  }
}

function generatePlayers(position: string, hasBet: boolean, betAmount: number | undefined, sb: number, bb: number): Player[] {
  const positions = ["UTG", "MP", "CO", "BTN", "SB", "BB"];
  const players: Player[] = [];

  // Exactly one active opponent
  const activeOpponentIndex = Math.floor(Math.random() * (positions.length - 1));
  let activeCount = 0;

  for (let i = 0; i < positions.length; i++) {
    const pos = positions[i];
    if (pos === position) continue; // Skip hero

    const isActive = activeCount === 0 && i === activeOpponentIndex;
    if (isActive) activeCount++;
    const isFolded = !isActive;

    // Blinds
    const blindBet = pos === "SB" ? sb : pos === "BB" ? bb : 0;
    const finalBetAmount = isActive && hasBet ? betAmount : blindBet > 0 ? blindBet : undefined;

    players.push({
      position: pos,
      stack: 85 + Math.floor(Math.random() * 30),
      isActive,
      isFolded,
      isDealer: pos === "BTN",
      currentBet: finalBetAmount,
    } as Player & { currentBet?: number });
  }

  return players;
}

export function generateRandomMultiStreetHand(id: string): MultiStreetHand {
  // Generate a complete hand with multiple decision points across streets
  const position = getRandomElement(POSITIONS);
  const heroHand = generateRandomHand();
  const stackDepth = 50 + Math.floor(Math.random() * 100);
  const blinds = getRandomElement(["1/2", "2/5", "1/3"]);
  const [sb, bb] = blinds.split("/").map(Number);
  
  const steps: HandScenario[] = [];
  
  // Always start with preflop
  const preflopScenario = generateRandomHandScenario(`${id}-preflop`);
  preflopScenario.position = position;
  preflopScenario.heroHand = heroHand;
  preflopScenario.stackDepth = stackDepth;
  preflopScenario.blinds = blinds;
  steps.push(preflopScenario);
  
  // Randomly add flop, turn, and river decisions
  const streets: ("flop" | "turn" | "river")[] = ["flop", "turn", "river"];
  let currentBoard: string[] = [];
  
  for (let i = 0; i < streets.length; i++) {
    if (Math.random() < 0.6) { // 60% chance to continue to next street
      const street = streets[i];
      const newCards = generateRandomBoard(street) || [];
      currentBoard = newCards.slice(0, street === "flop" ? 3 : street === "turn" ? 4 : 5);
      
      const streetScenario = generateRandomHandScenario(`${id}-${street}`);
      streetScenario.position = position;
      streetScenario.heroHand = heroHand;
      streetScenario.stackDepth = stackDepth;
      streetScenario.blinds = blinds;
      streetScenario.street = street;
      streetScenario.board = currentBoard;
      steps.push(streetScenario);
    } else {
      break; // Stop generating more streets
    }
  }
  
  return {
    id,
    steps,
  };
}

export function generateRandomHandScenario(id: string): HandScenario {
  const position = getRandomElement(POSITIONS);
  const street = getRandomElement(STREETS);
  const heroHand = generateRandomHand();
  const board = generateRandomBoard(street);
  const stackDepth = 50 + Math.floor(Math.random() * 100);
  const blinds = getRandomElement(["1/2", "2/5", "1/3"]);
  const [sb, bb] = blinds.split("/").map(Number);

  // Preflop betting likelihood; BB more likely to face action
  const hasBet = street === "preflop" ? Math.random() < (position === "BB" ? 0.7 : 0.6) : Math.random() < 0.5;
  const raiseSize = hasBet ? Math.max(3, Math.round((bb || 2) * (2 + Math.random() * 2))) : undefined;

  // Generate players and determine active opponent
  const players = generatePlayers(position, hasBet, raiseSize, sb, bb);
  const activeOpponent = players.find((p) => p.isActive && !p.isFolded);
  const opponentPosition = activeOpponent?.position || "UTG";
  const betAmount = activeOpponent?.currentBet;

  const action = generateAction(position, street, hasBet, opponentPosition, betAmount, sb, bb);

  // Pot starts with blinds
  let potSize = sb + bb;
  if (betAmount) potSize += betAmount;
  if (street !== "preflop") potSize += Math.floor(Math.random() * 12) + 3;

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
