import { randomInt } from "node:crypto";

export const MAX_NUMBER = 45;
export const PICK_COUNT = 5;

// ASSUMPTION: half of each monthly fee funds the prize pool.
export const POOL_SHARE = 0.5;

// PRD: 5-match 40% (jackpot, rolls over), 4-match 35%, 3-match 25%.
export const TIER_SHARE = { 5: 0.4, 4: 0.35, 3: 0.25 } as const;
export type Tier = 5 | 4 | 3;

const FALLBACK_MONTHLY = 9.99;
const FALLBACK_YEARLY = 99.99;

export type Entry = { userId: string; scores: number[] };

export function monthlyFee(plan: string | null, amount: number | null): number {
  const paid = amount != null ? Number(amount) : plan === "yearly" ? FALLBACK_YEARLY : FALLBACK_MONTHLY;
  return plan === "yearly" ? paid / 12 : paid;
}

export function pickRandom(): number[] {
  const chosen = new Set<number>();
  while (chosen.size < PICK_COUNT) chosen.add(randomInt(1, MAX_NUMBER + 1));
  return [...chosen].sort((a, b) => a - b);
}

// Algorithm mode: numbers players score most often are MORE likely to be drawn.
// weight(n) = 1 + how many times n appears in all entered scores.
export function pickWeighted(allScores: number[]): number[] {
  const weight: number[] = new Array(MAX_NUMBER + 1).fill(1);
  for (const s of allScores) {
    if (s >= 1 && s <= MAX_NUMBER) weight[s] += 1;
  }

  const pool: number[] = Array.from({ length: MAX_NUMBER }, (_, i) => i + 1);
  const chosen: number[] = [];
  while (chosen.length < PICK_COUNT) {
    const total = pool.reduce((sum, n) => sum + weight[n], 0);
    let r = randomInt(0, total);
    for (let i = 0; i < pool.length; i++) {
      r -= weight[pool[i]];
      if (r < 0) {
        chosen.push(pool[i]);
        pool.splice(i, 1);
        break;
      }
    }
  }
  return chosen.sort((a, b) => a - b);
}

export function countMatches(userScores: number[], winning: number[]): number {
  const win = new Set(winning);
  return [...new Set(userScores)].filter((s) => win.has(s)).length;
}

export type TierResult = { match: Tier; winners: number; poolCents: number; eachCents: number };
export type DrawComputation = {
  results: { userId: string; scores: number[]; matches: number }[];
  tiers: TierResult[];
  jackpotRolledOutCents: number;
};

// All money is in CENTS (integers) so there is no floating point drift.
export function computeDraw(
  entries: Entry[],
  winning: number[],
  poolTotalCents: number,
  rolloverInCents: number
): DrawComputation {
  const results = entries.map((e) => ({
    userId: e.userId,
    scores: e.scores,
    matches: countMatches(e.scores, winning),
  }));

  const tiers: TierResult[] = ([5, 4, 3] as const).map((match) => {
    const winners = results.filter((r) => r.matches === match).length;
    const base = Math.floor(poolTotalCents * TIER_SHARE[match]);
    const poolCents = match === 5 ? base + rolloverInCents : base;
    return { match, winners, poolCents, eachCents: winners > 0 ? Math.floor(poolCents / winners) : 0 };
  });

  const jackpot = tiers[0];
  return {
    results,
    tiers,
    jackpotRolledOutCents: jackpot.winners === 0 ? jackpot.poolCents : 0,
  };
}