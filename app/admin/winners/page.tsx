import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { reviewWinner, markPaid } from "./actions";

type WinnerRow = {
  id: string;
  draw_id: string;
  user_id: string;
  match_type: number;
  prize_amount: number;
  proof_url: string | null;
  verification_status: string;
  payment_status: string;
};

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export default async function AdminWinnersPage() {
  await requireAdmin();
  const admin = createAdminClient();

  const { data } = await admin.from("winners").select("*").order("created_at", { ascending: false });
  const winners: WinnerRow[] = data ?? [];

  const userIds = [...new Set(winners.map((w) => w.user_id))];
  const drawIds = [...new Set(winners.map((w) => w.draw_id))];

  let people: { id: string; full_name: string | null; email: string | null }[] = [];
  let drawMonths: { id: string; draw_month: string }[] = [];
  if (winners.length > 0) {
    const p = await admin.from("profiles").select("id, full_name, email").in("id", userIds);
    people = p.data ?? [];
    const d = await admin.from("draws").select("id, draw_month").in("id", drawIds);
    drawMonths = d.data ?? [];
  }

  const paths = winners.map((w) => w.proof_url).filter((p): p is string => Boolean(p));
  const signed = new Map<string, string>();
  if (paths.length > 0) {
    const { data: urls } = await admin.storage.from("proofs").createSignedUrls(paths, 3600);
    for (const u of urls ?? []) {
      if (u.path && u.signedUrl) signed.set(u.path, u.signedUrl);
    }
  }

  const monthOf = (id: string) => {
    const m = drawMonths.find((d) => d.id === id)?.draw_month;
    if (!m) return "-";
    const [y, mo] = m.split("-");
    return `${MONTHS[Number(mo) - 1]} ${y}`;
  };

  const pendingReview = winners.filter((w) => w.proof_url && w.verification_status === "pending").length;

  return (
    <main className="min-h-screen bg-[#0a0a14] px-4 py-10 text-white">
      <div className="mx-auto max-w-4xl space-y-6">
        <Link href="/admin" className="text-sm text-white/50 hover:text-white">
          ← Admin
        </Link>
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h1 className="text-3xl font-bold">Winners</h1>
          <p className="text-sm text-white/50">
            {winners.length} total, {pendingReview} waiting for review
          </p>
        </div>

        {winners.length === 0 && <p className="text-white/50">No winners yet. Publish a draw first.</p>}

        <ul className="space-y-3">
          {winners.map((w) => {
            const person = people.find((p) => p.id === w.user_id);
            const link = w.proof_url ? signed.get(w.proof_url) : undefined;
            const paid = w.payment_status === "paid";
            return (
              <li key={w.id} className="rounded-xl border border-white/10 bg-white/5 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">{person?.full_name ?? "Unknown player"}</p>
                    <p className="text-sm text-white/50">{person?.email}</p>
                    <p className="mt-1 text-sm text-white/70">
                      {monthOf(w.draw_id)} · {w.match_type} numbers matched
                    </p>
                  </div>
                  <p className="text-2xl font-bold text-emerald-400">${Number(w.prize_amount).toFixed(2)}</p>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
                  <span className="rounded-full bg-white/10 px-2.5 py-0.5">
                    Verification: <b>{w.proof_url ? w.verification_status : "no proof yet"}</b>
                  </span>
                  <span className={`rounded-full px-2.5 py-0.5 ${paid ? "bg-emerald-400/15 text-emerald-300" : "bg-white/10"}`}>
                    Payment: <b>{w.payment_status}</b>
                  </span>
                  {link && (
                    <a href={link} target="_blank" rel="noreferrer" className="text-emerald-400 underline">
                      View proof
                    </a>
                  )}
                </div>

                {!paid && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {w.proof_url && w.verification_status !== "approved" && (
                      <form action={reviewWinner}>
                        <input type="hidden" name="id" value={w.id} />
                        <input type="hidden" name="decision" value="approved" />
                        <button className="rounded-lg bg-emerald-500 px-4 py-1.5 text-sm font-semibold text-black hover:bg-emerald-400">
                          Approve
                        </button>
                      </form>
                    )}
                    {w.proof_url && w.verification_status !== "rejected" && (
                      <form action={reviewWinner}>
                        <input type="hidden" name="id" value={w.id} />
                        <input type="hidden" name="decision" value="rejected" />
                        <button className="rounded-lg bg-red-500/80 px-4 py-1.5 text-sm hover:bg-red-500">Reject</button>
                      </form>
                    )}
                    {w.verification_status === "approved" && (
                      <form action={markPaid}>
                        <input type="hidden" name="id" value={w.id} />
                        <button className="rounded-lg bg-amber-400 px-4 py-1.5 text-sm font-semibold text-black hover:bg-amber-300">
                          Mark as paid
                        </button>
                      </form>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </main>
  );
}