import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { loadDrawContext, getRolloverInCents } from "@/lib/draw-data";
import { computeDraw } from "@/lib/draw-engine";
import { simulateDraw, publishDraw, seedDemoUsers, removeDemoUsers } from "./actions";

type DrawRow = {
  id: string;
  draw_month: string;
  mode: string;
  status: string;
  winning_numbers: number[] | null;
  active_subscribers: number | null;
  pool_total: number | null;
  rollover_in: number | null;
  jackpot_rolled_out: number | null;
};

const money = (cents: number) => `$${(cents / 100).toFixed(2)}`;
const monthLabel = (d: string) => {
  const names = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const [y, m] = d.split("-");
  return `${names[Number(m) - 1]} ${y}`;
};

const ERRORS: Record<string, string> = {
  month: "Please choose a month.",
  published: "That month's draw is already published and can't be changed.",
  publish: "Could not publish that draw. Run the simulation again.",
};

function Balls({ numbers }: { numbers: number[] }) {
  return (
    <div className="flex gap-2">
      {numbers.map((n) => (
        <span
          key={n}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500 font-bold text-black"
        >
          {n}
        </span>
      ))}
    </div>
  );
}

export default async function AdminDrawsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  await requireAdmin();
  const admin = createAdminClient();

  const { data } = await admin.from("draws").select("*").order("draw_month", { ascending: false });
  const draws: DrawRow[] = data ?? [];
  const simulated = draws.filter((d) => d.status !== "published");
  const published = draws.filter((d) => d.status === "published");

  const ctx = simulated.length > 0 ? await loadDrawContext() : null;
  const previews = ctx
    ? await Promise.all(
        simulated.map(async (d) => {
          const rollover = await getRolloverInCents(admin, d.draw_month);
          return {
            draw: d,
            rollover,
            calc: computeDraw(ctx.entries, d.winning_numbers ?? [], ctx.poolTotalCents, rollover),
          };
        })
      )
    : [];

  const { data: winnerRows } = await admin.from("winners").select("draw_id, match_type");
  const winnerCounts = new Map<string, Record<number, number>>();
  for (const w of (winnerRows ?? []) as { draw_id: string; match_type: number }[]) {
    const rec = winnerCounts.get(w.draw_id) ?? {};
    rec[w.match_type] = (rec[w.match_type] ?? 0) + 1;
    winnerCounts.set(w.draw_id, rec);
  }

  const thisMonth = new Date().toISOString().slice(0, 7);
  const inputCls =
    "rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-white outline-none focus:border-emerald-400";

  return (
    <main className="min-h-screen bg-[#0a0a14] px-4 py-10 text-white">
      <div className="mx-auto max-w-4xl space-y-8">
        <Link href="/admin" className="text-sm text-white/50 hover:text-white">
          ← Admin
        </Link>
        <h1 className="text-3xl font-bold">Draw management</h1>

        {error && (
          <p className="rounded-lg bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {ERRORS[error] ?? "Something went wrong."}
          </p>
        )}

        <section className="rounded-xl border border-white/10 bg-white/5 p-5">
          <h2 className="text-lg font-semibold">1. Configure and simulate</h2>
          <p className="mt-1 text-sm text-white/50">
            A simulation picks the numbers and shows the results. Nothing is visible to players until you publish.
          </p>
          <form action={simulateDraw} className="mt-4 flex flex-wrap items-end gap-3">
            <div>
              <label className="mb-1 block text-xs text-white/60">Draw month</label>
              <input type="month" name="month" defaultValue={thisMonth} className={inputCls} required />
            </div>
            <div>
              <label className="mb-1 block text-xs text-white/60">Draw logic</label>
              <select name="mode" className={inputCls}>
                <option value="random" className="text-black">Random (lottery style)</option>
                <option value="algorithm" className="text-black">Algorithmic (weighted by score frequency)</option>
              </select>
            </div>
            <button className="rounded-lg bg-emerald-500 px-5 py-2 font-semibold text-black hover:bg-emerald-400">
              Run simulation
            </button>
          </form>
        </section>

        {previews.map(({ draw, rollover, calc }) => (
          <section key={draw.id} className="rounded-xl border border-amber-400/40 bg-amber-400/5 p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg font-semibold">
                2. Preview: {monthLabel(draw.draw_month)}{" "}
                <span className="ml-2 rounded-full bg-amber-400/20 px-2 py-0.5 text-xs text-amber-300">
                  simulation, not published
                </span>
              </h2>
              <span className="text-sm text-white/50">Mode: {draw.mode}</span>
            </div>

            <div className="mt-4">
              <Balls numbers={draw.winning_numbers ?? []} />
            </div>

            <div className="mt-4 grid gap-2 text-sm text-white/70 sm:grid-cols-2">
              <p>Active subscribers: <b>{ctx?.activeCount}</b></p>
              <p>Entered (have 5 scores): <b>{ctx?.entries.length}</b></p>
              <p>Prize pool this month: <b>{money(ctx?.poolTotalCents ?? 0)}</b></p>
              <p>Jackpot carried in: <b>{money(rollover)}</b></p>
            </div>

            <table className="mt-4 w-full text-left text-sm">
              <thead className="text-white/50">
                <tr>
                  <th className="py-1">Match</th>
                  <th>Winners</th>
                  <th>Tier pool</th>
                  <th>Each wins</th>
                </tr>
              </thead>
              <tbody>
                {calc.tiers.map((t) => (
                  <tr key={t.match} className="border-t border-white/10">
                    <td className="py-2">{t.match} numbers{t.match === 5 && " (jackpot)"}</td>
                    <td>{t.winners}</td>
                    <td>{money(t.poolCents)}</td>
                    <td>{t.winners > 0 ? money(t.eachCents) : "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <p className="mt-3 text-sm text-white/60">
              {calc.jackpotRolledOutCents > 0
                ? `No 5-match winner: ${money(calc.jackpotRolledOutCents)} rolls over to next month's jackpot.`
                : "Jackpot is won this month, nothing rolls over."}
            </p>

            <form action={publishDraw} className="mt-4">
              <input type="hidden" name="id" value={draw.id} />
              <button className="rounded-lg bg-amber-400 px-5 py-2 font-semibold text-black hover:bg-amber-300">
                Publish results
              </button>
              <span className="ml-3 text-xs text-white/40">Locks entries and creates winners. Cannot be undone.</span>
            </form>
          </section>
        ))}

        <section className="rounded-xl border border-white/10 bg-white/5 p-5">
          <h2 className="text-lg font-semibold">Published draws</h2>
          {published.length === 0 ? (
            <p className="mt-2 text-sm text-white/40">Nothing published yet.</p>
          ) : (
            <table className="mt-3 w-full text-left text-sm">
              <thead className="text-white/50">
                <tr>
                  <th className="py-1">Month</th>
                  <th>Numbers</th>
                  <th>Pool</th>
                  <th>Winners 5 / 4 / 3</th>
                  <th>Rolled over</th>
                </tr>
              </thead>
              <tbody>
                {published.map((d) => {
                  const c = winnerCounts.get(d.id) ?? {};
                  return (
                    <tr key={d.id} className="border-t border-white/10">
                      <td className="py-2">{monthLabel(d.draw_month)}</td>
                      <td>{(d.winning_numbers ?? []).join(", ")}</td>
                      <td>${Number(d.pool_total ?? 0).toFixed(2)}</td>
                      <td>{c[5] ?? 0} / {c[4] ?? 0} / {c[3] ?? 0}</td>
                      <td>${Number(d.jackpot_rolled_out ?? 0).toFixed(2)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </section>

        <section className="rounded-xl border border-white/10 bg-white/5 p-5">
          <h2 className="text-lg font-semibold">Testing tools</h2>
          <p className="mt-1 text-sm text-white/50">
            Creates 20 demo subscribers (demo1 to demo20 @demo-heroes.dev, password Demo@12345) with 5 scores each.
            Remove them before submitting.
          </p>
          <div className="mt-3 flex gap-3">
            <form action={seedDemoUsers}>
              <button className="rounded-lg bg-white/10 px-4 py-2 text-sm hover:bg-white/20">Create demo players</button>
            </form>
            <form action={removeDemoUsers}>
              <button className="rounded-lg bg-red-500/70 px-4 py-2 text-sm hover:bg-red-500">Remove demo players</button>
            </form>
          </div>
        </section>
      </div>
    </main>
  );
}