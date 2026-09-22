"use client";

import { useActionState, useRef, useState } from "react";
import { addScore, updateScore, deleteScore, type ActionState } from "@/app/dashboard/scores/actions";

export type ScoreRow = { id: string; score: number; played_on: string };

const initial: ActionState = {};
const inputCls =
  "rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-white outline-none focus:border-emerald-400";

function formatDate(iso: string) {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const [y, m, d] = iso.split("-");
  return `${Number(d)} ${months[Number(m) - 1]} ${y}`;
}

function ScoreItem({ row }: { row: ScoreRow }) {
  const [editing, setEditing] = useState(false);
  const [state, action, pending] = useActionState(async (prev: ActionState, formData: FormData) => {
    const result = await updateScore(prev, formData);
    if (result.success) setEditing(false);
    return result;
  }, initial);

  if (editing) {
    return (
      <li className="rounded-lg border border-emerald-400/40 bg-white/5 p-3">
        <form action={action} className="flex flex-wrap items-center gap-2">
          <input type="hidden" name="id" value={row.id} />
          <input type="number" name="score" min={1} max={45} defaultValue={row.score} className={`${inputCls} w-24`} required />
          <input type="date" name="played_on" defaultValue={row.played_on} className={inputCls} required />
          <button disabled={pending} className="rounded-lg bg-emerald-500 px-3 py-2 text-sm font-semibold text-black hover:bg-emerald-400 disabled:opacity-50">
            {pending ? "Saving..." : "Save"}
          </button>
          <button type="button" onClick={() => setEditing(false)} className="rounded-lg bg-white/10 px-3 py-2 text-sm hover:bg-white/20">
            Cancel
          </button>
        </form>
        {state.error && <p className="mt-2 text-sm text-red-300">{state.error}</p>}
      </li>
    );
  }

  return (
    <li className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-4 py-3">
      <div>
        <span className="text-2xl font-bold text-emerald-400">{row.score}</span>
        <span className="ml-3 text-sm text-white/60">{formatDate(row.played_on)}</span>
      </div>
      <div className="flex gap-2">
        <button onClick={() => setEditing(true)} className="rounded-lg bg-white/10 px-3 py-1.5 text-sm hover:bg-white/20">
          Edit
        </button>
        <form action={deleteScore}>
          <input type="hidden" name="id" value={row.id} />
          <button className="rounded-lg bg-red-500/70 px-3 py-1.5 text-sm hover:bg-red-500">Delete</button>
        </form>
      </div>
    </li>
  );
}

export default function ScoresPanel({ scores }: { scores: ScoreRow[] }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, action, pending] = useActionState(async (prev: ActionState, formData: FormData) => {
    const result = await addScore(prev, formData);
    if (result.success) formRef.current?.reset();
    return result;
  }, initial);

  return (
    <section className="rounded-xl border border-white/10 bg-white/5 p-5">
      <div className="flex items-baseline justify-between">
        <h2 className="text-xl font-semibold">Your golf scores</h2>
        <span className="text-sm text-white/50">{scores.length} of 5 entered</span>
      </div>
      <p className="mt-1 text-sm text-white/50">
        Stableford, 1 to 45. We keep your latest 5. Adding a new one replaces the oldest.
      </p>

      <form ref={formRef} action={action} className="mt-4 flex flex-wrap items-end gap-3">
        <div>
          <label className="mb-1 block text-xs text-white/60">Score</label>
          <input type="number" name="score" min={1} max={45} placeholder="1-45" className={`${inputCls} w-24`} required />
        </div>
        <div>
          <label className="mb-1 block text-xs text-white/60">Date played</label>
          <input type="date" name="played_on" className={inputCls} required />
        </div>
        <button disabled={pending} className="rounded-lg bg-emerald-500 px-4 py-2 font-semibold text-black hover:bg-emerald-400 disabled:opacity-50">
          {pending ? "Adding..." : "Add score"}
        </button>
      </form>

      {state.error && <p className="mt-3 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-300">{state.error}</p>}
      {state.success && <p className="mt-3 rounded-lg bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300">{state.success}</p>}

      <ul className="mt-5 space-y-2">
        {scores.length === 0 && <li className="text-sm text-white/40">No scores yet. Add your first one above.</li>}
        {scores.map((row) => (
          <ScoreItem key={row.id} row={row} />
        ))}
      </ul>
    </section>
  );
}