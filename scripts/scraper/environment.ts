import type { PropertyDistances, PropertySetting } from "../../src/lib/types";

export type EnvironmentAnalysis = {
  distances: PropertyDistances;
  nearestLake: string | null;
  nearestForest: string | null;
  settings: PropertySetting[];
};

type Point = { lat: number; lon: number };
type OsmElement = {
  type: "node" | "way" | "relation";
  id: number;
  lat?: number;
  lon?: number;
  center?: Point;
  geometry?: Point[];
  tags?: Record<string, string>;
};

type NearestFeature = {
  distanceKm: number;
  name: string | null;
};

export async function analyseEnvironment(
  latitude: number,
  longitude: number,
  overpassUrl = "https://overpass-api.de/api/interpreter",
): Promise<EnvironmentAnalysis> {
  const query = buildOverpassQuery(latitude, longitude);

  try {
    const response = await fetch(overpassUrl, {
      method: "POST",
      headers: {
        "content-type": "application/x-www-form-urlencoded;charset=UTF-8",
        accept: "application/json",
      },
      body: new URLSearchParams({ data: query }),
      signal: AbortSignal.timeout(45000),
    });

    if (!response.ok) {
      throw new Error(`Overpass returned ${response.status}`);
    }

    const payload = (await response.json()) as { elements?: OsmElement[] };
    const elements = payload.elements ?? [];
    const origin = { lat: latitude, lon: longitude };

    const lakes = elements.filter(isLake);
    const forests = elements.filter(isForest);
    const coastlines = elements.filter(isCoastline);

    const nearestLake = findNearest(origin, lakes);
    const nearestForest = findNearest(origin, forests);
    const nearestCoast = findNearest(origin, coastlines);

    const distances: PropertyDistances = {
      lakeKm: nearestLake?.distanceKm ?? null,
      coastKm: nearestCoast?.distanceKm ?? null,
      forestKm: nearestForest?.distanceKm ?? null,
      townKm: null,
    };

    return {
      distances,
      nearestLake: nearestLake?.name ?? null,
      nearestForest: nearestForest?.name ?? null,
      settings: classifySettings(distances),
    };
  } catch (error) {
    console.warn("Environmental map analysis failed:", error);
    return {
      distances: { lakeKm: null, coastKm: null, forestKm: null, townKm: null },
      nearestLake: null,
      nearestForest: null,
      settings: [{ label: "Countryside", evidence: "estimated" }],
    };
  }
}

export function classifySettings(distances: PropertyDistances): PropertySetting[] {
  const settings: PropertySetting[] = [];

  if (distances.lakeKm !== null) {
    if (distances.lakeKm <= 0.5) {
      settings.push({
        label: "Lakeside",
        evidence: "map-verified",
        detail: formatDetail(distances.lakeKm),
      });
    } else if (distances.lakeKm <= 3) {
      settings.push({
        label: "Near lake",
        evidence: "map-verified",
        detail: formatDetail(distances.lakeKm),
      });
    }
  }

  if (distances.coastKm !== null) {
    if (distances.coastKm <= 1) {
      settings.push({
        label: "Seaside",
        evidence: "map-verified",
        detail: formatDetail(distances.coastKm),
      });
    } else if (distances.coastKm <= 5) {
      settings.push({
        label: "Near coast",
        evidence: "map-verified",
        detail: formatDetail(distances.coastKm),
      });
    }
  }

  if (distances.forestKm !== null) {
    if (distances.forestKm <= 0.25) {
      settings.push({
        label: "Forest edge",
        evidence: "map-verified",
        detail: formatDetail(distances.forestKm),
      });
    } else if (distances.forestKm <= 2) {
      settings.push({
        label: "Near forest",
        evidence: "map-verified",
        detail: formatDetail(distances.forestKm),
      });
    }
  }

  settings.push({ label: "Countryside", evidence: "estimated" });
  return settings;
}

export function haversineKm(a: Point, b: Point): number {
  const earthRadiusKm = 6371.0088;
  const latitudeDelta = toRadians(b.lat - a.lat);
  const longitudeDelta = toRadians(b.lon - a.lon);
  const latitude1 = toRadians(a.lat);
  const latitude2 = toRadians(b.lat);
  const value =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(latitude1) *
      Math.cos(latitude2) *
      Math.sin(longitudeDelta / 2) ** 2;
  return 2 * earthRadiusKm * Math.asin(Math.sqrt(value));
}

function buildOverpassQuery(latitude: number, longitude: number): string {
  return `[out:json][timeout:35];
(
  nwr(around:15000,${latitude},${longitude})["natural"="water"];
  nwr(around:15000,${latitude},${longitude})["water"~"lake|reservoir|pond"];
  nwr(around:10000,${latitude},${longitude})["natural"="wood"];
  nwr(around:10000,${latitude},${longitude})["landuse"="forest"];
  way(around:60000,${latitude},${longitude})["natural"="coastline"];
);
out tags center geom;`;
}

function isLake(element: OsmElement): boolean {
  const tags = element.tags ?? {};
  const waterType = tags.water?.toLowerCase();
  return (
    tags.natural === "water" ||
    waterType === "lake" ||
    waterType === "reservoir" ||
    waterType === "pond"
  );
}

function isForest(element: OsmElement): boolean {
  const tags = element.tags ?? {};
  return tags.natural === "wood" || tags.landuse === "forest";
}

function isCoastline(element: OsmElement): boolean {
  return element.tags?.natural === "coastline";
}

function findNearest(origin: Point, elements: OsmElement[]): NearestFeature | null {
  let nearest: NearestFeature | null = null;

  for (const element of elements) {
    const points = getElementPoints(element);
    for (const point of points) {
      const distanceKm = haversineKm(origin, point);
      if (!nearest || distanceKm < nearest.distanceKm) {
        nearest = {
          distanceKm: round(distanceKm, 3),
          name: element.tags?.name ?? element.tags?.["name:en"] ?? null,
        };
      }
    }
  }

  return nearest;
}

function getElementPoints(element: OsmElement): Point[] {
  if (element.geometry?.length) return element.geometry;
  if (element.center) return [element.center];
  if (typeof element.lat === "number" && typeof element.lon === "number") {
    return [{ lat: element.lat, lon: element.lon }];
  }
  return [];
}

function formatDetail(distanceKm: number): string {
  return distanceKm < 1
    ? `${Math.round(distanceKm * 1000)} m`
    : `${distanceKm.toFixed(1)} km`;
}

function toRadians(value: number): number {
  return (value * Math.PI) / 180;
}

function round(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}
