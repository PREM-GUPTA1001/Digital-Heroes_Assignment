"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export async function reviewWinner(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const decision = String(formData.get("decision") ?? "");
  if (decision !== "approved" && decision !== "rejected") return;

  const admin = createAdminClient();
  const { data: winner } = await admin
    .from("winners")
    .select("proof_url, payment_status")
    .eq("id", id)
    .maybeSingle();
  if (!winner?.proof_url || winner.payment_status === "paid") return;

  await admin.from("winners").update({ verification_status: decision }).eq("id", id);
  revalidatePath("/admin/winners");
}

export async function markPaid(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");

  const admin = createAdminClient();
  const { data: winner } = await admin
    .from("winners")
    .select("verification_status")
    .eq("id", id)
    .maybeSingle();
  if (winner?.verification_status !== "approved") return;

  await admin.from("winners").update({ payment_status: "paid" }).eq("id", id);
  revalidatePath("/admin/winners");
}