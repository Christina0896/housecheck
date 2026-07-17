import Link from "next/link";
import { KeyRound, ShieldAlert } from "lucide-react";
import { ReviewLogin } from "@/components/review-login";
import { ReviewQueue } from "@/components/review-queue";
import {
  isReviewAuthorized,
  isReviewConfigured,
} from "@/lib/review-auth";
import { getReviewCounts, getReviewProperties } from "@/lib/review-data";
import { hasDatabaseConfig } from "@/lib/supabase-server";
import type { ReviewStatus } from "@/lib/types";

export const dynamic = "force-dynamic";

const allowedStatuses = new Set<ReviewStatus>([
  "pending",
  "approved",
  "rejected",
]);

export default async function ReviewPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  if (!hasDatabaseConfig()) {
    return (
      <SetupMessage
        detail="Add the Supabase project URL and server secret to .env.local before using the review queue."
        title="Database not configured"
      />
    );
  }

  if (!isReviewConfigured()) {
    return (
      <SetupMessage
        detail="Add REVIEW_ADMIN_KEY or INGEST_API_KEY to .env.local, restart npm run dev, then return to this page."
        title="Review key not configured"
      />
    );
  }

  if (!(await isReviewAuthorized())) {
    return <ReviewLogin />;
  }

  const { status: rawStatus } = await searchParams;
  const status = allowedStatuses.has(rawStatus as ReviewStatus)
    ? (rawStatus as ReviewStatus)
    : "pending";
  const [properties, counts] = await Promise.all([
    getReviewProperties(status),
    getReviewCounts(),
  ]);

  return (
    <ReviewQueue
      counts={counts}
      initialProperties={properties}
      status={status}
    />
  );
}

function SetupMessage({ title, detail }: { title: string; detail: string }) {
  return (
    <main className="mx-auto grid w-full max-w-3xl flex-1 place-items-center px-4 py-16 sm:px-6">
      <section className="w-full rounded-[28px] border border-amber-200 bg-white p-7 shadow-[0_18px_60px_rgba(31,45,39,0.08)] sm:p-10">
        <span className="grid size-12 place-items-center rounded-2xl bg-amber-50 text-amber-900">
          <ShieldAlert aria-hidden="true" className="size-6" />
        </span>
        <h1 className="mt-5 text-3xl font-black tracking-[-0.04em] text-stone-950">
          {title}
        </h1>
        <p className="mt-3 text-sm leading-7 text-stone-600">{detail}</p>
        <div className="mt-6 rounded-2xl bg-stone-950 p-4 font-mono text-sm text-stone-100">
          <code className="block">REVIEW_ADMIN_KEY=choose-a-long-private-password</code>
          <span className="mt-2 block text-xs text-stone-400">
            Or enter the existing INGEST_API_KEY on the login screen.
          </span>
        </div>
        <p className="mt-4 flex items-start gap-2 text-xs leading-5 text-stone-500">
          <KeyRound aria-hidden="true" className="mt-0.5 size-3.5 shrink-0" />
          Keep this value private and do not commit .env.local to GitHub.
        </p>
        <Link
          className="mt-7 inline-flex rounded-xl bg-[#173f35] px-4 py-2.5 text-sm font-extrabold text-white"
          href="/"
        >
          Back to HouseCheck
        </Link>
      </section>
    </main>
  );
}
