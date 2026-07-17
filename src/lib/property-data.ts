import { demoProperties } from "@/data/properties";
import {
  getSupabaseServerClient,
  hasDatabaseConfig,
} from "@/lib/supabase-server";
import type { Property } from "@/lib/types";

export type PropertyFeed = {
  properties: Property[];
  mode: "demo" | "live";
};

export async function getPropertyFeed(): Promise<PropertyFeed> {
  if (!hasDatabaseConfig()) {
    return { properties: demoProperties, mode: "demo" };
  }

  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("properties")
    .select("*")
    .eq("is_active", true)
    .eq("review_status", "approved")
    .order("match_score", { ascending: false });

  if (error) {
    console.warn("Could not load approved properties:", error.message);
    return { properties: [], mode: "live" };
  }

  return {
    properties: (data ?? []).map(databaseRowToProperty),
    mode: "live",
  };
}

export async function getProperties(): Promise<Property[]> {
  const feed = await getPropertyFeed();
  return feed.properties;
}

export async function getPropertyBySlug(
  slug: string,
): Promise<Property | undefined> {
  const properties = await getProperties();
  return properties.find((property) => property.slug === slug);
}

export function databaseRowToProperty(row: Record<string, unknown>): Property {
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
    eircode: row.eircode ? String(row.eircode) : null,
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
    imageUrls: toStringArray(row.image_urls, String(row.image_url)),
    contentRightsConfirmed: Boolean(row.content_rights_confirmed),
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
    reviewStatus: row.review_status
      ? (String(row.review_status) as Property["reviewStatus"])
      : undefined,
    reviewNotes: row.review_notes ? String(row.review_notes) : "",
    reviewedAt: row.reviewed_at ? String(row.reviewed_at) : null,
    boundaryEvidencePath: row.boundary_evidence_path
      ? String(row.boundary_evidence_path)
      : null,
  };
}

function toStringArray(value: unknown, fallback: string): string[] {
  if (!Array.isArray(value)) return fallback ? [fallback] : [];
  const items = value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);
  if (items.length > 0) return Array.from(new Set(items));
  return fallback ? [fallback] : [];
}
