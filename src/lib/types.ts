export type SettingLabel =
  | "Lakeside"
  | "Near lake"
  | "Seaside"
  | "Near coast"
  | "Forest edge"
  | "Near forest"
  | "Riverside"
  | "Countryside"
  | "Village";

export type EvidenceLevel = "map-verified" | "agent-stated" | "estimated";

export type PropertySetting = {
  label: SettingLabel;
  evidence: EvidenceLevel;
  detail?: string;
};

export type PropertyDistances = {
  lakeKm: number | null;
  coastKm: number | null;
  forestKm: number | null;
  townKm: number | null;
};

export type Property = {
  id: string;
  slug: string;
  sourceId: string;
  sourceName: string;
  sourceUrl: string | null;
  title: string;
  address: string;
  locality: string;
  county: string;
  price: number;
  bedrooms: number;
  bathrooms: number;
  floorAreaSqm: number | null;
  berRating: string | null;
  landAcres: number | null;
  landHectares: number | null;
  landSizeApproximate: boolean;
  landEvidence: EvidenceLevel;
  latitude: number;
  longitude: number;
  imageUrl: string;
  summary: string;
  description: string;
  firstSeen: string;
  lastSeen: string;
  isNew: boolean;
  priceChanged: boolean;
  settings: PropertySetting[];
  distances: PropertyDistances;
  nearestLake: string | null;
  nearestForest: string | null;
  features: string[];
  matchScore: number;
};

export type IngestPropertyPayload = Omit<Property, "id" | "slug" | "isNew" | "priceChanged"> & {
  id?: string;
  slug?: string;
  isNew?: boolean;
  priceChanged?: boolean;
};
