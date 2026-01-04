import 'dotenv/config';

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

type SeedScenario = {
  code: string;
  street: 'FLOP' | 'TURN' | 'RIVER';
  spotType: string;
  difficultyRating: number;
  promptJson: any;
  choices: string[];
  correctChoiceOrder: number;
  mistakeCategoryCodeIfWrong: string;
  severityIfWrong: number;
};

async function seedMistakeCategories() {
  const categories = [
    { code: 'overfold', name: 'Overfold' },
    { code: 'overcall', name: 'Overcall / Sticky' },
    { code: 'missed_value', name: 'Missed Value' },
    { code: 'bluff_too_much', name: 'Bluff Too Much' },
    { code: 'bluff_too_little', name: 'Bluff Too Little' },
    { code: 'bad_size', name: 'Bad Sizing' },
  ];

  for (const c of categories) {
    await prisma.mistakeCategory.upsert({
      where: { code: c.code },
      create: c,
      update: { name: c.name },
    });
  }
}

async function seedScenarios() {
  const scenarios: SeedScenario[] = [
    {
      code: 'srp_btn_vs_bb_flop_k72r_cbet_freq',
      street: 'FLOP',
      spotType: 'SRP_BTN_VS_BB',
      difficultyRating: 980,
      promptJson: {
        street: 'FLOP',
        heroPosition: 'BTN',
        villainPosition: 'BB',
        heroHand: 'A♣J♣',
        board: 'K♦ 7♠ 2♥',
        potBb: 6,
        stackBb: 95,
        action: 'BB checks to you.',
        note: 'Single-raised pot, heads-up.',
      },
      choices: ['Bet 33%', 'Bet 75%', 'Check back'],
      correctChoiceOrder: 1,
      mistakeCategoryCodeIfWrong: 'bad_size',
      severityIfWrong: 2,
    },
    {
      code: 'srp_co_vs_btn_flop_jt4ss_ip_pressure',
      street: 'FLOP',
      spotType: 'SRP_CO_VS_BTN',
      difficultyRating: 1040,
      promptJson: {
        street: 'FLOP',
        heroPosition: 'CO',
        villainPosition: 'BTN',
        heroHand: 'Q♠J♠',
        board: 'J♦ T♦ 4♠',
        potBb: 7.5,
        stackBb: 90,
        action: 'You c-bet and BTN raises small.',
        note: 'Decide your response with top pair + strong draw.',
      },
      choices: ['Call', '3-bet', 'Fold'],
      correctChoiceOrder: 0,
      mistakeCategoryCodeIfWrong: 'overfold',
      severityIfWrong: 3,
    },
    {
      code: '3bp_btn_vs_co_flop_a83r_value',
      street: 'FLOP',
      spotType: '3BP_BTN_VS_CO',
      difficultyRating: 1120,
      promptJson: {
        street: 'FLOP',
        heroPosition: 'BTN',
        villainPosition: 'CO',
        heroHand: 'A♥Q♦',
        board: 'A♠ 8♣ 3♦',
        potBb: 18,
        stackBb: 75,
        action: 'CO checks to you in a 3-bet pot.',
        note: 'Extract value without torching vs stronger Ax.',
      },
      choices: ['Bet 25%', 'Bet 75%', 'Check back'],
      correctChoiceOrder: 0,
      mistakeCategoryCodeIfWrong: 'bad_size',
      severityIfWrong: 2,
    },
    {
      code: 'srp_btn_vs_bb_turn_double_barrel',
      street: 'TURN',
      spotType: 'SRP_BTN_VS_BB',
      difficultyRating: 1060,
      promptJson: {
        street: 'TURN',
        heroPosition: 'BTN',
        villainPosition: 'BB',
        heroHand: 'Q♣T♣',
        board: 'K♠ 8♦ 2♣ | 6♣',
        potBb: 12,
        stackBb: 85,
        action: 'You c-bet flop, BB called. BB checks turn.',
        note: 'You picked up equity; pressure is possible.',
      },
      choices: ['Bet 75%', 'Bet 33%', 'Check back'],
      correctChoiceOrder: 0,
      mistakeCategoryCodeIfWrong: 'bluff_too_little',
      severityIfWrong: 2,
    },
    {
      code: 'srp_hj_vs_bb_turn_thin_value',
      street: 'TURN',
      spotType: 'SRP_HJ_VS_BB',
      difficultyRating: 1180,
      promptJson: {
        street: 'TURN',
        heroPosition: 'HJ',
        villainPosition: 'BB',
        heroHand: 'K♥Q♥',
        board: 'Q♠ 9♣ 5♦ | 2♠',
        potBb: 10,
        stackBb: 92,
        action: 'You c-bet flop, BB called. BB checks turn.',
        note: 'Go for value vs worse Qx / draws.',
      },
      choices: ['Bet 66%', 'Check back', 'Bet 25%'],
      correctChoiceOrder: 2,
      mistakeCategoryCodeIfWrong: 'missed_value',
      severityIfWrong: 3,
    },
    {
      code: '3bp_sb_vs_btn_turn_overbluff_spot',
      street: 'TURN',
      spotType: '3BP_SB_VS_BTN',
      difficultyRating: 1240,
      promptJson: {
        street: 'TURN',
        heroPosition: 'SB',
        villainPosition: 'BTN',
        heroHand: 'A♦5♦',
        board: 'K♦ 9♠ 3♦ | 9♦',
        potBb: 22,
        stackBb: 70,
        action: 'You c-bet flop, BTN called. Turn pairs and brings flush.',
        note: 'Choose between giving up vs applying pressure.',
      },
      choices: ['Check', 'Bet 75%', 'All-in'],
      correctChoiceOrder: 0,
      mistakeCategoryCodeIfWrong: 'bluff_too_much',
      severityIfWrong: 3,
    },
    {
      code: 'srp_btn_vs_bb_river_value_bet',
      street: 'RIVER',
      spotType: 'SRP_BTN_VS_BB',
      difficultyRating: 1150,
      promptJson: {
        street: 'RIVER',
        heroPosition: 'BTN',
        villainPosition: 'BB',
        heroHand: 'A♠9♠',
        board: 'A♦ 7♣ 4♠ | 2♥ | 2♣',
        potBb: 18,
        stackBb: 78,
        action: 'You bet flop/turn, BB called twice. River checks to you.',
        note: 'Decide on value vs showdown.',
      },
      choices: ['Bet 33%', 'Check back', 'Bet 75%'],
      correctChoiceOrder: 0,
      mistakeCategoryCodeIfWrong: 'missed_value',
      severityIfWrong: 3,
    },
    {
      code: 'srp_co_vs_bb_river_bluff_catcher',
      street: 'RIVER',
      spotType: 'SRP_CO_VS_BB',
      difficultyRating: 1320,
      promptJson: {
        street: 'RIVER',
        heroPosition: 'CO',
        villainPosition: 'BB',
        heroHand: 'K♣Q♣',
        board: 'Q♥ 8♠ 3♣ | J♦ | 6♠',
        potBb: 24,
        stackBb: 70,
        action: 'You checked back turn. River BB overbets.',
        note: 'Bluff-catch vs polarized range.',
      },
      choices: ['Call', 'Fold'],
      correctChoiceOrder: 1,
      mistakeCategoryCodeIfWrong: 'overcall',
      severityIfWrong: 3,
    },
    {
      code: '3bp_btn_vs_sb_river_thin_value',
      street: 'RIVER',
      spotType: '3BP_BTN_VS_SB',
      difficultyRating: 1400,
      promptJson: {
        street: 'RIVER',
        heroPosition: 'BTN',
        villainPosition: 'SB',
        heroHand: 'J♠J♥',
        board: 'A♣ J♦ 6♦ | 4♠ | 2♣',
        potBb: 40,
        stackBb: 55,
        action: 'SB checks river after calling flop/turn.',
        note: 'Value bet vs Ax? Consider blockers and ranges.',
      },
      choices: ['Bet 33%', 'Bet 75%', 'Check back'],
      correctChoiceOrder: 1,
      mistakeCategoryCodeIfWrong: 'bad_size',
      severityIfWrong: 3,
    },
  ];

  const categories = await prisma.mistakeCategory.findMany({
    select: { id: true, code: true },
  });
  const categoryIdByCode = new Map(categories.map((c) => [c.code, c.id]));

  for (const s of scenarios) {
    const mistakeCategoryId = categoryIdByCode.get(s.mistakeCategoryCodeIfWrong);
    if (!mistakeCategoryId) {
      throw new Error(`Missing mistake category: ${s.mistakeCategoryCodeIfWrong}`);
    }

    await prisma.$transaction(async (tx) => {
      const scenario = await tx.scenario.upsert({
        where: { code: s.code },
        create: {
          code: s.code,
          street: s.street,
          spotType: s.spotType,
          difficultyRating: s.difficultyRating,
          promptJson: s.promptJson,
        },
        update: {
          street: s.street,
          spotType: s.spotType,
          difficultyRating: s.difficultyRating,
          promptJson: s.promptJson,
        },
      });

      await tx.scenarioGrading.deleteMany({ where: { scenarioId: scenario.id } });
      await tx.scenarioChoice.deleteMany({ where: { scenarioId: scenario.id } });

      const createdChoices: { id: string; order: number }[] = [];

      for (let i = 0; i < s.choices.length; i++) {
        const created = await tx.scenarioChoice.create({
          data: {
            scenarioId: scenario.id,
            label: s.choices[i],
            order: i,
          },
          select: { id: true, order: true },
        });
        createdChoices.push(created);
      }

      for (const c of createdChoices) {
        const isCorrect = c.order === s.correctChoiceOrder;
        await tx.scenarioGrading.create({
          data: {
            scenarioId: scenario.id,
            choiceId: c.id,
            isCorrect,
            mistakeCategoryId: isCorrect ? undefined : mistakeCategoryId,
            severity: isCorrect ? undefined : s.severityIfWrong,
          },
        });
      }
    });
  }
}

async function main() {
  await seedMistakeCategories();
  await seedScenarios();
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    // eslint-disable-next-line no-console
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
