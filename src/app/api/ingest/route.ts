import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { normaliseEircode } from "@/lib/eircode";
import { slugify } from "@/lib/format";
import { getSupabaseServerClient } from "@/lib/supabase-server";

const httpsUrlSchema = z
  .url()
  .refine((value) => new URL(value).protocol === "https:", "HTTPS URL required");

const evidenceSchema = z.enum([
  "buyer-verified",
  "map-verified",
  "agent-stated",
  "estimated",
]);
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

const ingestSchema = z.object({
  sourceId: z.string().min(1).max(300),
  sourceName: z.string().min(1).max(100),
  sourceUrl: httpsUrlSchema.nullable(),
  title: z.string().min(1).max(300),
  address: z.string().min(1).max(500),
  locality: z.string().min(1).max(150),
  county: z.string().min(1).max(100),
  eircode: z.string().trim().max(8).nullable().optional().default(null),
  price: z.number().int().nonnegative(),
  bedrooms: z.number().int().nonnegative(),
  bathrooms: z.number().int().nonnegative(),
  floorAreaSqm: z.number().nonnegative().nullable(),
  berRating: z.string().max(10).nullable(),
  landAcres: z.number().nonnegative().nullable(),
  landHectares: z.number().nonnegative().nullable(),
  landSizeApproximate: z.boolean(),
  landEvidence: evidenceSchema,
  latitude: z.number().gte(-90).lte(90),
  longitude: z.number().gte(-180).lte(180),
  imageUrl: httpsUrlSchema,
  imageUrls: z.array(httpsUrlSchema).max(50).optional().default([]),
  summary: z.string().max(800),
  description: z.string().max(40000),
  firstSeen: z.iso.date(),
  lastSeen: z.iso.date(),
  settings: z.array(
    z.object({
      label: settingLabelSchema,
      evidence: evidenceSchema,
      detail: z.string().max(300).optional(),
    }),
  ),
  distances: z.object({
    lakeKm: z.number().nonnegative().nullable(),
    coastKm: z.number().nonnegative().nullable(),
    forestKm: z.number().nonnegative().nullable(),
    townKm: z.number().nonnegative().nullable(),
  }),
  nearestLake: z.string().max(300).nullable(),
  nearestForest: z.string().max(300).nullable(),
  features: z.array(z.string().max(300)).max(50),
  matchScore: z.number().int().gte(0).lte(100),
});

export async function POST(request: NextRequest) {
  const configuredKey = process.env.INGEST_API_KEY;
  const suppliedKey = request.headers.get("x-ingest-key");

  if (!configuredKey || suppliedKey !== configuredKey) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let input: z.infer<typeof ingestSchema>;
  try {
    input = ingestSchema.parse(await request.json());
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid property payload", issues: error.issues },
        { status: 400 },
      );
    }
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  let supabase;
  try {
    supabase = getSupabaseServerClient();
  } catch {
    return NextResponse.json(
      { error: "Database is not configured" },
      { status: 503 },
    );
  }

  const { data: previous } = await supabase
    .from("properties")
    .select(
      "id, price, first_seen, review_status, is_active, review_notes, boundary_evidence_path, reviewed_at, settings, land_acres, land_hectares, land_evidence, eircode, image_url, image_urls, description, title, address, content_rights_confirmed",
    )
    .eq("source_name", input.sourceName)
    .eq("source_id", input.sourceId)
    .maybeSingle();

  const previousSettings = Array.isArray(previous?.settings)
    ? previous.settings
    : [];
  const buyerVerifiedSettings = previousSettings.filter(
    (setting) =>
      typeof setting === "object" &&
      setting !== null &&
      "evidence" in setting &&
      setting.evidence === "buyer-verified",
  );
  const buyerVerifiedLabels = new Set(
    buyerVerifiedSettings.flatMap((setting) =>
      typeof setting === "object" && setting !== null && "label" in setting
        ? [String(setting.label)]
        : [],
    ),
  );
  const mergedSettings = [
    ...buyerVerifiedSettings,
    ...input.settings.filter(
      (setting) => !buyerVerifiedLabels.has(setting.label),
    ),
  ];
  const buyerVerifiedLand = previous?.land_evidence === "buyer-verified";
  const eircode = normaliseEircode(input.eircode);
  const sourceImageUrls = normalizeImageUrls(input.imageUrls, input.imageUrl);
  const previousImageUrls = normalizeImageUrls(
    Array.isArray(previous?.image_urls)
      ? previous.image_urls.filter(
          (value): value is string => typeof value === "string",
        )
      : [],
    previous?.image_url ? String(previous.image_url) : "",
  );
  const uploadedImageUrls = previousImageUrls.filter(isHouseCheckUploadedImage);
  const previousSourceImageUrls = previousImageUrls.filter(
    (value) => !isHouseCheckUploadedImage(value),
  );
  const imageUrls = normalizeImageUrls(
    [...uploadedImageUrls, ...sourceImageUrls],
    sourceImageUrls[0] ?? input.imageUrl,
  );
  const sourceContentChanged = Boolean(
    previous &&
      (String(previous.title) !== input.title ||
        String(previous.address) !== input.address ||
        normaliseEircode(previous.eircode ? String(previous.eircode) : null) !==
          eircode ||
        String(previous.description) !== input.description ||
        !sameStringArray(previousSourceImageUrls, sourceImageUrls)),
  );
  const reviewStatus = sourceContentChanged
    ? "pending"
    : previous?.review_status ?? "pending";

  const record = {
    source_id: input.sourceId,
    source_name: input.sourceName,
    source_url: input.sourceUrl,
    slug: slugify(`${input.title}-${input.locality}-${input.sourceId}`),
    title: input.title,
    address: input.address,
    locality: input.locality,
    county: input.county,
    eircode,
    price: input.price,
    bedrooms: input.bedrooms,
    bathrooms: input.bathrooms,
    floor_area_sqm: input.floorAreaSqm,
    ber_rating: input.berRating,
    land_acres: buyerVerifiedLand ? previous?.land_acres : input.landAcres,
    land_hectares: buyerVerifiedLand
      ? previous?.land_hectares
      : input.landHectares,
    land_size_approximate: input.landSizeApproximate,
    land_evidence: buyerVerifiedLand
      ? previous?.land_evidence
      : input.landEvidence,
    latitude: input.latitude,
    longitude: input.longitude,
    image_url: imageUrls[0],
    image_urls: imageUrls,
    content_rights_confirmed: sourceContentChanged
      ? false
      : previous?.content_rights_confirmed ?? false,
    summary: input.summary,
    description: input.description,
    first_seen: previous?.first_seen ?? input.firstSeen,
    last_seen: input.lastSeen,
    is_new: !previous,
    price_changed: Boolean(previous && Number(previous.price) !== input.price),
    settings: mergedSettings,
    distances: input.distances,
    nearest_lake: input.nearestLake,
    nearest_forest: input.nearestForest,
    features: input.features,
    match_score: input.matchScore,
    review_status: reviewStatus,
    review_notes: previous?.review_notes ?? "",
    boundary_evidence_path: previous?.boundary_evidence_path ?? null,
    reviewed_at: sourceContentChanged ? null : previous?.reviewed_at ?? null,
    is_active:
      reviewStatus === "approved" ? (previous?.is_active ?? true) : false,
  };

  const { data, error } = await supabase
    .from("properties")
    .upsert(record, { onConflict: "source_name,source_id" })
    .select("id, slug, price, price_changed, review_status")
    .single();

  if (error) {
    console.error("Property ingest failed:", error);
    return NextResponse.json({ error: "Database write failed" }, { status: 500 });
  }

  if (previous && Number(previous.price) !== input.price) {
    await supabase.from("price_history").insert({
      property_id: data.id,
      price: input.price,
      observed_at: new Date().toISOString(),
    });
  }

  return NextResponse.json({ ok: true, property: data });
}

function normalizeImageUrls(imageUrls: string[], fallback: string): string[] {
  const values = [...imageUrls, fallback]
    .map((value) => value.trim())
    .filter(Boolean);
  return Array.from(new Set(values)).slice(0, 50);
}

function sameStringArray(left: string[], right: string[]): boolean {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}

function isHouseCheckUploadedImage(value: string): boolean {
  return value.includes("/storage/v1/object/public/property-images/");
}
