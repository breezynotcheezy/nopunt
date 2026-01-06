import { apiBaseUrl } from './config';
import { demoMode } from './config';

export type ApiError = {
  status: number;
  body: unknown;
};

async function readJsonSafe(res: Response): Promise<unknown> {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

export async function apiRequest<T>(params: {
  path: string;
  method?: 'GET' | 'POST';
  token?: string | null;
  body?: unknown;
}): Promise<T> {
  if (demoMode()) {
    return mockApiRequest<T>(params);
  }

  const res = await fetch(`${apiBaseUrl()}${params.path}`, {
    method: params.method ?? 'GET',
    headers: {
      'content-type': 'application/json',
      ...(params.token ? { authorization: `Bearer ${params.token}` } : {}),
    },
    body: params.body ? JSON.stringify(params.body) : undefined,
  });

  const body = await readJsonSafe(res);
  if (!res.ok) {
    const err: ApiError = { status: res.status, body };
    throw err;
  }

  return body as T;
}

type ScenarioChoice = { id: string; label: string; order: number };
type Scenario = {
  id: string;
  code: string;
  street: string;
  spotType: string;
  prompt: any;
  choices: ScenarioChoice[];
};

let demoDrillId = 'demo_drill';
let demoIndex = 0;

const demoScenarios: Scenario[] = [
  {
    id: 's1',
    code: 'demo_flop',
    street: 'FLOP',
    spotType: 'SRP_BTN_VS_BB',
    prompt: {
      street: 'FLOP',
      heroHand: 'A♣J♣',
      board: 'K♦ 7♠ 2♥',
      potBb: 6,
      stackBb: 95,
      action: 'BB checks to you.',
      note: 'Demo scenario (no backend).',
    },
    choices: [
      { id: 'c1', label: 'Bet 33%', order: 0 },
      { id: 'c2', label: 'Bet 75%', order: 1 },
      { id: 'c3', label: 'Check back', order: 2 },
    ],
  },
  {
    id: 's2',
    code: 'demo_turn',
    street: 'TURN',
    spotType: 'SRP_BTN_VS_BB',
    prompt: {
      street: 'TURN',
      heroHand: 'Q♣T♣',
      board: 'K♠ 8♦ 2♣ | 6♣',
      potBb: 12,
      stackBb: 85,
      action: 'BB checks turn after calling flop.',
      note: 'Demo scenario (no backend).',
    },
    choices: [
      { id: 'c4', label: 'Bet 75%', order: 0 },
      { id: 'c5', label: 'Bet 33%', order: 1 },
      { id: 'c6', label: 'Check back', order: 2 },
    ],
  },
];

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function mockApiRequest<T>(params: {
  path: string;
  method?: 'GET' | 'POST';
  token?: string | null;
  body?: unknown;
}): Promise<T> {
  await delay(250);
  const method = params.method ?? 'GET';

  if (params.path === '/v1/me' && method === 'GET') {
    return {
      user: {
        id: 'demo_user',
        email: 'demo@example.com',
        displayName: 'Demo User',
        rating: 1120,
        tier: 'Gold',
        streakCount: 3,
        entitlement: { isPaid: false, currentPeriodEnd: null },
      },
    } as T;
  }

  if (params.path === '/v1/auth/google' && method === 'POST') {
    return { token: 'demo' } as T;
  }

  if (params.path === '/v1/auth/apple' && method === 'POST') {
    return { token: 'demo' } as T;
  }

  if (params.path === '/v1/drills/start' && method === 'POST') {
    demoDrillId = `demo_drill_${Date.now()}`;
    demoIndex = 0;
    return { drillId: demoDrillId, scenario: demoScenarios[demoIndex] } as T;
  }

  const nextMatch = params.path.match(/^\/v1\/drills\/([^/]+)\/next$/);
  if (nextMatch && method === 'GET') {
    if (demoIndex >= demoScenarios.length) {
      return { done: true, summary: { drillId: demoDrillId, decisionsCount: demoScenarios.length, ratingDeltaTotal: 8 } } as T;
    }
    return { done: false, scenario: demoScenarios[demoIndex] } as T;
  }

  const answerMatch = params.path.match(/^\/v1\/drills\/([^/]+)\/answer$/);
  if (answerMatch && method === 'POST') {
    const body = (params.body ?? {}) as any;
    const scenarioId = String(body.scenarioId ?? '');
    const choiceId = String(body.choiceId ?? '');
    const scenario = demoScenarios.find((s) => s.id === scenarioId) ?? demoScenarios[demoIndex];
    const correctChoiceId = scenario.choices[0]?.id ?? null;
    const isCorrect = choiceId === correctChoiceId;
    demoIndex += 1;
    return {
      decisionId: `d_${Date.now()}`,
      isCorrect,
      ratingDelta: isCorrect ? 8 : -8,
      newRating: 1120 + (isCorrect ? 8 : -8),
      newTier: 'Gold',
      correctChoiceId,
      done: demoIndex >= demoScenarios.length,
    } as T;
  }

  if (params.path === '/v1/ai/explain' && method === 'POST') {
    return {
      text: 'Demo coach: Focus on simple, consistent lines. Prefer the low-risk sizing here and avoid overcomplicating the spot.',
    } as T;
  }

  throw { status: 404, body: { error: 'demo_route_not_implemented', path: params.path } };
}
