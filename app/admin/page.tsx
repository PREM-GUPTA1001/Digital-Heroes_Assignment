import Link from "next/link";
import { requireAdmin } from "@/lib/auth";

const SECTIONS = [
  { href: "/admin/draws", title: "Draws", desc: "Configure, simulate and publish monthly draws." },
  { href: "/admin/winners", title: "Winners", desc: "Verify proof and mark payouts as paid." },
];

export default async function AdminPage() {
  const { profile } = await requireAdmin();
  return (
    <main className="min-h-screen bg-[#0a0a14] p-6 text-white">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-3xl font-bold">Admin panel</h1>
        <p className="mt-2 text-white/60">Welcome, {profile?.full_name}.</p>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {SECTIONS.map((s) => (
            <Link key={s.href} href={s.href} className="rounded-xl border border-white/10 bg-white/5 p-5 hover:border-emerald-400/50">
              <h2 className="text-lg font-semibold">{s.title}</h2>
              <p className="mt-1 text-sm text-white/60">{s.desc}</p>
            </Link>
          ))}
        </div>

        <div className="mt-8 flex gap-3">
          <Link href="/dashboard" className="rounded-lg bg-white/10 px-4 py-2 text-sm hover:bg-white/20">
            My dashboard
          </Link>
          <form action="/auth/signout" method="post">
            <button className="rounded-lg bg-red-500/80 px-4 py-2 text-sm hover:bg-red-500">Log out</button>
          </form>
        </div>
      </div>
    </main>
  );
}