import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { normaliseEircode } from "@/lib/eircode";
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

const httpsUrlSchema = z
  .url()
  .refine((value) => new URL(value).protocol === "https:", "HTTPS URL required");

const updateSchema = z.object({
  reviewStatus: z.enum(["pending", "approved", "rejected"]),
  reviewNotes: z.string().max(4000),
  landAcres: z.number().nonnegative().nullable(),
  eircode: z.string().trim().max(12).nullable(),
  description: z.string().max(40000),
  imageUrls: z.array(httpsUrlSchema).max(50),
  contentRightsConfirmed: z.boolean(),
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

  const imageUrls = Array.from(
    new Set(input.imageUrls.map((value) => value.trim()).filter(Boolean)),
  );
  const description = input.description.trim();
  const eircode = input.eircode?.trim()
    ? normaliseEircode(input.eircode)
    : null;

  if (input.eircode?.trim() && !eircode) {
    return NextResponse.json(
      { error: "Enter a valid Eircode, for example P12 A1B2" },
      { status: 400 },
    );
  }

  if (input.reviewStatus === "approved") {
    if (!input.contentRightsConfirmed) {
      return NextResponse.json(
        {
          error:
            "Confirm that HouseCheck may display the listing description and photographs before publishing",
        },
        { status: 400 },
      );
    }
    if (description.length < 20) {
      return NextResponse.json(
        { error: "Add the complete listing description before publishing" },
        { status: 400 },
      );
    }
    if (
      imageUrls.length === 0 ||
      imageUrls.every((url) => url.includes("property-placeholder"))
    ) {
      return NextResponse.json(
        { error: "Add at least one real property photograph before publishing" },
        { status: 400 },
      );
    }
  }

  const landHectares =
    input.landAcres === null
      ? null
      : Math.round((input.landAcres / 2.47105381) * 10000) / 10000;
  const reviewedAt =
    input.reviewStatus === "pending" ? null : new Date().toISOString();

  const update: Record<string, unknown> = {
    land_acres: input.landAcres,
    land_hectares: landHectares,
    land_evidence: "buyer-verified",
    eircode,
    description,
    image_urls: imageUrls,
    content_rights_confirmed: input.contentRightsConfirmed,
    review_status: input.reviewStatus,
    review_notes: input.reviewNotes,
    reviewed_at: reviewedAt,
    is_active: input.reviewStatus === "approved",
    settings: input.settings.map((setting) => ({
      ...setting,
      evidence: "buyer-verified",
    })),
  };
  if (imageUrls[0]) update.image_url = imageUrls[0];

  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("properties")
    .update(update)
    .eq("id", id)
    .select("id, review_status, reviewed_at, eircode")
    .single();

  if (error) {
    console.error("Review update failed:", error);
    return NextResponse.json({ error: "Review update failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, property: data });
}
