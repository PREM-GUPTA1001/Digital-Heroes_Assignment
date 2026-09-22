import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

type CharityEvent = {
  id: string;
  title: string;
  description: string | null;
  event_date: string | null;
  location: string | null;
};

function formatDate(iso: string) {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const [y, m, d] = iso.split("-");
  return `${Number(d)} ${months[Number(m) - 1]} ${y}`;
}

export default async function CharityPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: charity } = await supabase
    .from("charities")
    .select("id, name, description, image_url, is_featured")
    .eq("id", id)
    .eq("is_active", true)
    .maybeSingle();
  if (!charity) notFound();

  const { data: eventRows } = await supabase
    .from("charity_events")
    .select("id, title, description, event_date, location")
    .eq("charity_id", id)
    .order("event_date", { ascending: true });

  const today = new Date().toISOString().slice(0, 10);
  const events: CharityEvent[] = (eventRows ?? []).filter(
    (e: CharityEvent) => !e.event_date || e.event_date >= today
  );

  return (
    <main className="min-h-screen bg-[#0a0a14] px-4 py-10 text-white">
      <div className="mx-auto max-w-3xl">
        <Link href="/charities" className="text-sm text-white/50 hover:text-white">
          ← All charities
        </Link>

        {charity.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={charity.image_url} alt={charity.name} className="mt-4 h-64 w-full rounded-2xl object-cover" />
        ) : (
          <div className="mt-4 flex h-64 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500/30 to-indigo-500/30 text-8xl font-bold text-white/70">
            {charity.name.charAt(0)}
          </div>
        )}

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <h1 className="text-4xl font-bold">{charity.name}</h1>
          {charity.is_featured && (
            <span className="rounded-full bg-emerald-400/15 px-3 py-1 text-sm text-emerald-300">Featured</span>
          )}
        </div>
        <p className="mt-4 whitespace-pre-line text-lg text-white/70">{charity.description}</p>

        <Link
          href="/signup"
          className="mt-6 inline-block rounded-lg bg-emerald-500 px-5 py-3 font-semibold text-black hover:bg-emerald-400"
        >
          Subscribe and support {charity.name}
        </Link>

        <h2 className="mt-12 text-2xl font-semibold">Upcoming events</h2>
        {events.length === 0 ? (
          <p className="mt-3 text-white/50">No upcoming events listed yet.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {events.map((e) => (
              <li key={e.id} className="rounded-xl border border-white/10 bg-white/5 p-4">
                <p className="font-semibold">{e.title}</p>
                <p className="mt-1 text-sm text-emerald-300">
                  {e.event_date ? formatDate(e.event_date) : "Date to be announced"}
                  {e.location && <span className="text-white/50"> · {e.location}</span>}
                </p>
                {e.description && <p className="mt-2 text-sm text-white/60">{e.description}</p>}
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}