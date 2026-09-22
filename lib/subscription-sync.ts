import type Stripe from "stripe";
import { createAdminClient } from "@/lib/supabase/admin";

type DbStatus = "inactive" | "active" | "cancelled" | "lapsed";

export function mapStatus(status: Stripe.Subscription.Status): DbStatus {
  switch (status) {
    case "active":
    case "trialing":
      return "active";
    case "past_due":
    case "unpaid":
      return "lapsed";
    case "canceled":
      return "cancelled";
    default:
      return "inactive";
  }
}

function readPeriodEnd(sub: Stripe.Subscription): number | undefined {
  const item = sub.items.data[0] as unknown as { current_period_end?: number } | undefined;
  const root = sub as unknown as { current_period_end?: number };
  return item?.current_period_end ?? root.current_period_end;
}

export async function applyStripeSubscription(userId: string, sub: Stripe.Subscription) {
  const admin = createAdminClient();
  const price = sub.items.data[0]?.price;
  const periodEnd = readPeriodEnd(sub);

  const { error } = await admin.from("subscriptions").upsert(
    {
      user_id: userId,
      plan: price?.recurring?.interval === "year" ? "yearly" : "monthly",
      status: mapStatus(sub.status),
      amount: price?.unit_amount != null ? price.unit_amount / 100 : null,
      renewal_date: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
      stripe_customer_id: typeof sub.customer === "string" ? sub.customer : sub.customer.id,
      stripe_subscription_id: sub.id,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );
  if (error) throw new Error(`Failed to save subscription: ${error.message}`);
}