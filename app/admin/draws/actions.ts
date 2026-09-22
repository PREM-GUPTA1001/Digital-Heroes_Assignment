"use server";

import { randomInt } from "node:crypto";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { loadDrawContext, getRolloverInCents } from "@/lib/draw-data";
import { pickRandom, pickWeighted, computeDraw } from "@/lib/draw-engine";

export async function simulateDraw(formData: FormData): Promise<void> {
  await requireAdmin();

  const month = String(formData.get("month") ?? "");
  const mode = String(formData.get("mode")) === "algorithm" ? "algorithm" : "random";
  if (!/^\d{4}-\d{2}$/.test(month)) redirect("/admin/draws?error=month");
  const drawMonth = `${month}-01`;

  const admin = createAdminClient();
  const { data: existing } = await admin
    .from("draws")
    .select("id, status")
    .eq("draw_month", drawMonth)
    .maybeSingle();
  if (existing?.status === "published") redirect("/admin/draws?error=published");

  const ctx = await loadDrawContext();
  const winning =
    mode === "random" ? pickRandom() : pickWeighted(ctx.entries.flatMap((e) => e.scores));
  const rolloverIn = await getRolloverInCents(admin, drawMonth);

  const { error } = await admin.from("draws").upsert(
    {
      draw_month: drawMonth,
      mode,
      status: "simulated",
      winning_numbers: winning,
      active_subscribers: ctx.activeCount,
      pool_total: ctx.poolTotalCents / 100,
      rollover_in: rolloverIn / 100,
      jackpot_rolled_out: 0,
      published_at: null,
    },
    { onConflict: "draw_month" }
  );
  if (error) throw new Error(error.message);

  revalidatePath("/admin/draws");
  redirect("/admin/draws");
}

export async function publishDraw(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");

  const admin = createAdminClient();
  const { data: draw } = await admin.from("draws").select("*").eq("id", id).maybeSingle();
  if (!draw || draw.status === "published" || !draw.winning_numbers) {
    redirect("/admin/draws?error=publish");
  }

  const ctx = await loadDrawContext();
  const rolloverIn = await getRolloverInCents(admin, draw.draw_month);
  const result = computeDraw(ctx.entries, draw.winning_numbers, ctx.poolTotalCents, rolloverIn);

  await admin.from("draw_entries").delete().eq("draw_id", id);
  await admin.from("winners").delete().eq("draw_id", id);

  const entryRows = result.results.map((r) => ({
    draw_id: id,
    user_id: r.userId,
    scores: r.scores,
    match_count: r.matches,
  }));
  for (let i = 0; i < entryRows.length; i += 500) {
    const { error } = await admin.from("draw_entries").insert(entryRows.slice(i, i + 500));
    if (error) throw new Error(error.message);
  }

  const prizeByMatch = new Map(result.tiers.map((t) => [t.match as number, t.eachCents]));
  const winnerRows = result.results
    .filter((r) => r.matches >= 3)
    .map((r) => ({
      draw_id: id,
      user_id: r.userId,
      match_type: r.matches,
      prize_amount: (prizeByMatch.get(r.matches) ?? 0) / 100,
    }));
  if (winnerRows.length > 0) {
    const { error } = await admin.from("winners").insert(winnerRows);
    if (error) throw new Error(error.message);
  }

  const { error } = await admin
    .from("draws")
    .update({
      status: "published",
      published_at: new Date().toISOString(),
      active_subscribers: ctx.activeCount,
      pool_total: ctx.poolTotalCents / 100,
      rollover_in: rolloverIn / 100,
      jackpot_rolled_out: result.jackpotRolledOutCents / 100,
    })
    .eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/draws");
  redirect("/admin/draws");
}

export async function seedDemoUsers(): Promise<void> {
  await requireAdmin();
  const admin = createAdminClient();

  for (let i = 1; i <= 20; i++) {
    const email = `demo${i}@demo-heroes.dev`;
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password: "Demo@12345",
      email_confirm: true,
      user_metadata: { full_name: `Demo Player ${i}` },
    });

    let userId: string | undefined = data?.user?.id;
    if (error || !userId) {
      const { data: existing } = await admin.from("profiles").select("id").eq("email", email).maybeSingle();
      userId = existing?.id;
    }
    if (!userId) continue;
    const uid: string = userId;

    await admin
      .from("subscriptions")
      .update({
        status: "active",
        plan: "monthly",
        amount: 9.99,
        renewal_date: new Date(Date.now() + 30 * 86400000).toISOString(),
      })
      .eq("user_id", uid);

    await admin.from("scores").delete().eq("user_id", uid);
    const rows = Array.from({ length: 5 }, (_, k) => ({
      user_id: uid,
      score: randomInt(1, 16),
      played_on: new Date(Date.now() - k * 86400000).toISOString().slice(0, 10),
    }));
    await admin.from("scores").insert(rows);
  }

  revalidatePath("/admin/draws");
  redirect("/admin/draws");
}

export async function removeDemoUsers(): Promise<void> {
  await requireAdmin();
  const admin = createAdminClient();
  const { data } = await admin.from("profiles").select("id").like("email", "demo%@demo-heroes.dev");
  for (const row of data ?? []) {
    await admin.auth.admin.deleteUser(row.id);
  }
  revalidatePath("/admin/draws");
  redirect("/admin/draws");
}