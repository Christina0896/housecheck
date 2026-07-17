# HouseCheck

HouseCheck is an Irish property-research dashboard for buyers who care about the land and setting around a home. It makes acreage visible on every result and separates automated estimates from facts confirmed during a manual boundary review.

The repository contains:

- a Next.js 16 website with filtering, property analysis and comparison;
- a private approval queue for Christina and Jan that keeps new listings hidden until approval;
- private boundary-image storage and a public approved-photo gallery in Supabase;
- a PostgreSQL/Supabase schema;
- a protected ingestion API;
- a scheduled Playwright scraper worker;
- acreage extraction and OpenStreetMap environmental analysis;
- tests and GitHub Actions validation.

The application uses **demo mode** only when Supabase is not configured. Once a database is connected, the main search shows approved properties only. Pending and rejected properties remain private.

## Approval workflow

Every new imported property starts with `review_status = pending` and does not appear in the main search.

Open `http://localhost:3000/review` and enter the private `REVIEW_ADMIN_KEY`. If you have not created one, the existing `INGEST_API_KEY` also works. The review screen allows you to:

- check and correct the acreage;
- distinguish **Woodland on property** from **Forest edge** and **Near forest**;
- confirm river frontage, riverside, lake and coast classifications;
- enter or verify the exact Eircode;
- verify the complete source-listing description;
- upload and remove the public house and land photographs;
- upload an aerial image or folio screenshot showing the property boundary;
- confirm permission to display the description and photographs;
- save a review while keeping the property hidden;
- approve and publish the property;
- reject the property.

Boundary images are stored in a private Supabase Storage bucket. Approved property photographs are stored separately in a public read-only gallery bucket. The review page blocks publication until the description, photographs and display permission are confirmed.

## Current interface

The main search page supports:

- maximum price and minimum acreage;
- county and text search;
- woodland, forest, river, lake and coast filters;
- maximum distance to lake, coast and woodland;
- sorting by match, price, acreage and date;
- a persistent two-to-four-property comparison shortlist;
- a detailed property page with evidence labels and an OpenStreetMap view;
- a password-protected `/review` queue for checking acreage, setting labels and private boundary images before publishing.

## Technology

- Next.js 16, React 19 and TypeScript
- Tailwind CSS 4
- Supabase/PostgreSQL and private Supabase Storage
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

Open `http://localhost:3000`. Without Supabase variables, fictional demo data is used automatically.

Run all checks:

```bash
npm run check
```

## Database setup

1. Create a Supabase project.
2. Run these files in order in the Supabase SQL Editor:
   - `supabase/migrations/001_initial_schema.sql`
   - `supabase/migrations/002_review_approval.sql`
   - `supabase/migrations/003_property_source_content.sql`
3. Add these variables to `.env.local` and to the web host:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-server-secret-key
INGEST_API_KEY=a-long-random-ingestion-secret
REVIEW_ADMIN_KEY=a-different-long-private-review-password # optional; INGEST_API_KEY is the fallback
```

The service-role key and review key must remain server-side. Do not expose them through a `NEXT_PUBLIC_` variable and do not commit `.env.local`.

The scraper writes through `POST /api/ingest`, authenticated by the `x-ingest-key` header. New records enter the private review queue. Only records marked both `approved` and `is_active = true` appear in the public search.

## Manual approval workflow

HouseCheck separates automated screening from your final decision:

1. An authorised source importer creates or updates a property.
2. A new property is stored as **pending** and is not shown on the public search.
3. Open `/review` and enter the private review key.
4. Confirm acreage, Eircode and the correct setting labels.
5. Check the complete listing description and add the approved property photographs.
6. Upload an aerial boundary image or folio excerpt as private evidence when useful.
7. Confirm permission to display the source description and photographs.
8. Approve to publish, reject to hide, or save it in pending.

The setting labels distinguish:

- **Woodland on property** — trees or woodland are inside the marked boundary.
- **Forest edge** — the property boundary touches external forest.
- **Near forest** — forest is nearby but separate.
- **River frontage** — the boundary directly meets a river.
- **Riverside** — the property is beside a river, but frontage is not confirmed.

Boundary evidence is stored in a private Supabase Storage bucket and displayed in the review queue through a short-lived signed URL. It is not published on the public property page. Approved listing photographs use a separate public bucket and appear as a gallery on the property page.

## Scraper setup

> **Permission required:** The included adapter targets Daft. Do not run it unless Daft has provided suitable permission or authorised data access. The approval queue controls publication inside HouseCheck; it does not grant permission to collect source data.

Install the Chromium browser locally once:

```bash
npx playwright install chromium
```

Configure the worker in `.env.local`:

```bash
SEARCH_URLS=https://www.daft.ie/property-for-sale/ireland
INGEST_API_URL=http://localhost:3000/api/ingest
INGEST_API_KEY=the-same-ingestion-secret-used-by-the-website
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
- it refuses to start until `SCRAPER_SOURCE_PERMISSION_CONFIRMED=true`;
- it stores factual fields and links back to the source rather than reproducing an entire marketplace;
- it cannot publish a new listing without manual approval.

## How acreage is extracted

The parser searches descriptions for acre and hectare expressions, including:

- `5 acres`
- `c. 4.7 acres`
- `approximately 2 hectares`
- `site area 0.8 ha`

Each candidate is scored by surrounding language. Phrases such as “the property stands on” increase confidence; phrases such as “nearby 60 acre farm” reduce it. Hectares are converted to acres and both values are stored.

The parser records land size as **agent stated**. A reviewer can correct the value and mark it **buyer verified**.

## Environmental analysis

For each listing coordinate, the worker queries OpenStreetMap through an Overpass endpoint for:

- `natural=water` and lake/reservoir features;
- `natural=coastline`;
- `natural=wood` and `landuse=forest`.

It calculates straight-line distance using the haversine formula, then applies screening labels. The manual review adds important boundary distinctions:

| Label | Meaning |
|---|---|
| Woodland on property | Woodland is visibly inside the property boundary |
| Forest edge | The boundary touches external forest |
| Near forest | Forest is close but separate from the property |
| River frontage | The boundary directly meets a river |
| Riverside | Near a river, without confirmed frontage |
| Lakeside / Seaside | Directly beside mapped water, subject to boundary review |
| Near lake / Near coast | Close to water without confirmed frontage |

A listing pin alone does not prove the property boundary, frontage, ownership or access rights.

## Deployment

### Website on Vercel

Import the GitHub repository into Vercel, retain the standard Next.js settings, and add the four website environment variables shown above.

### Scraper on Render

The repository includes `render.yaml` and `Dockerfile.scraper`. Create a Render Blueprint from the repository, add the secret environment variables and enable the source permission flag only after authorised access has been obtained.

## Project structure

```text
src/app/                 Next.js pages and API endpoints
src/app/review/          Private moderation screen
src/components/          Search, cards, review and evidence UI
src/data/                Fictional demo properties
src/lib/                 Shared types, authentication and data access
scripts/scraper/         Discovery, extraction and map analysis worker
supabase/migrations/     PostgreSQL and Storage setup
tests/                   Node unit tests
.github/workflows/       CI checks
```

## Important limitations

- Listing markup can change; scraper selectors require monitoring.
- Map distances depend on the accuracy of the listing pin and public map data.
- Legal boundaries require folio maps and professional review.
- Boundary-image review improves classification but is not legal title verification.
- Images and long descriptions may be protected content; public republication requires appropriate permission.
