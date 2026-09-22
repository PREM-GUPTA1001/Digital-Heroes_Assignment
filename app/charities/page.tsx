import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function CharitiesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; featured?: string }>;
}) {
  const { q, featured } = await searchParams;
  const supabase = await createClient();

  const term = (q ?? "").replace(/[,()%*\\]/g, " ").trim();

  let query = supabase
    .from("charities")
    .select("id, name, description, image_url, is_featured")
    .eq("is_active", true);
  if (term) query = query.or(`name.ilike.%${term}%,description.ilike.%${term}%`);
  if (featured === "1") query = query.eq("is_featured", true);

  const { data } = await query.order("is_featured", { ascending: false }).order("name");
  const charities = data ?? [];

  return (
    <main className="min-h-screen bg-[#0a0a14] px-4 py-10 text-white">
      <div className="mx-auto max-w-5xl">
        <Link href="/" className="text-sm text-white/50 hover:text-white">
          ← Home
        </Link>
        <h1 className="mt-4 text-4xl font-bold">Causes you can back</h1>
        <p className="mt-2 max-w-xl text-white/60">
          Every subscriber directs part of their fee to a charity they choose. Pick the one that matters to you.
        </p>

        <form method="get" className="mt-6 flex flex-wrap items-center gap-3">
          <input
            name="q"
            defaultValue={q ?? ""}
            placeholder="Search charities..."
            className="w-full max-w-sm rounded-lg border border-white/10 bg-black/30 px-3 py-2 outline-none focus:border-emerald-400"
          />
          <label className="flex items-center gap-2 text-sm text-white/70">
            <input type="checkbox" name="featured" value="1" defaultChecked={featured === "1"} className="accent-emerald-400" />
            Featured only
          </label>
          <button className="rounded-lg bg-emerald-500 px-4 py-2 font-semibold text-black hover:bg-emerald-400">
            Search
          </button>
          {(term || featured === "1") && (
            <Link href="/charities" className="text-sm text-white/50 hover:text-white">
              Clear
            </Link>
          )}
        </form>

        {charities.length === 0 ? (
          <p className="mt-10 text-white/50">No charities match your search.</p>
        ) : (
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {charities.map((c) => (
              <Link
                key={c.id}
                href={`/charities/${c.id}`}
                className="group overflow-hidden rounded-2xl border border-white/10 bg-white/5 transition hover:border-emerald-400/50"
              >
                {c.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={c.image_url} alt={c.name} className="h-40 w-full object-cover" />
                ) : (
                  <div className="flex h-40 items-center justify-center bg-gradient-to-br from-emerald-500/30 to-indigo-500/30 text-5xl font-bold text-white/70">
                    {c.name.charAt(0)}
                  </div>
                )}
                <div className="p-5">
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-semibold group-hover:text-emerald-400">{c.name}</h2>
                    {c.is_featured && (
                      <span className="rounded-full bg-emerald-400/15 px-2 py-0.5 text-xs text-emerald-300">Featured</span>
                    )}
                  </div>
                  <p className="mt-2 line-clamp-3 text-sm text-white/60">{c.description}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}