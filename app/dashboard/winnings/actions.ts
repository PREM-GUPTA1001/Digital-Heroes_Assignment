"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export type ProofState = { error?: string; success?: string };

export async function saveProof(winnerId: string, path: string): Promise<ProofState> {
  const { supabase, user } = await requireUser();

  if (!path.startsWith(`${user.id}/`)) return { error: "Invalid file." };

  const { data: winner } = await supabase
    .from("winners")
    .select("id, verification_status")
    .eq("id", winnerId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!winner) return { error: "We couldn't find that win." };
  if (winner.verification_status === "approved") return { error: "This win is already approved." };

  const { error } = await createAdminClient()
    .from("winners")
    .update({ proof_url: path, verification_status: "pending" })
    .eq("id", winnerId)
    .eq("user_id", user.id);
  if (error) return { error: "Could not save your proof. Please try again." };

  revalidatePath("/dashboard");
  return { success: "Proof uploaded. We'll review it soon." };
}