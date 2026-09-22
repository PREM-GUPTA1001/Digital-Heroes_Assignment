import Link from "next/link";
import { requireUser, getSubscription } from "@/lib/auth";
import ScoresPanel from "@/components/ScoresPanel";
import WinningsPanel, { type WinRow } from "@/components/WinningsPanel";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ subscribed?: string; subscribe?: string }>;
}) {
  const { subscribed, subscribe } = await searchParams;
  const { supabase, user, profile } = await requireUser();
  const sub = await getSubscription(supabase, user.id);
  const isActive = sub?.status === "active";

  let scores: { id: string; score: number; played_on: string }[] = [];
  if (isActive) {
    const { data } = await supabase
      .from("scores")
      .select("id, score, played_on")
      .eq("user_id", user.id)
      .order("played_on", { ascending: false });
    scores = data ?? [];
  }

  const { count: drawsEntered } = await supabase
    .from("draw_entries")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id);

  const { data: winData } = await supabase
    .from("winners")
    .select("id, draw_id, match_type, prize_amount, proof_url, verification_status, payment_status")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });
  const winRows: {
    id: string;
    draw_id: string;
    match_type: number;
    prize_amount: number;
    proof_url: string | null;
    verification_status: string;
    payment_status: string;
  }[] = winData ?? [];

  let drawMonths: { id: string; draw_month: string }[] = [];
  if (winRows.length > 0) {
    const { data } = await supabase
      .from("draws")
      .select("id, draw_month")
      .in("id", winRows.map((w) => w.draw_id));
    drawMonths = data ?? [];
  }
  const monthLabel = (drawId: string) => {
    const m = drawMonths.find((d) => d.id === drawId)?.draw_month;
    if (!m) return "Draw";
    const [y, mo] = m.split("-");
    return `${MONTHS[Number(mo) - 1]} ${y}`;
  };
  const wins: WinRow[] = winRows.map((w) => ({
    id: w.id,
    match_type: w.match_type,
    prize_amount: Number(w.prize_amount),
    proof_url: w.proof_url,
    verification_status: w.verification_status,
    payment_status: w.payment_status,
    month: monthLabel(w.draw_id),
  }));

  const now = new Date();
  const nextDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
  const summary = {
    drawsEntered: drawsEntered ?? 0,
    nextDraw: `${MONTHS[nextDate.getUTCMonth()]} ${nextDate.getUTCFullYear()}`,
    totalWon: wins.reduce((sum, w) => sum + w.prize_amount, 0),
    totalPaid: wins.filter((w) => w.payment_status === "paid").reduce((sum, w) => sum + w.prize_amount, 0),
  };

  return (
    <main className="min-h-screen bg-[#0a0a14] p-6 text-white">
      <div className="mx-auto max-w-2xl space-y-4">
        <h1 className="text-3xl font-bold">Hi, {profile?.full_name ?? user.email} 👋</h1>

        {subscribed && (
          <p className="rounded-lg bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
            Payment successful. Welcome aboard, your subscription is active!
          </p>
        )}
        {subscribe && !isActive && (
          <p className="rounded-lg bg-amber-500/10 px-4 py-3 text-sm text-amber-300">
            That feature is for subscribers only. Subscribe to unlock it.
          </p>
        )}

        <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm space-y-1">
          <p>Email: {user.email}</p>
          <p>Role: {profile?.role}</p>
          <p>
            Subscription: <b>{sub?.status ?? "inactive"}</b>
            {sub?.plan && ` (${sub.plan})`}
          </p>
          {sub?.renewal_date && (
            <p>Renews on: {new Date(sub.renewal_date).toLocaleDateString("en-IN")}</p>
          )}
          <p>
            Charity: {profile?.charities?.name ?? "-"} ({profile?.charity_percent}%)
          </p>
        </div>

        {isActive ? (
          <ScoresPanel scores={scores} />
        ) : (
          <div className="rounded-xl border border-white/10 bg-white/5 p-5 text-sm text-white/70">
            Score entry and monthly draws are for active subscribers.
          </div>
        )}

        <WinningsPanel userId={user.id} summary={summary} wins={wins} />

        <div className="flex flex-wrap gap-3">
          {!isActive && (
            <Link href="/subscribe" className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-black hover:bg-emerald-400">
              Subscribe now
            </Link>
          )}
          {profile?.role === "admin" && (
            <Link href="/admin" className="rounded-lg bg-white/10 px-4 py-2 text-sm hover:bg-white/20">
              Admin panel
            </Link>
          )}
          <form action="/auth/signout" method="post">
            <button className="rounded-lg bg-red-500/80 px-4 py-2 text-sm hover:bg-red-500">Log out</button>
          </form>
        </div>
      </div>
    </main>
  );
}