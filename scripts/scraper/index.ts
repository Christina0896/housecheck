import "dotenv/config";
import { chromium } from "playwright";
import type { IngestPropertyPayload } from "../../src/lib/types";
import {
  discoverDaftListingUrls,
  scrapeDaftListing,
  type ScrapeContext,
} from "./daft";

const config = {
  searchUrls: (process.env.SEARCH_URLS ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean),
  ingestApiUrl: process.env.INGEST_API_URL ?? "",
  ingestApiKey: process.env.INGEST_API_KEY ?? "",
  permissionConfirmed: process.env.SCRAPER_SOURCE_PERMISSION_CONFIRMED === "true",
  userAgent:
    process.env.SCRAPER_USER_AGENT ??
    "HouseCheckPrivateResearch/0.1 (+configure-contact-email)",
  maxListings: toPositiveInteger(process.env.MAX_LISTINGS_PER_RUN, 25),
  requestDelayMs: toPositiveInteger(process.env.REQUEST_DELAY_MS, 5000),
  overpassUrl:
    process.env.OVERPASS_API_URL ?? "https://overpass-api.de/api/interpreter",
  headless: process.env.SCRAPER_HEADLESS !== "false",
};

async function main() {
  validateConfiguration();

  const browser = await chromium.launch({ headless: config.headless });
  const context: ScrapeContext = {
    browser,
    userAgent: config.userAgent,
    requestDelayMs: config.requestDelayMs,
    overpassUrl: config.overpassUrl,
  };

  let imported = 0;
  let skipped = 0;
  let failed = 0;

  try {
    const discovered = new Set<string>();
    for (const searchUrl of config.searchUrls) {
      console.log(`Discovering listings from ${searchUrl}`);
      const urls = await discoverDaftListingUrls(searchUrl, context);
      urls.forEach((url) => discovered.add(url));
      await delay(config.requestDelayMs);
    }

    const urls = Array.from(discovered).slice(0, config.maxListings);
    console.log(`Found ${discovered.size} unique listings; processing ${urls.length}.`);

    for (const [index, listingUrl] of urls.entries()) {
      console.log(`[${index + 1}/${urls.length}] ${listingUrl}`);
      try {
        const property = await scrapeDaftListing(listingUrl, context);
        if (!property.price || property.latitude === null || property.longitude === null) {
          console.warn("Skipping incomplete listing", listingUrl);
          skipped += 1;
        } else if (config.ingestApiUrl && config.ingestApiKey) {
          await sendToIngestApi(property);
          imported += 1;
        } else {
          console.log(JSON.stringify(property, null, 2));
          imported += 1;
        }
      } catch (error) {
        failed += 1;
        console.error(`Failed to process ${listingUrl}:`, error);
      }
      await delay(config.requestDelayMs);
    }
  } finally {
    await browser.close();
  }

  console.log(`Scrape finished: ${imported} imported, ${skipped} skipped, ${failed} failed.`);
  if (failed > 0 && imported === 0) process.exitCode = 1;
}

function validateConfiguration() {
  if (!config.permissionConfirmed) {
    throw new Error(
      "Set SCRAPER_SOURCE_PERMISSION_CONFIRMED=true only after obtaining explicit permission or authorised data access for automated collection from the source website.",
    );
  }
  if (!config.searchUrls.length) {
    throw new Error("SEARCH_URLS must contain at least one configured property-search URL.");
  }
  for (const searchUrl of config.searchUrls) {
    const parsed = new URL(searchUrl);
    if (parsed.protocol !== "https:") throw new Error("SEARCH_URLS must use HTTPS.");
    if (parsed.hostname !== "www.daft.ie" && parsed.hostname !== "daft.ie") {
      throw new Error(`Unsupported source host: ${parsed.hostname}`);
    }
  }
  if (Boolean(config.ingestApiUrl) !== Boolean(config.ingestApiKey)) {
    throw new Error("INGEST_API_URL and INGEST_API_KEY must be configured together.");
  }
}

async function sendToIngestApi(property: IngestPropertyPayload) {
  const response = await fetch(config.ingestApiUrl, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-ingest-key": config.ingestApiKey,
    },
    body: JSON.stringify(property),
    signal: AbortSignal.timeout(30000),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Ingest API returned ${response.status}: ${body.slice(0, 500)}`);
  }
}

function toPositiveInteger(value: string | undefined, fallback: number): number {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function delay(milliseconds: number) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
