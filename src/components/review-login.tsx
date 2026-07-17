"use client";

import { KeyRound, LoaderCircle, ShieldCheck } from "lucide-react";
import { FormEvent, useState } from "react";

export function ReviewLogin() {
  const [key, setKey] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/review/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ key }),
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(result.error ?? "Could not sign in");
      window.location.reload();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not sign in");
      setLoading(false);
    }
  };

  return (
    <main className="mx-auto grid w-full max-w-xl flex-1 place-items-center px-4 py-16 sm:px-6">
      <form
        className="w-full rounded-[28px] border border-stone-200 bg-white p-7 shadow-[0_18px_60px_rgba(31,45,39,0.08)] sm:p-10"
        onSubmit={submit}
      >
        <span className="grid size-12 place-items-center rounded-2xl bg-[#edf4ef] text-emerald-900">
          <ShieldCheck aria-hidden="true" className="size-6" />
        </span>
        <p className="mt-5 text-xs font-extrabold uppercase tracking-[0.14em] text-emerald-800">
          Private moderation
        </p>
        <h1 className="mt-2 text-4xl font-black tracking-[-0.05em] text-stone-950">
          Review queue
        </h1>
        <p className="mt-3 text-sm leading-7 text-stone-600">
          New listings remain hidden until you check the acreage, boundary evidence and setting tags.
        </p>

        <label className="mt-7 block" htmlFor="review-key">
          <span className="filter-label">Review key</span>
          <span className="relative mt-2 block">
            <KeyRound
              aria-hidden="true"
              className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-stone-500"
            />
            <input
              autoComplete="current-password"
              autoFocus
              className="filter-input pl-10"
              id="review-key"
              onChange={(event) => setKey(event.target.value)}
              type="password"
              value={key}
            />
          </span>
        </label>

        {error ? (
          <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm font-semibold text-red-800">
            {error}
          </p>
        ) : null}

        <button
          className="mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#173f35] px-4 text-sm font-extrabold text-white disabled:cursor-not-allowed disabled:opacity-60"
          disabled={loading || !key.trim()}
          type="submit"
        >
          {loading ? (
            <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
          ) : null}
          Open review queue
        </button>
      </form>
    </main>
  );
}
