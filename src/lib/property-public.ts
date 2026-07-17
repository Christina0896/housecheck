import type { Property } from "@/lib/types";

export const PUBLIC_PROPERTY_PLACEHOLDER = "/property-placeholder.svg";

export function getPublicImageUrls(property: Property): string[] {
  const mayDisplaySourceContent =
    property.contentRightsConfirmed || property.sourceName === "Demo listing";
  if (!mayDisplaySourceContent) return [PUBLIC_PROPERTY_PLACEHOLDER];

  const candidates = [...property.imageUrls, property.imageUrl]
    .map((value) => value.trim())
    .filter(Boolean);
  return Array.from(new Set(candidates)).length > 0
    ? Array.from(new Set(candidates))
    : [PUBLIC_PROPERTY_PLACEHOLDER];
}

export function getPublicDescription(property: Property): {
  text: string;
  isOriginalListingDescription: boolean;
} {
  const mayDisplaySourceContent =
    property.contentRightsConfirmed || property.sourceName === "Demo listing";
  if (mayDisplaySourceContent && property.description.trim()) {
    return {
      text: property.description.trim(),
      isOriginalListingDescription: property.sourceName !== "Demo listing",
    };
  }
  return {
    text: property.summary.trim(),
    isOriginalListingDescription: false,
  };
}
