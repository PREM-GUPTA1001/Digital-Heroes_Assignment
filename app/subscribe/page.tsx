import { requireUser, getSubscription } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PLANS, type PlanKey } from "@/lib/stripe";

export default async function SubscribePage() {
  const { supabase, user, profile } = await requireUser();
  const sub = await getSubscription(supabase, user.id);
  if (sub?.status === "active") redirect("/dashboard");

  const charityName = profile?.charities?.name ?? "your chosen charity";

  return (
    <main className="min-h-screen bg-[#0a0a14] px-4 py-12 text-white">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-4xl font-bold">Choose your plan</h1>
        <p className="mt-2 text-white/60">
          {profile?.charity_percent ?? 10}% of every payment goes to{" "}
          <span className="text-emerald-400">{charityName}</span>. The rest powers the monthly prize pool.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {(Object.keys(PLANS) as PlanKey[]).map((key) => {
            const plan = PLANS[key];
            return (
              <form
                key={key}
                action="/api/stripe/checkout"
                method="post"
                className={`rounded-2xl border p-6 ${
                  key === "yearly" ? "border-emerald-400/60 bg-emerald-400/5" : "border-white/10 bg-white/5"
                }`}
              >
                <input type="hidden" name="plan" value={key} />
                <h2 className="text-xl font-semibold">{plan.label}</h2>
                <p className="mt-3 text-4xl font-bold">
                  ${plan.price}
                  <span className="text-base font-normal text-white/50"> / {plan.per}</span>
                </p>
                <p className="mt-2 text-sm text-white/60">{plan.note}</p>
                <button className="mt-6 w-full rounded-lg bg-emerald-500 py-2.5 font-semibold text-black transition hover:bg-emerald-400">
                  Subscribe
                </button>
              </form>
            );
          })}
        </div>

        <p className="mt-6 text-xs text-white/40">Test mode: use card 4242 4242 4242 4242, any future date, any CVC.</p>
      </div>
    </main>
  );
}