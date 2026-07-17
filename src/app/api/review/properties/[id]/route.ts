import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { isReviewRequestAuthorized } from "@/lib/review-auth";
import { getSupabaseServerClient } from "@/lib/supabase-server";

const settingLabelSchema = z.enum([
  "Woodland on property",
  "Forest edge",
  "Near forest",
  "River frontage",
  "Riverside",
  "Lakeside",
  "Near lake",
  "Seaside",
  "Near coast",
  "Countryside",
  "Village",
]);

const updateSchema = z.object({
  reviewStatus: z.enum(["pending", "approved", "rejected"]),
  reviewNotes: z.string().max(4000),
  landAcres: z.number().nonnegative().nullable(),
  settings: z
    .array(
      z.object({
        label: settingLabelSchema,
        detail: z.string().max(300).optional(),
      }),
    )
    .max(20),
});

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  if (!isReviewRequestAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  let input: z.infer<typeof updateSchema>;
  try {
    input = updateSchema.parse(await request.json());
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid review update", issues: error.issues },
        { status: 400 },
      );
    }
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const landHectares =
    input.landAcres === null
      ? null
      : Math.round((input.landAcres / 2.47105381) * 10000) / 10000;
  const reviewedAt =
    input.reviewStatus === "pending" ? null : new Date().toISOString();

  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("properties")
    .update({
      land_acres: input.landAcres,
      land_hectares: landHectares,
      land_evidence: "buyer-verified",
      review_status: input.reviewStatus,
      review_notes: input.reviewNotes,
      reviewed_at: reviewedAt,
      is_active: input.reviewStatus === "approved",
      settings: input.settings.map((setting) => ({
        ...setting,
        evidence: "buyer-verified",
      })),
    })
    .eq("id", id)
    .select("id, review_status, reviewed_at")
    .single();

  if (error) {
    console.error("Review update failed:", error);
    return NextResponse.json({ error: "Review update failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, property: data });
}
