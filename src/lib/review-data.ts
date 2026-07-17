import "server-only";

import { databaseRowToProperty } from "@/lib/property-data";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import type { ReviewCounts, ReviewProperty, ReviewStatus } from "@/lib/types";

export async function getReviewProperties(
  status: ReviewStatus,
): Promise<ReviewProperty[]> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("properties")
    .select("*")
    .eq("review_status", status)
    .order("last_seen", { ascending: false })
    .limit(100);

  if (error) throw new Error(`Could not load review queue: ${error.message}`);

  return Promise.all(
    (data ?? []).map(async (row) => {
      const property = databaseRowToProperty(row);
      const boundaryEvidencePath = row.boundary_evidence_path
        ? String(row.boundary_evidence_path)
        : null;
      let boundaryEvidenceUrl: string | null = null;

      if (boundaryEvidencePath) {
        const { data: signedData } = await supabase.storage
          .from("property-evidence")
          .createSignedUrl(boundaryEvidencePath, 60 * 60);
        boundaryEvidenceUrl = signedData?.signedUrl ?? null;
      }

      return {
        ...property,
        reviewStatus: (row.review_status ?? "pending") as ReviewStatus,
        reviewNotes: row.review_notes ? String(row.review_notes) : "",
        reviewedAt: row.reviewed_at ? String(row.reviewed_at) : null,
        boundaryEvidencePath,
        boundaryEvidenceUrl,
      };
    }),
  );
}

export async function getReviewCounts(): Promise<ReviewCounts> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase.from("properties").select("review_status");

  if (error) throw new Error(`Could not count review queue: ${error.message}`);

  const counts: ReviewCounts = { pending: 0, approved: 0, rejected: 0 };
  for (const row of data ?? []) {
    const status = (row.review_status ?? "pending") as ReviewStatus;
    if (status in counts) counts[status] += 1;
  }
  return counts;
}
