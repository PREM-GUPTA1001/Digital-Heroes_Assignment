// Server-side guards. Call these at the top of any protected page / server action.
import { redirect } from "next/navigation";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

/** Logged-in user + profile (with charity name). Redirects to /login if not logged in. */
export async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*, charities(name)")
    .eq("id", user.id)
    .single();

  return { supabase, user, profile };
}

/** Same as requireUser, but only admins get through. */
export async function requireAdmin() {
  const ctx = await requireUser();
  if (ctx.profile?.role !== "admin") redirect("/dashboard");
  return ctx;
}

/** Reads the CURRENT subscription row (real-time check, no caching). */
export async function getSubscription(supabase: SupabaseClient, userId: string) {
  const { data } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  return data;
}

/** Use on pages / actions that are for paying subscribers only. */
export async function requireActiveSubscription() {
  const ctx = await requireUser();
  const sub = await getSubscription(ctx.supabase, ctx.user.id);
  const active =
    sub?.status === "active" &&
    (!sub.renewal_date || new Date(sub.renewal_date) > new Date());
  if (!active) redirect("/dashboard?subscribe=1");
  return { ...ctx, subscription: sub };
}
