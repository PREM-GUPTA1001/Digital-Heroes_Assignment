import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe";
import { applyStripeSubscription } from "@/lib/subscription-sync";

export async function GET(request: Request) {
  const sessionId = new URL(request.url).searchParams.get("session_id");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL("/login", request.url));
  if (!sessionId) return NextResponse.redirect(new URL("/dashboard", request.url));

  const session = await stripe.checkout.sessions.retrieve(sessionId, { expand: ["subscription"] });

  if (session.metadata?.user_id !== user.id) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  const sub = session.subscription;
  if (sub && typeof sub !== "string") {
    await applyStripeSubscription(user.id, sub);
  }
  return NextResponse.redirect(new URL("/dashboard?subscribed=1", request.url));
}