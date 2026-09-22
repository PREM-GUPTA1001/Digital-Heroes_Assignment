"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Charity = { id: string; name: string };

const inputCls =
  "w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-white outline-none focus:border-emerald-400";

export default function SignupForm({ charities }: { charities: Charity[] }) {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [charityId, setCharityId] = useState(charities[0]?.id ?? "");
  const [percent, setPercent] = useState(10);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);

    if (password.length < 8) return setError("Password must be at least 8 characters.");
    if (!charityId) return setError("Please choose a charity.");
    if (percent < 10) return setError("Minimum charity contribution is 10%.");

    setLoading(true);
    const supabase = createClient();

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, charity_id: charityId, charity_percent: percent },
      },
    });
    setLoading(false);

    if (error) return setError(error.message);

    if (data.session) {
      router.push("/dashboard");
      router.refresh();
    } else {
      setInfo("Account created! Check your email to confirm, then log in.");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="mb-1 block text-sm text-white/70">Full name</label>
        <input className={inputCls} value={fullName} onChange={(e) => setFullName(e.target.value)} required />
      </div>
      <div>
        <label className="mb-1 block text-sm text-white/70">Email</label>
        <input type="email" className={inputCls} value={email} onChange={(e) => setEmail(e.target.value)} required />
      </div>
      <div>
        <label className="mb-1 block text-sm text-white/70">Password</label>
        <input type="password" className={inputCls} value={password} onChange={(e) => setPassword(e.target.value)} required />
      </div>
      <div>
        <label className="mb-1 block text-sm text-white/70">Charity you want to support</label>
        <select className={inputCls} value={charityId} onChange={(e) => setCharityId(e.target.value)} required>
          {charities.map((c) => (
            <option key={c.id} value={c.id} className="text-black">
              {c.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="mb-1 block text-sm text-white/70">
          Share of your subscription to donate: <span className="font-semibold text-emerald-400">{percent}%</span>
        </label>
        <input
          type="range"
          min={10}
          max={100}
          step={5}
          value={percent}
          onChange={(e) => setPercent(Number(e.target.value))}
          className="w-full accent-emerald-400"
        />
        <p className="mt-1 text-xs text-white/40">Minimum 10%. You can change this later.</p>
      </div>

      {error && <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</p>}
      {info && <p className="rounded-lg bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300">{info}</p>}

      <button
        disabled={loading}
        className="w-full rounded-lg bg-emerald-500 py-2.5 font-semibold text-black transition hover:bg-emerald-400 disabled:opacity-50"
      >
        {loading ? "Creating account..." : "Create account"}
      </button>
    </form>
  );
}