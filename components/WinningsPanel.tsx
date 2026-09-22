"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { saveProof } from "@/app/dashboard/winnings/actions";

export type WinRow = {
  id: string;
  match_type: number;
  prize_amount: number;
  proof_url: string | null;
  verification_status: string;
  payment_status: string;
  month: string;
};

export type Summary = {
  drawsEntered: number;
  nextDraw: string;
  totalWon: number;
  totalPaid: number;
};

const usd = (n: number) => `$${Number(n).toFixed(2)}`;
const MAX_MB = 5;

function Chip({ text, tone }: { text: string; tone: "green" | "amber" | "red" | "grey" }) {
  const tones = {
    green: "bg-emerald-400/15 text-emerald-300",
    amber: "bg-amber-400/15 text-amber-300",
    red: "bg-red-400/15 text-red-300",
    grey: "bg-white/10 text-white/60",
  };
  return <span className={`rounded-full px-2.5 py-0.5 text-xs ${tones[tone]}`}>{text}</span>;
}

function WinItem({ win, userId }: { win: WinRow; userId: string }) {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ type: "error" | "ok"; text: string } | null>(null);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) return setMsg({ type: "error", text: "Please choose an image (screenshot)." });
    if (file.size > MAX_MB * 1024 * 1024) return setMsg({ type: "error", text: `Image must be under ${MAX_MB} MB.` });

    setBusy(true);
    setMsg(null);
    const supabase = createClient();
    const ext = (file.name.split(".").pop() ?? "png").toLowerCase();
    const path = `${userId}/${win.id}-${Date.now()}.${ext}`;

    const { error } = await supabase.storage.from("proofs").upload(path, file, { contentType: file.type });
    if (error) {
      setBusy(false);
      return setMsg({ type: "error", text: "Upload failed. Please try again." });
    }
    const result = await saveProof(win.id, path);
    setBusy(false);
    setMsg(result.error ? { type: "error", text: result.error } : { type: "ok", text: result.success ?? "Uploaded." });
  }

  const canUpload = win.verification_status !== "approved";
  const hasProof = Boolean(win.proof_url);

  let verification: { text: string; tone: "green" | "amber" | "red" | "grey" };
  if (win.verification_status === "approved") verification = { text: "Approved", tone: "green" };
  else if (win.verification_status === "rejected") verification = { text: "Rejected, upload again", tone: "red" };
  else if (hasProof) verification = { text: "Under review", tone: "amber" };
  else verification = { text: "Proof needed", tone: "grey" };

  return (
    <li className="rounded-lg border border-white/10 bg-black/20 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="font-semibold">
            {win.month}: {win.match_type} numbers matched
          </p>
          <p className="text-2xl font-bold text-emerald-400">{usd(win.prize_amount)}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Chip text={verification.text} tone={verification.tone} />
          <Chip
            text={win.payment_status === "paid" ? "Paid" : "Payment pending"}
            tone={win.payment_status === "paid" ? "green" : "grey"}
          />
        </div>
      </div>

      {canUpload && (
        <div className="mt-3">
          <label className="text-sm text-white/60">
            {hasProof ? "Replace your proof:" : "Upload a screenshot of your scores from your golf platform:"}
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={onFile}
            disabled={busy}
            className="mt-1 block w-full text-sm text-white/70 file:mr-3 file:rounded-lg file:border-0 file:bg-emerald-500 file:px-3 file:py-1.5 file:font-semibold file:text-black hover:file:bg-emerald-400"
          />
          {busy && <p className="mt-2 text-sm text-white/60">Uploading...</p>}
        </div>
      )}
      {msg && (
        <p className={`mt-2 text-sm ${msg.type === "error" ? "text-red-300" : "text-emerald-300"}`}>{msg.text}</p>
      )}
    </li>
  );
}

export default function WinningsPanel({
  userId,
  summary,
  wins,
}: {
  userId: string;
  summary: Summary;
  wins: WinRow[];
}) {
  return (
    <section className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <h2 className="text-lg font-semibold">Participation</h2>
          <p className="mt-2 text-sm text-white/70">
            Draws entered: <b className="text-white">{summary.drawsEntered}</b>
          </p>
          <p className="text-sm text-white/70">
            Next draw: <b className="text-white">{summary.nextDraw}</b>
          </p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <h2 className="text-lg font-semibold">Winnings</h2>
          <p className="mt-2 text-sm text-white/70">
            Total won: <b className="text-emerald-400">{usd(summary.totalWon)}</b>
          </p>
          <p className="text-sm text-white/70">
            Paid out: <b className="text-white">{usd(summary.totalPaid)}</b>
            {summary.totalWon - summary.totalPaid > 0 && (
              <span className="text-white/50"> ({usd(summary.totalWon - summary.totalPaid)} pending)</span>
            )}
          </p>
        </div>
      </div>

      {wins.length > 0 && (
        <div className="rounded-xl border border-emerald-400/30 bg-emerald-400/5 p-4">
          <h2 className="text-lg font-semibold">Your wins 🎉</h2>
          <p className="mt-1 text-sm text-white/50">
            Upload proof for each win. Once an admin approves it, your payout is marked as paid.
          </p>
          <ul className="mt-3 space-y-3">
            {wins.map((w) => (
              <WinItem key={w.id} win={w} userId={userId} />
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}