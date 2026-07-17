# HouseCheck

HouseCheck is an Irish property-research dashboard for buyers who care about the land and setting around a home. It makes acreage visible on every result and estimates distance to lakes, coastline and woodland.

The repository contains:

- a Next.js 16 website with filtering, property analysis and comparison;
- a PostgreSQL/Supabase schema;
- a protected ingestion API;
- a scheduled Playwright scraper worker;
- acreage extraction and OpenStreetMap environmental analysis;
- tests and GitHub Actions validation.

The application starts in **demo mode**. Six fictional sample properties are shown until database credentials are configured.

## Current interface

The main search page supports:

- maximum price and minimum acreage;
- county and text search;
- lakeside, seaside and forest-setting filters;
- maximum distance to lake, coast and woodland;
- sorting by match, price, acreage and date;
- a persistent two-to-four-property comparison shortlist;
- a detailed property page with evidence labels and an OpenStreetMap view.

## Technology

- Next.js 16, React 19 and TypeScript
- Tailwind CSS 4
- Supabase/PostgreSQL
- Playwright scraper worker
- OpenStreetMap and Overpass API data
- Zod validation
- Render cron deployment for the worker
- Vercel-compatible web deployment

## Local setup

Requirements: Node.js 22 or newer and npm.

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open `http://localhost:3000`. Without Supabase variables, the demo data is used automatically.

Run all checks:

```bash
npm run check
```

## Database setup

1. Create a Supabase project.
2. Run `supabase/migrations/001_initial_schema.sql` in the SQL editor or through the Supabase CLI.
3. Add these variables to `.env.local` and to the web host:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
INGEST_API_KEY=a-long-random-secret
```

The service-role key must remain server-side. Do not expose it through a `NEXT_PUBLIC_` variable.

The website reads active properties from PostgreSQL. The scraper writes through `POST /api/ingest`, authenticated by the `x-ingest-key` header.

## Scraper setup

> **Permission required:** Daft's current Terms of Use prohibit robots or other automated retrieval/indexing and prohibit using the site to populate a database. Do not run the included Daft adapter unless Daft has given you explicit written permission or authorised data access. Review the current terms at [support.daft.ie](https://support.daft.ie/hc/en-ie/articles/5127313728273-Terms-and-Conditions-of-use-of-Daft).

Install the Chromium browser locally once:

```bash
npx playwright install chromium
```

Configure the worker in `.env.local`:

```bash
SEARCH_URLS=https://www.daft.ie/property-for-sale/ireland
INGEST_API_URL=http://localhost:3000/api/ingest
INGEST_API_KEY=the-same-secret-used-by-the-website
SCRAPER_USER_AGENT=HouseCheckPrivateResearch/0.1 (+you@example.com)
MAX_LISTINGS_PER_RUN=25
REQUEST_DELAY_MS=5000
SCRAPER_SOURCE_PERMISSION_CONFIRMED=true
```

Then run:

```bash
npm run scrape
```

`SEARCH_URLS` accepts a comma-separated list. Use narrow search URLs that already contain the counties, price and property-type filters you need.

### Scraper safeguards

The worker is deliberately conservative:

- it checks `robots.txt` before search and detail requests;
- it processes listings sequentially;
- it applies a configurable delay between requests;
- it limits listings per run;
- it refuses to start until `SCRAPER_SOURCE_PERMISSION_CONFIRMED=true`; this flag is a record that permission has been obtained, not a substitute for permission;
- it stores factual fields and links back to the source rather than reproducing an entire marketplace.

Obtain explicit permission before using the Daft adapter. `robots.txt` permission is not the same as contractual permission, and the worker's permission flag does not override a website's terms.

## How acreage is extracted

The parser searches descriptions for acre and hectare expressions, including:

- `5 acres`
- `c. 4.7 acres`
- `approximately 2 hectares`
- `site area 0.8 ha`

Each candidate is scored by surrounding language. Phrases such as “the property stands on” increase confidence; phrases such as “nearby 60 acre farm” reduce it. Hectares are converted to acres and both values are stored.

The parser records land size as **agent stated**, not legally verified.

## Environmental analysis

For each listing coordinate, the worker queries OpenStreetMap through an Overpass endpoint for:

- `natural=water` and lake/reservoir features;
- `natural=coastline`;
- `natural=wood` and `landuse=forest`.

It calculates straight-line distance using the haversine formula, then applies these initial labels:

| Label | Rule |
|---|---:|
| Lakeside | 500 m or less from mapped lake water |
| Near lake | Over 500 m and up to 3 km |
| Seaside | 1 km or less from mapped coastline |
| Near coast | Over 1 km and up to 5 km |
| Forest edge | 250 m or less from mapped woodland |
| Near forest | Over 250 m and up to 2 km |

These are screening labels. A listing pin does not prove the property boundary, frontage, ownership or access rights.

## Deployment

### Website on Vercel

Import the GitHub repository into Vercel, retain the standard Next.js settings, and add the three database/ingestion environment variables.

### Scraper on Render

The repository includes `render.yaml` and `Dockerfile.scraper`. Create a Render Blueprint from the repository, add the secret environment variables and change `SCRAPER_SOURCE_PERMISSION_CONFIRMED` only after obtaining explicit permission or authorised access. The default schedule is 07:00 UTC daily.

## Project structure

```text
src/app/                 Next.js routes and API endpoints
src/components/          Search, cards, header and evidence UI
src/data/                Fictional demo properties
src/lib/                 Shared types, formatting and data access
scripts/scraper/         Discovery, extraction and map analysis worker
supabase/migrations/     PostgreSQL schema
tests/                   Node unit tests
.github/workflows/       CI checks
```

## Important limitations

- Listing markup can change; scraper selectors require monitoring.
- Map distances depend on the accuracy of the listing pin and public map data.
- Legal boundaries require folio maps and professional review.
- “Lakefront”, “seafront” or direct access should not be asserted without boundary evidence.
- Images and long descriptions may be protected content; public republication requires an appropriate licence or permission.
