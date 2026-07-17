export type SettingLabel =
  | "Woodland on property"
  | "Forest edge"
  | "Near forest"
  | "River frontage"
  | "Riverside"
  | "Lakeside"
  | "Near lake"
  | "Seaside"
  | "Near coast"
  | "Countryside"
  | "Village";

export type EvidenceLevel =
  | "buyer-verified"
  | "map-verified"
  | "agent-stated"
  | "estimated";

export type ReviewStatus = "pending" | "approved" | "rejected";

export type ReviewCounts = Record<ReviewStatus, number>;

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
  reviewStatus?: ReviewStatus;
  reviewNotes?: string;
  reviewedAt?: string | null;
  boundaryEvidencePath?: string | null;
};

export type ReviewProperty = Property & {
  reviewStatus: ReviewStatus;
  reviewNotes: string;
  reviewedAt: string | null;
  boundaryEvidencePath: string | null;
  boundaryEvidenceUrl: string | null;
};

export type IngestPropertyPayload = Omit<
  Property,
  | "id"
  | "slug"
  | "isNew"
  | "priceChanged"
  | "reviewStatus"
  | "reviewNotes"
  | "reviewedAt"
  | "boundaryEvidencePath"
> & {
  id?: string;
  slug?: string;
  isNew?: boolean;
  priceChanged?: boolean;
};
