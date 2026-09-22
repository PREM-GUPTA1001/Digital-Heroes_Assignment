import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";
import { POOL_SHARE, monthlyFee, type Entry } from "@/lib/draw-engine";

const PAGE = 1000;

export type DrawContext = {
  activeCount: number;
  entries: Entry[];
  poolTotalCents: number;
};

export async function loadDrawContext(): Promise<DrawContext> {
  const admin = createAdminClient();

  const subs: { user_id: string; plan: string | null; amount: number | null }[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await admin
      .from("subscriptions")
      .select("user_id, plan, amount")
      .eq("status", "active")
      .order("user_id")
      .range(from, from + PAGE - 1);
    if (error) throw new Error(error.message);
    subs.push(...(data ?? []));
    if (!data || data.length < PAGE) break;
  }
  const activeIds = new Set(subs.map((s) => s.user_id));

  const scoresByUser = new Map<string, number[]>();
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await admin
      .from("scores")
      .select("id, user_id, score")
      .order("id")
      .range(from, from + PAGE - 1);
    if (error) throw new Error(error.message);
    for (const row of data ?? []) {
      if (!activeIds.has(row.user_id)) continue;
      const list = scoresByUser.get(row.user_id) ?? [];
      list.push(row.score);
      scoresByUser.set(row.user_id, list);
    }
    if (!data || data.length < PAGE) break;
  }

  // ASSUMPTION: a subscriber is entered only if they have all 5 scores.
  const entries: Entry[] = [];
  for (const [userId, scores] of scoresByUser) {
    if (scores.length === 5) entries.push({ userId, scores });
  }

  const poolDollars = subs.reduce((sum, s) => sum + monthlyFee(s.plan, s.amount) * POOL_SHARE, 0);
  return { activeCount: subs.length, entries, poolTotalCents: Math.round(poolDollars * 100) };
}

export async function getRolloverInCents(admin: SupabaseClient, drawMonth: string): Promise<number> {
  const { data } = await admin
    .from("draws")
    .select("jackpot_rolled_out")
    .eq("status", "published")
    .lt("draw_month", drawMonth)
    .order("draw_month", { ascending: false })
    .limit(1)
    .maybeSingle();
  return Math.round(Number(data?.jackpot_rolled_out ?? 0) * 100);
}