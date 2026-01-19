export type Tier = "Fish" | "Break-even" | "Winning" | "Crusher" | "Elite"

export interface Player {
  position: string
  stack: number
  isActive: boolean // still in the hand
  isFolded: boolean
  isDealer?: boolean
  betAmount?: number
}

export interface UserStats {
  rating: number
  tier: Tier
  tierProgress: number
  streak: number
  todayDecisions: number
  todayGoal: number
  totalHands: number
  username: string
  connectedAccount: "google" | "apple" | "email"
  email: string
}

export interface HandScenario {
  id: string
  position: string
  stackDepth: number
  blinds: string
  action: string
  potSize: number
  heroHand: [string, string]
  board?: string[]
  street: "preflop" | "flop" | "turn" | "river"
  correctAction: "fold" | "call" | "raise"
  correctSizing?: number
  evDelta: number
  explanation: string
  category: string
  players: Player[]
}

// A full hand composed of ordered decision nodes across streets (preflop → flop → turn → river)
export interface MultiStreetHand {
  id: string
  steps: HandScenario[]
}

export interface Leak {
  id: string
  category: string
  mistakeRate: number
  evLoss: number
  description: string
}

export interface MistakeStepSummary {
  street: HandScenario["street"]
  category: string
  userAction: string
  optimalAction: string
  evLoss: number
}

export interface Mistake {
  id: string
  category: string
  hand: HandScenario
  userAction: string
  timestamp: Date
  // Optional rich EV summary for this hand
  totalEvLoss?: number
  steps?: MistakeStepSummary[]
}

export const TIER_THRESHOLDS: Record<Tier, { min: number; max: number; color: string }> = {
  Fish: { min: 0, max: 1000, color: "#71717a" },
  "Break-even": { min: 1000, max: 1500, color: "#a78bfa" },
  Winning: { min: 1500, max: 2000, color: "#c4b5fd" },
  Crusher: { min: 2000, max: 2500, color: "#d8b4fe" },
  Elite: { min: 2500, max: 3000, color: "#e9d5ff" },
}

export const mockUserStats: UserStats = {
  rating: 1347,
  tier: "Break-even",
  tierProgress: 69,
  streak: 7,
  todayDecisions: 0,
  todayGoal: 20,
  totalHands: 1842,
  username: "PokerPro_42",
  connectedAccount: "google",
  email: "user@gmail.com",
}

export const mockScenarios: HandScenario[] = [
  {
    id: "1",
    position: "BTN",
    stackDepth: 100,
    blinds: "1/2",
    action: "UTG raises to 6, folds to Hero",
    potSize: 9,
    heroHand: ["As", "Kd"],
    street: "preflop",
    correctAction: "raise",
    correctSizing: 18,
    evDelta: 2.4,
    explanation:
      "AKo is a premium hand that should 3-bet for value against a UTG open. Calling allows BB to come along cheaply.",
    category: "Preflop 3-bet",
    players: [
      { position: "UTG", stack: 98, isActive: true, isFolded: false, betAmount: 6 },
      { position: "MP", stack: 100, isActive: false, isFolded: true },
      { position: "CO", stack: 100, isActive: false, isFolded: true },
      { position: "SB", stack: 99, isActive: true, isFolded: false, betAmount: 1 },
      { position: "BB", stack: 98, isActive: true, isFolded: false, betAmount: 2 },
    ],
  },
  {
    id: "2",
    position: "BB",
    stackDepth: 85,
    blinds: "1/2",
    action: "CO opens to 5, BTN calls, SB folds",
    potSize: 13,
    heroHand: ["9h", "9c"],
    street: "preflop",
    correctAction: "call",
    evDelta: 0.8,
    explanation:
      "With 99 in the BB facing a CO open and BTN cold call, calling is optimal. 3-betting squeezes out worse hands and gets called by better.",
    category: "Preflop Defense",
    players: [
      { position: "UTG", stack: 100, isActive: false, isFolded: true },
      { position: "MP", stack: 100, isActive: false, isFolded: true },
      { position: "CO", stack: 95, isActive: true, isFolded: false, betAmount: 5 },
      { position: "BTN", stack: 95, isActive: true, isFolded: false, betAmount: 5, isDealer: true },
      { position: "SB", stack: 99, isActive: false, isFolded: true },
    ],
  },
  {
    id: "3",
    position: "CO",
    stackDepth: 120,
    blinds: "1/2",
    action: "Folds to Hero",
    potSize: 7,
    heroHand: ["Qc", "Jc"],
    street: "preflop",
    correctAction: "raise",
    correctSizing: 12,
    evDelta: 1.2,
    explanation: "QJs is a strong opening hand from the CO. Standard open size is 2.5x with suited broadways.",
    category: "Open Raise",
    players: [
      { position: "UTG", stack: 100, isActive: false, isFolded: true },
      { position: "MP", stack: 100, isActive: false, isFolded: true },
      { position: "BTN", stack: 100, isActive: true, isFolded: false, isDealer: true },
      { position: "SB", stack: 98, isActive: true, isFolded: false, betAmount: 2 },
      { position: "BB", stack: 95, isActive: true, isFolded: false, betAmount: 5 },
    ],
  },
  {
    id: "4",
    position: "BTN",
    stackDepth: 95,
    blinds: "1/2",
    action: "Hero opened 5, BB called. Flop action: BB checks",
    potSize: 11,
    heroHand: ["Ah", "5h"],
    board: ["Kd", "8c", "3h"],
    street: "flop",
    correctAction: "raise",
    correctSizing: 4,
    evDelta: 1.8,
    explanation:
      "With a backdoor flush draw and overcards, c-betting small on a dry board applies pressure and builds the pot for when you improve.",
    category: "C-bet Bluff",
    players: [{ position: "BB", stack: 95, isActive: true, isFolded: false }],
  },
  {
    id: "5",
    position: "SB",
    stackDepth: 75,
    blinds: "1/2",
    action: "BTN opens to 9, Hero 3-bets to 28, BTN calls. Flop: Hero checks, BTN bets 18",
    potSize: 74,
    heroHand: ["Jd", "Jc"],
    board: ["Qh", "9s", "4c"],
    street: "flop",
    correctAction: "call",
    evDelta: -0.4,
    explanation:
      "JJ is too strong to fold but the Q on board makes raising problematic. Calling keeps BTNs bluffs in and controls the pot.",
    category: "Facing Aggression",
    players: [
      { position: "BTN", stack: 72, isActive: true, isFolded: false, betAmount: 18, isDealer: true },
      { position: "BB", stack: 97, isActive: false, isFolded: true },
    ],
  },
  {
    id: "6",
    position: "BB",
    stackDepth: 100,
    blinds: "1/2",
    action: "CO opens to 12, Hero calls. Flop check-check. Turn: Hero checks, CO bets 15",
    potSize: 39,
    heroHand: ["8s", "7s"],
    board: ["Td", "6c", "2h", "9d"],
    street: "turn",
    correctAction: "raise",
    correctSizing: 45,
    evDelta: 3.2,
    explanation:
      "You turned the nuts! Check-raising maximizes value against COs wide turn stab range on this connected board.",
    category: "Value Raise",
    players: [{ position: "CO", stack: 73, isActive: true, isFolded: false, betAmount: 15 }],
  },
  {
    id: "7",
    position: "BTN",
    stackDepth: 88,
    blinds: "1/2",
    action: "Hero opened, BB called. Flop Hero bet 5, BB called. Turn Hero bet 14, BB called. River: BB checks",
    potSize: 58,
    heroHand: ["Kh", "Qh"],
    board: ["Kd", "7s", "3c", "2h", "9s"],
    street: "river",
    correctAction: "raise",
    correctSizing: 35,
    evDelta: 2.1,
    explanation:
      "Top pair good kicker on a brick runout. BB calling twice likely has Kx or a draw that missed. Value bet for thin value.",
    category: "River Value",
    players: [{ position: "BB", stack: 66, isActive: true, isFolded: false }],
  },
  {
    id: "8",
    position: "CO",
    stackDepth: 50,
    blinds: "1/2",
    action: "UTG raises to 6, MP calls",
    potSize: 15,
    heroHand: ["Ac", "Qc"],
    street: "preflop",
    correctAction: "raise",
    correctSizing: 22,
    evDelta: 1.9,
    explanation:
      "AQs plays well as a 3-bet squeeze here. You have blockers to AK/AA and can often take it down preflop or play a heads-up pot in position.",
    category: "Squeeze Play",
    players: [
      { position: "UTG", stack: 94, isActive: true, isFolded: false, betAmount: 6 },
      { position: "MP", stack: 94, isActive: true, isFolded: false, betAmount: 6 },
      { position: "BTN", stack: 100, isActive: true, isFolded: false, isDealer: true },
      { position: "SB", stack: 99, isActive: true, isFolded: false, betAmount: 1 },
      { position: "BB", stack: 98, isActive: true, isFolded: false, betAmount: 2 },
    ],
  },
]

export const mockLeaks: Leak[] = [
  {
    id: "1",
    category: "River Overcall",
    mistakeRate: 34,
    evLoss: 12.4,
    description: "Calling river bets too wide with bluff catchers",
  },
  {
    id: "2",
    category: "Missed Value",
    mistakeRate: 28,
    evLoss: 8.7,
    description: "Checking back value hands on the river",
  },
  {
    id: "3",
    category: "Bad 3-bet Defense",
    mistakeRate: 22,
    evLoss: 6.2,
    description: "Folding too often or calling too wide vs 3-bets",
  },
  {
    id: "4",
    category: "C-bet Frequency",
    mistakeRate: 18,
    evLoss: 4.1,
    description: "Over-cbetting on unfavorable board textures",
  },
  {
    id: "5",
    category: "Turn Aggression",
    mistakeRate: 15,
    evLoss: 3.8,
    description: "Not barreling turn with equity and fold equity",
  },
]

export const mockMistakes: Mistake[] = [
  {
    id: "1",
    category: "River Overcall",
    hand: mockScenarios[6],
    userAction: "call",
    timestamp: new Date(),
  },
  {
    id: "2",
    category: "Missed Value",
    hand: mockScenarios[5],
    userAction: "check",
    timestamp: new Date(),
  },
  {
    id: "3",
    category: "Bad 3-bet Defense",
    hand: mockScenarios[0],
    userAction: "call",
    timestamp: new Date(),
  },
]

export const categoryRatings = [
  { name: "Preflop", rating: 1420, trend: "up" as const },
  { name: "Flop", rating: 1380, trend: "up" as const },
  { name: "Turn", rating: 1290, trend: "down" as const },
  { name: "River", rating: 1210, trend: "down" as const },
  { name: "ICM", rating: 1450, trend: "up" as const },
]

export const ratingHistory = [1200, 1210, 1195, 1230, 1250, 1240, 1280, 1290, 1310, 1295, 1320, 1347]

export const achievements = [
  { id: "1", name: "7-Day Streak", icon: "🔥", earned: true },
  { id: "2", name: "100 Hands", icon: "🎯", earned: true },
  { id: "3", name: "Perfect Session", icon: "⭐", earned: true },
  { id: "4", name: "River Specialist", icon: "🌊", earned: false },
  { id: "5", name: "GTO Master", icon: "🧠", earned: false },
  { id: "6", name: "Crusher Tier", icon: "💎", earned: false },
]
