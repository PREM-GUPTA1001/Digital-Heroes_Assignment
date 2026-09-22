import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { stripe, PLANS } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  const { user, profile } = await requireUser();

  const form = await request.formData();
  const plan = String(form.get("plan"));
  if (plan !== "monthly" && plan !== "yearly") {
    return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: existing } = await admin
    .from("subscriptions")
    .select("status, stripe_customer_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing?.status === "active") {
    return NextResponse.redirect(new URL("/dashboard", request.url), { status: 303 });
  }

  let customerId = existing?.stripe_customer_id as string | null | undefined;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      name: profile?.full_name ?? undefined,
      metadata: { user_id: user.id },
    });
    customerId = customer.id;
    await admin.from("subscriptions").update({ stripe_customer_id: customerId }).eq("user_id", user.id);
  }

  const site = process.env.NEXT_PUBLIC_SITE_URL!;
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price: PLANS[plan].priceId, quantity: 1 }],
    metadata: { user_id: user.id, plan },
    subscription_data: { metadata: { user_id: user.id, plan } },
    success_url: `${site}/api/stripe/sync?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${site}/subscribe`,
  });

  return NextResponse.redirect(session.url!, { status: 303 });
}