import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { slugify } from "@/lib/format";

const httpsUrlSchema = z
  .url()
  .refine((value) => new URL(value).protocol === "https:", "HTTPS URL required");

const evidenceSchema = z.enum(["map-verified", "agent-stated", "estimated"]);
const settingLabelSchema = z.enum([
  "Lakeside",
  "Near lake",
  "Seaside",
  "Near coast",
  "Forest edge",
  "Near forest",
  "Riverside",
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
  summary: z.string().max(800),
  description: z.string().max(20000),
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

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json(
      { error: "Database is not configured" },
      { status: 503 },
    );
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

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: previous } = await supabase
    .from("properties")
    .select("id, price, first_seen")
    .eq("source_name", input.sourceName)
    .eq("source_id", input.sourceId)
    .maybeSingle();

  const record = {
    source_id: input.sourceId,
    source_name: input.sourceName,
    source_url: input.sourceUrl,
    slug: slugify(`${input.title}-${input.locality}-${input.sourceId}`),
    title: input.title,
    address: input.address,
    locality: input.locality,
    county: input.county,
    price: input.price,
    bedrooms: input.bedrooms,
    bathrooms: input.bathrooms,
    floor_area_sqm: input.floorAreaSqm,
    ber_rating: input.berRating,
    land_acres: input.landAcres,
    land_hectares: input.landHectares,
    land_size_approximate: input.landSizeApproximate,
    land_evidence: input.landEvidence,
    latitude: input.latitude,
    longitude: input.longitude,
    image_url: input.imageUrl,
    summary: input.summary,
    description: input.description,
    first_seen: previous?.first_seen ?? input.firstSeen,
    last_seen: input.lastSeen,
    is_new: !previous,
    price_changed: Boolean(previous && Number(previous.price) !== input.price),
    settings: input.settings,
    distances: input.distances,
    nearest_lake: input.nearestLake,
    nearest_forest: input.nearestForest,
    features: input.features,
    match_score: input.matchScore,
    is_active: true,
  };

  const { data, error } = await supabase
    .from("properties")
    .upsert(record, { onConflict: "source_name,source_id" })
    .select("id, slug, price, price_changed")
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
