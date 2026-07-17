import { createHash } from "node:crypto";
import type { Browser, Page } from "playwright";
import type { IngestPropertyPayload, PropertySetting } from "../../src/lib/types";
import {
  extractBathrooms,
  extractBedrooms,
  extractBerRating,
  extractFloorAreaSqm,
  extractLandSize,
  extractPrice,
  normalizeWhitespace,
  summarize,
} from "./extract";
import { analyseEnvironment } from "./environment";
import { isAllowedByRobots } from "./robots";

const IRISH_COUNTIES = [
  "Carlow",
  "Cavan",
  "Clare",
  "Cork",
  "Donegal",
  "Dublin",
  "Galway",
  "Kerry",
  "Kildare",
  "Kilkenny",
  "Laois",
  "Leitrim",
  "Limerick",
  "Longford",
  "Louth",
  "Mayo",
  "Meath",
  "Monaghan",
  "Offaly",
  "Roscommon",
  "Sligo",
  "Tipperary",
  "Waterford",
  "Westmeath",
  "Wexford",
  "Wicklow",
];

export type ScrapeContext = {
  browser: Browser;
  userAgent: string;
  requestDelayMs: number;
  overpassUrl: string;
};

export async function discoverDaftListingUrls(
  searchUrl: string,
  context: ScrapeContext,
): Promise<string[]> {
  if (!(await isAllowedByRobots(searchUrl, context.userAgent))) {
    throw new Error(`robots.txt does not permit the configured search URL: ${searchUrl}`);
  }

  const page = await context.browser.newPage({ userAgent: context.userAgent });
  try {
    await page.goto(searchUrl, { waitUntil: "domcontentloaded", timeout: 60000 });
    await page.waitForTimeout(2500);

    const hrefs = await page.locator('a[href*="/for-sale/"]').evaluateAll((anchors) =>
      anchors
        .map((anchor) => (anchor as HTMLAnchorElement).href)
        .filter((href) => /^https:\/\/www\.daft\.ie\/for-sale\//.test(href)),
    );

    return Array.from(new Set(hrefs.map(stripTracking)));
  } finally {
    await page.close();
  }
}

export async function scrapeDaftListing(
  listingUrl: string,
  context: ScrapeContext,
): Promise<IngestPropertyPayload> {
  if (!(await isAllowedByRobots(listingUrl, context.userAgent))) {
    throw new Error(`robots.txt does not permit listing URL: ${listingUrl}`);
  }

  const page = await context.browser.newPage({ userAgent: context.userAgent });
  try {
    await page.goto(listingUrl, { waitUntil: "domcontentloaded", timeout: 60000 });
    await page.waitForTimeout(1800);

    const pageData = await readPageData(page);
    if (pageData.latitude === null || pageData.longitude === null) {
      throw new Error("Listing coordinates were not found");
    }

    const land = extractLandSize(`${pageData.description} ${pageData.bodyText}`);
    const environment = await analyseEnvironment(
      pageData.latitude,
      pageData.longitude,
      context.overpassUrl,
    );
    const settings = mergeSettings(
      environment.settings,
      inferAgentSettings(pageData.description),
    );
    const today = new Date().toISOString().slice(0, 10);
    const price = extractPrice(`${pageData.priceText} ${pageData.bodyText}`);
    const bedrooms = extractBedrooms(pageData.bodyText);
    const bathrooms = extractBathrooms(pageData.bodyText);
    const county = findCounty(`${pageData.address} ${pageData.title}`) ?? "Unknown";
    const locality = findLocality(pageData.address, county);
    const features = inferFeatures(pageData.description);

    return {
      sourceId: stableSourceId(listingUrl),
      sourceName: "Daft.ie",
      sourceUrl: listingUrl,
      title: pageData.title || pageData.address || "Property listing",
      address: pageData.address || pageData.title || "Address not stated",
      locality,
      county,
      price,
      bedrooms,
      bathrooms,
      floorAreaSqm: extractFloorAreaSqm(pageData.bodyText),
      berRating: extractBerRating(pageData.bodyText),
      landAcres: land?.acres ?? null,
      landHectares: land?.hectares ?? null,
      landSizeApproximate: land?.approximate ?? true,
      landEvidence: land ? "agent-stated" : "estimated",
      latitude: pageData.latitude,
      longitude: pageData.longitude,
      imageUrl: pageData.imageUrl ?? "https://placehold.co/1200x800?text=Property",
      summary: summarize(pageData.description || pageData.bodyText, 320),
      description: normalizeWhitespace(pageData.description || pageData.bodyText).slice(0, 20000),
      firstSeen: today,
      lastSeen: today,
      settings,
      distances: environment.distances,
      nearestLake: environment.nearestLake,
      nearestForest: environment.nearestForest,
      features,
      matchScore: calculateMatchScore({
        price,
        acres: land?.acres ?? null,
        lakeKm: environment.distances.lakeKm,
        coastKm: environment.distances.coastKm,
        forestKm: environment.distances.forestKm,
      }),
    };
  } finally {
    await page.close();
  }
}

async function readPageData(page: Page) {
  const bodyText = normalizeWhitespace(await page.locator("body").innerText());
  const title = normalizeWhitespace(
    (await page.locator("h1").first().textContent().catch(() => null)) ?? "",
  );
  const description = await firstText(page, [
    '[data-testid*="description"]',
    '[class*="Description"]',
    'section:has(h2:has-text("Description"))',
    'section:has(h3:has-text("Description"))',
    "main",
  ]);
  const priceText =
    (await page.locator('[data-testid*="price"]').first().textContent().catch(() => null)) ??
    bodyText;
  const imageUrl = await page
    .locator('meta[property="og:image"]')
    .getAttribute("content")
    .catch(() => null);
  const address =
    (await page.locator('[data-testid*="address"]').first().textContent().catch(() => null)) ??
    title;
  const html = await page.content();
  const coordinates = await findCoordinates(page, html);

  return {
    bodyText,
    title,
    description: normalizeWhitespace(description || bodyText),
    priceText,
    imageUrl,
    address: normalizeWhitespace(address),
    ...coordinates,
  };
}

async function firstText(page: Page, selectors: string[]): Promise<string> {
  for (const selector of selectors) {
    const locator = page.locator(selector).first();
    if ((await locator.count()) === 0) continue;
    const text = await locator.innerText().catch(() => "");
    if (text.trim().length > 80) return text;
  }
  return "";
}

async function findCoordinates(
  page: Page,
  html: string,
): Promise<{ latitude: number | null; longitude: number | null }> {
  const jsonLdScripts = await page
    .locator('script[type="application/ld+json"]')
    .allTextContents()
    .catch(() => [] as string[]);

  for (const raw of jsonLdScripts) {
    try {
      const coordinates = findGeoInObject(JSON.parse(raw));
      if (coordinates) return coordinates;
    } catch {
      // Ignore malformed JSON-LD and continue with other sources.
    }
  }

  const latitudeMatch = html.match(/"(?:latitude|lat)"\s*:\s*"?(-?\d{1,2}\.\d+)"?/i);
  const longitudeMatch = html.match(/"(?:longitude|lng|lon)"\s*:\s*"?(-?\d{1,3}\.\d+)"?/i);
  return {
    latitude: latitudeMatch ? Number(latitudeMatch[1]) : null,
    longitude: longitudeMatch ? Number(longitudeMatch[1]) : null,
  };
}

function findGeoInObject(
  value: unknown,
): { latitude: number; longitude: number } | null {
  if (!value || typeof value !== "object") return null;

  if (Array.isArray(value)) {
    for (const item of value) {
      const found = findGeoInObject(item);
      if (found) return found;
    }
    return null;
  }

  const record = value as Record<string, unknown>;
  const latitude = toCoordinate(record.latitude ?? record.lat);
  const longitude = toCoordinate(record.longitude ?? record.lng ?? record.lon);
  if (latitude !== null && longitude !== null) return { latitude, longitude };

  for (const child of Object.values(record)) {
    const found = findGeoInObject(child);
    if (found) return found;
  }
  return null;
}

function toCoordinate(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function inferAgentSettings(description: string): PropertySetting[] {
  const text = description.toLowerCase();
  const settings: PropertySetting[] = [];
  if (/river frontage|river access|riverside|riverbank/.test(text)) {
    settings.push({ label: "Riverside", evidence: "agent-stated" });
  }
  return settings;
}

function mergeSettings(
  mapSettings: PropertySetting[],
  agentSettings: PropertySetting[],
): PropertySetting[] {
  const seen = new Set<string>();
  return [...mapSettings, ...agentSettings].filter((setting) => {
    if (seen.has(setting.label)) return false;
    seen.add(setting.label);
    return true;
  });
}

function inferFeatures(description: string): string[] {
  const text = description.toLowerCase();
  const rules: Array<[RegExp, string]> = [
    [/paddock/, "Paddock"],
    [/woodland|mature trees/, "Woodland or mature trees"],
    [/outbuilding|workshop|shed/, "Outbuilding"],
    [/garage/, "Garage"],
    [/orchard/, "Orchard"],
    [/private well|well water/, "Private well"],
    [/fibre|fiber broadband/, "Fibre mentioned"],
    [/sea view|ocean view/, "Sea view claimed"],
    [/lake view/, "Lake view claimed"],
    [/right of way/, "Right of way mentioned"],
  ];

  return rules.filter(([pattern]) => pattern.test(text)).map(([, label]) => label);
}

function findCounty(text: string): string | null {
  const found = IRISH_COUNTIES.find((county) =>
    new RegExp(`\\b(?:Co\\.?\\s*)?${county}\\b`, "i").test(text),
  );
  return found ?? null;
}

function findLocality(address: string, county: string): string {
  const parts = address
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
  const countyIndex = parts.findIndex((part) =>
    new RegExp(`(?:Co\\.?\\s*)?${county}`, "i").test(part),
  );
  if (countyIndex > 0) return parts[countyIndex - 1];
  return parts.at(-2) ?? parts[0] ?? "Unknown";
}

function calculateMatchScore(input: {
  price: number;
  acres: number | null;
  lakeKm: number | null;
  coastKm: number | null;
  forestKm: number | null;
}): number {
  let score = 45;
  if (input.price > 0 && input.price <= 500000) score += 12;
  if (input.acres !== null) score += Math.min(20, input.acres * 4);
  if (input.lakeKm !== null && input.lakeKm <= 3) score += 8;
  if (input.coastKm !== null && input.coastKm <= 5) score += 8;
  if (input.forestKm !== null && input.forestKm <= 2) score += 7;
  return Math.max(0, Math.min(100, Math.round(score)));
}

function stableSourceId(url: string): string {
  const numericId = url.match(/\/(\d+)(?:\?|$)/)?.[1];
  return numericId ?? createHash("sha1").update(stripTracking(url)).digest("hex").slice(0, 20);
}

function stripTracking(url: string): string {
  const parsed = new URL(url);
  parsed.search = "";
  parsed.hash = "";
  return parsed.toString();
}
