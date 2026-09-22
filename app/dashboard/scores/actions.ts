"use server";

import { revalidatePath } from "next/cache";
import { requireActiveSubscription } from "@/lib/auth";

export type ActionState = { error?: string; success?: string };

const DUPLICATE_MSG = "You already have a score for this date. Edit or delete it instead.";

function parseScoreForm(formData: FormData): { score: number; playedOn: string } | { error: string } {
  const score = Number(formData.get("score"));
  const playedOn = String(formData.get("played_on") ?? "");

  if (!Number.isInteger(score) || score < 1 || score > 45) {
    return { error: "Score must be a whole number between 1 and 45." };
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(playedOn) || Number.isNaN(Date.parse(playedOn))) {
    return { error: "Please choose a valid date." };
  }
  const limit = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  if (playedOn > limit) {
    return { error: "The date can't be in the future." };
  }
  return { score, playedOn };
}

export async function addScore(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase, user } = await requireActiveSubscription();

  const parsed = parseScoreForm(formData);
  if ("error" in parsed) return { error: parsed.error };

  const { data: existing } = await supabase
    .from("scores")
    .select("id, played_on")
    .eq("user_id", user.id)
    .order("played_on", { ascending: true });
  const rows: { id: string; played_on: string }[] = existing ?? [];

  if (rows.some((r) => r.played_on === parsed.playedOn)) {
    return { error: DUPLICATE_MSG };
  }
  if (rows.length >= 5 && parsed.playedOn < rows[0].played_on) {
    return {
      error: `You already have 5 newer scores. Only your latest 5 are kept, so a score from before ${rows[0].played_on} can't be added.`,
    };
  }

  const { error } = await supabase
    .from("scores")
    .insert({ user_id: user.id, score: parsed.score, played_on: parsed.playedOn });

  if (error) {
    if (error.code === "23505") return { error: DUPLICATE_MSG };
    return { error: "Could not save the score. Please try again." };
  }

  revalidatePath("/dashboard");
  return {
    success: rows.length >= 5 ? "Score added. Your oldest score was replaced." : "Score added.",
  };
}

export async function updateScore(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase, user } = await requireActiveSubscription();

  const id = String(formData.get("id") ?? "");
  const parsed = parseScoreForm(formData);
  if ("error" in parsed) return { error: parsed.error };

  const { error } = await supabase
    .from("scores")
    .update({ score: parsed.score, played_on: parsed.playedOn })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    if (error.code === "23505") return { error: DUPLICATE_MSG };
    return { error: "Could not update the score. Please try again." };
  }

  revalidatePath("/dashboard");
  return { success: "Score updated." };
}

export async function deleteScore(formData: FormData): Promise<void> {
  const { supabase, user } = await requireActiveSubscription();
  const id = String(formData.get("id") ?? "");
  await supabase.from("scores").delete().eq("id", id).eq("user_id", user.id);
  revalidatePath("/dashboard");
}