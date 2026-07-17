import { createClient } from "@supabase/supabase-js";
import { demoProperties } from "@/data/properties";
import type { Property } from "@/lib/types";

function hasDatabaseConfig(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.SUPABASE_SERVICE_ROLE_KEY,
  );
}

export async function getProperties(): Promise<Property[]> {
  if (!hasDatabaseConfig()) return demoProperties;

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );

  const { data, error } = await supabase
    .from("properties")
    .select("*")
    .eq("is_active", true)
    .order("match_score", { ascending: false });

  if (error || !data?.length) {
    console.error("Falling back to demo properties:", error?.message);
    return demoProperties;
  }

  return data.map(databaseRowToProperty);
}

export async function getPropertyBySlug(
  slug: string,
): Promise<Property | undefined> {
  const properties = await getProperties();
  return properties.find((property) => property.slug === slug);
}

function databaseRowToProperty(row: Record<string, unknown>): Property {
  return {
    id: String(row.id),
    slug: String(row.slug),
    sourceId: String(row.source_id),
    sourceName: String(row.source_name),
    sourceUrl: row.source_url ? String(row.source_url) : null,
    title: String(row.title),
    address: String(row.address),
    locality: String(row.locality),
    county: String(row.county),
    price: Number(row.price),
    bedrooms: Number(row.bedrooms),
    bathrooms: Number(row.bathrooms),
    floorAreaSqm:
      row.floor_area_sqm === null ? null : Number(row.floor_area_sqm),
    berRating: row.ber_rating ? String(row.ber_rating) : null,
    landAcres: row.land_acres === null ? null : Number(row.land_acres),
    landHectares:
      row.land_hectares === null ? null : Number(row.land_hectares),
    landSizeApproximate: Boolean(row.land_size_approximate),
    landEvidence: row.land_evidence as Property["landEvidence"],
    latitude: Number(row.latitude),
    longitude: Number(row.longitude),
    imageUrl: String(row.image_url),
    summary: String(row.summary),
    description: String(row.description),
    firstSeen: String(row.first_seen),
    lastSeen: String(row.last_seen),
    isNew: Boolean(row.is_new),
    priceChanged: Boolean(row.price_changed),
    settings: (row.settings ?? []) as Property["settings"],
    distances: (row.distances ?? {}) as Property["distances"],
    nearestLake: row.nearest_lake ? String(row.nearest_lake) : null,
    nearestForest: row.nearest_forest ? String(row.nearest_forest) : null,
    features: (row.features ?? []) as string[],
    matchScore: Number(row.match_score),
  };
}
