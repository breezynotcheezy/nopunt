import 'dotenv/config';

import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import Fastify, { type FastifyReply, type FastifyRequest } from 'fastify';
import { OAuth2Client } from 'google-auth-library';
import { createRemoteJWKSet, jwtVerify } from 'jose';
import { z } from 'zod';

import { prisma } from './prisma.js';

const env = {
  PORT: Number(process.env.PORT ?? 3000),
  CORS_ORIGIN: process.env.CORS_ORIGIN ?? '*',
  JWT_SECRET: process.env.JWT_SECRET ?? 'dev_secret_change_me',
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID ?? '',
  APPLE_CLIENT_ID: process.env.APPLE_CLIENT_ID ?? '',
  REVENUECAT_WEBHOOK_SECRET: process.env.REVENUECAT_WEBHOOK_SECRET ?? '',
};

const googleClient = new OAuth2Client(env.GOOGLE_CLIENT_ID || undefined);
const appleJwks = createRemoteJWKSet(new URL('https://appleid.apple.com/auth/keys'));

function tierForRating(rating: number): string {
  if (rating < 900) return 'Bronze';
  if (rating < 1100) return 'Silver';
  if (rating < 1300) return 'Gold';
  if (rating < 1500) return 'Platinum';
  return 'Diamond';
}

function computeRatingDelta(userRating: number, scenarioRating: number, isCorrect: boolean): number {
  const k = 24;
  const expected = 1 / (1 + Math.pow(10, (scenarioRating - userRating) / 400));
  const score = isCorrect ? 1 : 0;
  const delta = Math.round(k * (score - expected));
  return Math.max(-40, Math.min(40, delta));
}

function todayKeyUtc(): string {
  return new Date().toISOString().slice(0, 10);
}

function yesterdayKeyUtc(): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

function dayBeforeYesterdayKeyUtc(): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - 2);
  return d.toISOString().slice(0, 10);
}

function weekKeyUtc(): string {
  const d = new Date();
  const year = d.getUTCFullYear();
  const firstJan = new Date(Date.UTC(year, 0, 1));
  const dayOfYear = Math.floor((d.getTime() - firstJan.getTime()) / 86400000) + 1;
  const week = Math.ceil(dayOfYear / 7);
  return `${year}-W${String(week).padStart(2, '0')}`;
}

async function updateStreakForCompletedDrill(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { streakCount: true, lastDrillCompletedOn: true, weeklyForgivenessUsedOn: true },
  });
  if (!user) return;

  const today = todayKeyUtc();
  const yesterday = yesterdayKeyUtc();
  const dayBefore = dayBeforeYesterdayKeyUtc();
  const thisWeek = weekKeyUtc();

  if (user.lastDrillCompletedOn === today) return;

  let nextStreak = 1;
  let nextWeeklyForgivenessUsedOn = user.weeklyForgivenessUsedOn;

  if (!user.lastDrillCompletedOn) {
    nextStreak = 1;
  } else if (user.lastDrillCompletedOn === yesterday) {
    nextStreak = user.streakCount + 1;
  } else if (
    user.lastDrillCompletedOn === dayBefore &&
    user.weeklyForgivenessUsedOn !== thisWeek
  ) {
    nextStreak = user.streakCount;
    nextWeeklyForgivenessUsedOn = thisWeek;
  } else {
    nextStreak = 1;
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      streakCount: nextStreak,
      lastDrillCompletedOn: today,
      weeklyForgivenessUsedOn: nextWeeklyForgivenessUsedOn,
    },
  });
}

async function upsertIdentity(params: {
  provider: 'google' | 'apple';
  subject: string;
  email?: string | null;
  displayName?: string | null;
  timezone?: string | null;
}) {
  const existing = await prisma.userIdentity.findUnique({
    where: {
      provider_subject: {
        provider: params.provider,
        subject: params.subject,
      },
    },
    include: { user: true },
  });

  if (existing) {
    const updatedUser = await prisma.user.update({
      where: { id: existing.userId },
      data: {
        email: params.email ?? existing.user.email,
        displayName: params.displayName ?? existing.user.displayName,
        timezone: params.timezone ?? existing.user.timezone,
      },
    });

    await prisma.userIdentity.update({
      where: { id: existing.id },
      data: {
        email: params.email ?? existing.email,
        displayName: params.displayName ?? existing.displayName,
      },
    });

    return updatedUser;
  }

  const created = await prisma.user.create({
    data: {
      email: params.email ?? undefined,
      displayName: params.displayName ?? undefined,
      timezone: params.timezone ?? undefined,
      identities: {
        create: {
          provider: params.provider,
          subject: params.subject,
          email: params.email ?? undefined,
          displayName: params.displayName ?? undefined,
        },
      },
      entitlement: { create: {} },
    },
  });

  return created;
}

async function pickNextScenarioForUser(params: {
  userId: string;
  excludeScenarioIds: string[];
}) {
  const user = await prisma.user.findUnique({ where: { id: params.userId } });
  if (!user) return null;

  const weakness = await prisma.userMistakeStat.findFirst({
    where: { userId: params.userId, wrongCount: { gt: 0 } },
    orderBy: [{ wrongCount: 'desc' }, { lastWrongAt: 'desc' }],
  });

  const baseWhere = {
    id: { notIn: params.excludeScenarioIds },
  } as const;

  const ratingMin = user.rating - 250;
  const ratingMax = user.rating + 250;

  const weaknessCandidates = weakness
    ? await prisma.scenario.findMany({
        where: {
          ...baseWhere,
          difficultyRating: { gte: ratingMin, lte: ratingMax },
          gradings: { some: { mistakeCategoryId: weakness.mistakeCategoryId } },
        },
        take: 25,
        include: { choices: { orderBy: { order: 'asc' } } },
      })
    : [];

  const candidates =
    weaknessCandidates.length > 0
      ? weaknessCandidates
      : await prisma.scenario.findMany({
          where: {
            ...baseWhere,
            difficultyRating: { gte: ratingMin, lte: ratingMax },
          },
          take: 25,
          include: { choices: { orderBy: { order: 'asc' } } },
        });

  const fallback =
    candidates.length > 0
      ? candidates
      : await prisma.scenario.findMany({
          where: baseWhere,
          take: 25,
          include: { choices: { orderBy: { order: 'asc' } } },
        });

  if (fallback.length === 0) return null;

  const choice = fallback[Math.floor(Math.random() * fallback.length)];
  return choice;
}

const server = Fastify({ logger: true });

server.register(cors, {
  origin: env.CORS_ORIGIN === '*' ? true : env.CORS_ORIGIN,
});

server.register(jwt, { secret: env.JWT_SECRET });

async function authenticate(req: FastifyRequest, reply: FastifyReply) {
  try {
    const decoded = (await (req as any).jwtVerify()) as unknown;
    const payload = z.object({ userId: z.string().min(1) }).parse(decoded);
    (req as any).user = { userId: payload.userId };
  } catch {
    return reply.code(401).send({ error: 'unauthorized' });
  }
}

server.get('/health', async () => ({ ok: true }));

server.post('/v1/auth/google', async (req: FastifyRequest, reply: FastifyReply) => {
  const body = z
    .object({
      idToken: z.string().min(1),
      timezone: z.string().optional(),
      pushToken: z.string().optional(),
    })
    .parse(req.body);

  if (!env.GOOGLE_CLIENT_ID) {
    return reply.code(500).send({ error: 'GOOGLE_CLIENT_ID not configured' });
  }

  const ticket = await googleClient.verifyIdToken({
    idToken: body.idToken,
    audience: env.GOOGLE_CLIENT_ID,
  });

  const payload = ticket.getPayload();
  if (!payload?.sub) return reply.code(401).send({ error: 'invalid_google_token' });

  const user = await upsertIdentity({
    provider: 'google',
    subject: payload.sub,
    email: payload.email ?? null,
    displayName: payload.name ?? null,
    timezone: body.timezone ?? null,
  });

  if (body.pushToken) {
    await prisma.device.upsert({
      where: { pushToken: body.pushToken },
      create: { pushToken: body.pushToken, userId: user.id },
      update: { userId: user.id },
    });
  }

  const token = server.jwt.sign({ userId: user.id });
  return { token };
});

server.post('/v1/auth/apple', async (req: FastifyRequest, reply: FastifyReply) => {
  const body = z
    .object({
      idToken: z.string().min(1),
      timezone: z.string().optional(),
      pushToken: z.string().optional(),
    })
    .parse(req.body);

  if (!env.APPLE_CLIENT_ID) {
    return reply.code(500).send({ error: 'APPLE_CLIENT_ID not configured' });
  }

  const { payload } = await jwtVerify(body.idToken, appleJwks, {
    issuer: 'https://appleid.apple.com',
    audience: env.APPLE_CLIENT_ID,
  });

  const sub = payload.sub;
  if (!sub) return reply.code(401).send({ error: 'invalid_apple_token' });

  const email = typeof payload.email === 'string' ? payload.email : null;

  const user = await upsertIdentity({
    provider: 'apple',
    subject: sub,
    email,
    displayName: null,
    timezone: body.timezone ?? null,
  });

  if (body.pushToken) {
    await prisma.device.upsert({
      where: { pushToken: body.pushToken },
      create: { pushToken: body.pushToken, userId: user.id },
      update: { userId: user.id },
    });
  }

  const token = server.jwt.sign({ userId: user.id });
  return { token };
});

server.get('/v1/me', { preHandler: authenticate }, async (req: FastifyRequest) => {
  const userId = (req as any).user.userId as string;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { entitlement: true },
  });

  if (!user) return { user: null };

  return {
    user: {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      rating: user.rating,
      tier: user.tier,
      streakCount: user.streakCount,
      entitlement: {
        isPaid: user.entitlement?.isPaid ?? false,
        currentPeriodEnd: user.entitlement?.currentPeriodEnd ?? null,
      },
    },
  };
});

server.post(
  '/v1/push/register',
  { preHandler: authenticate },
  async (req: FastifyRequest) => {
    const body = z.object({ pushToken: z.string().min(1) }).parse(req.body);
    const userId = (req as any).user.userId as string;

    await prisma.device.upsert({
      where: { pushToken: body.pushToken },
      create: { pushToken: body.pushToken, userId },
      update: { userId },
    });

    return { ok: true };
  },
);

server.post(
  '/v1/drills/start',
  { preHandler: authenticate },
  async (req: FastifyRequest, reply: FastifyReply) => {
    const userId = (req as any).user.userId as string;
    const body = z.object({ maxDecisions: z.number().int().min(1).max(25).optional() }).parse(req.body ?? {});

    const drill = await prisma.drill.create({
      data: {
        userId,
        maxDecisions: body.maxDecisions ?? 10,
      },
    });

    const scenario = await pickNextScenarioForUser({ userId, excludeScenarioIds: [] });
    if (!scenario) return reply.code(400).send({ error: 'no_scenarios_seeded' });

    return {
      drillId: drill.id,
      scenario: {
        id: scenario.id,
        code: scenario.code,
        street: scenario.street,
        spotType: scenario.spotType,
        prompt: scenario.promptJson,
        choices: scenario.choices.map((c) => ({ id: c.id, label: c.label, order: c.order })),
      },
    };
  },
);

server.get(
  '/v1/drills/:drillId/next',
  { preHandler: authenticate },
  async (req: FastifyRequest, reply: FastifyReply) => {
    const userId = (req as any).user.userId as string;
    const drillId = z.string().parse(req.params.drillId);

    const drill = await prisma.drill.findFirst({
      where: { id: drillId, userId },
      include: { decisions: true },
    });

    if (!drill) return reply.code(404).send({ error: 'drill_not_found' });

    if (drill.endedAt || drill.decisionsCount >= drill.maxDecisions) {
      return {
        done: true,
        summary: {
          drillId: drill.id,
          decisionsCount: drill.decisionsCount,
          ratingDeltaTotal: drill.ratingDeltaTotal,
        },
      };
    }

    const excludeScenarioIds = drill.decisions.map((d) => d.scenarioId);
    const scenario = await pickNextScenarioForUser({ userId, excludeScenarioIds });
    if (!scenario) return reply.code(400).send({ error: 'no_more_scenarios' });

    return {
      done: false,
      scenario: {
        id: scenario.id,
        code: scenario.code,
        street: scenario.street,
        spotType: scenario.spotType,
        prompt: scenario.promptJson,
        choices: scenario.choices.map((c) => ({ id: c.id, label: c.label, order: c.order })),
      },
    };
  },
);

server.post(
  '/v1/drills/:drillId/answer',
  { preHandler: authenticate },
  async (req: FastifyRequest, reply: FastifyReply) => {
    const userId = (req as any).user.userId as string;
    const drillId = z.string().parse(req.params.drillId);
    const body = z
      .object({
        scenarioId: z.string().min(1),
        choiceId: z.string().min(1),
        responseMs: z.number().int().min(0).max(300000).default(0),
      })
      .parse(req.body);

    const [drill, grading, user, scenario] = await Promise.all([
      prisma.drill.findFirst({ where: { id: drillId, userId } }),
      prisma.scenarioGrading.findUnique({
        where: {
          scenarioId_choiceId: { scenarioId: body.scenarioId, choiceId: body.choiceId },
        },
      }),
      prisma.user.findUnique({ where: { id: userId } }),
      prisma.scenario.findUnique({ where: { id: body.scenarioId } }),
    ]);

    if (!drill) return reply.code(404).send({ error: 'drill_not_found' });
    if (!user) return reply.code(404).send({ error: 'user_not_found' });
    if (!grading) return reply.code(400).send({ error: 'invalid_choice_for_scenario' });
    if (drill.endedAt || drill.decisionsCount >= drill.maxDecisions) {
      return reply.code(400).send({ error: 'drill_already_completed' });
    }

    const already = await prisma.decision.findFirst({
      where: { drillId: drill.id, scenarioId: body.scenarioId },
      select: { id: true },
    });
    if (already) return reply.code(400).send({ error: 'scenario_already_answered' });

    const ratingDelta = computeRatingDelta(
      user.rating,
      scenario?.difficultyRating ?? user.rating,
      grading.isCorrect,
    );

    const decision = await prisma.decision.create({
      data: {
        drillId: drill.id,
        scenarioId: body.scenarioId,
        choiceId: body.choiceId,
        isCorrect: grading.isCorrect,
        ratingDelta,
        responseMs: body.responseMs,
        mistakeCategoryId: grading.mistakeCategoryId ?? undefined,
      },
    });

    if (!grading.isCorrect && grading.mistakeCategoryId) {
      await prisma.userMistakeStat.upsert({
        where: { userId_mistakeCategoryId: { userId, mistakeCategoryId: grading.mistakeCategoryId } },
        create: {
          userId,
          mistakeCategoryId: grading.mistakeCategoryId,
          wrongCount: 1,
          lastWrongAt: new Date(),
        },
        update: {
          wrongCount: { increment: 1 },
          lastWrongAt: new Date(),
        },
      });
    }

    const nextRating = user.rating + ratingDelta;
    const nextTier = tierForRating(nextRating);

    const updatedDrill = await prisma.drill.update({
      where: { id: drill.id },
      data: {
        decisionsCount: { increment: 1 },
        ratingDeltaTotal: { increment: ratingDelta },
      },
    });

    await prisma.user.update({
      where: { id: userId },
      data: {
        rating: nextRating,
        tier: nextTier,
      },
    });

    let ended = false;
    if (updatedDrill.decisionsCount >= updatedDrill.maxDecisions) {
      ended = true;
      await prisma.drill.update({
        where: { id: updatedDrill.id },
        data: { endedAt: new Date() },
      });
      await updateStreakForCompletedDrill(userId);
    }

    const correctChoice = await prisma.scenarioGrading.findFirst({
      where: { scenarioId: body.scenarioId, isCorrect: true },
      select: { choiceId: true },
    });

    return {
      decisionId: decision.id,
      isCorrect: grading.isCorrect,
      ratingDelta,
      newRating: nextRating,
      newTier: nextTier,
      correctChoiceId: correctChoice?.choiceId ?? null,
      done: ended,
    };
  },
);

server.post('/v1/webhooks/revenuecat', async (req: FastifyRequest, reply: FastifyReply) => {
  const auth = req.headers['authorization'];
  if (!env.REVENUECAT_WEBHOOK_SECRET) {
    return reply.code(500).send({ error: 'REVENUECAT_WEBHOOK_SECRET not configured' });
  }

  if (auth !== env.REVENUECAT_WEBHOOK_SECRET) {
    return reply.code(401).send({ error: 'unauthorized' });
  }

  const body = z
    .object({
      event: z
        .object({
          id: z.string().min(1),
          app_user_id: z.string().min(1),
          entitlement_ids: z.array(z.string()).optional(),
          expiration_at_ms: z.number().optional().nullable(),
          type: z.string().optional(),
        })
        .passthrough(),
    })
    .passthrough()
    .parse(req.body);

  try {
    await prisma.webhookEvent.create({ data: { id: body.event.id } });
  } catch {
    return { ok: true, duplicate: true };
  }

  const isPaid = (body.event.entitlement_ids ?? []).includes('pro');
  const periodEnd = body.event.expiration_at_ms ? new Date(body.event.expiration_at_ms) : null;

  await prisma.userEntitlement.upsert({
    where: { userId: body.event.app_user_id },
    create: {
      userId: body.event.app_user_id,
      isPaid,
      currentPeriodEnd: periodEnd,
      source: 'revenuecat',
    },
    update: {
      isPaid,
      currentPeriodEnd: periodEnd,
    },
  });

  return { ok: true };
});

server
  .listen({ port: env.PORT, host: '0.0.0.0' })
  .catch((err: unknown) => {
    server.log.error(err);
    process.exit(1);
  });
