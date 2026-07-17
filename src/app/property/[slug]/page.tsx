import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Bath,
  BedDouble,
  Building2,
  CheckCircle2,
  ExternalLink,
  FileWarning,
  LandPlot,
  MapPin,
  Ruler,
  ShieldCheck,
  Trees,
  Waves,
} from "lucide-react";
import { EvidenceBadge } from "@/components/evidence-badge";
import { PropertyGallery } from "@/components/property-gallery";
import { formatCurrency, formatDate, formatDistance } from "@/lib/format";
import { getProperties, getPropertyBySlug } from "@/lib/property-data";
import { getPublicDescription, getPublicImageUrls } from "@/lib/property-public";
import type { Property } from "@/lib/types";

export async function generateStaticParams() {
  const properties = await getProperties();
  return properties.map((property) => ({ slug: property.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const property = await getPropertyBySlug(slug);
  if (!property) return { title: "Property not found" };
  return {
    title: `${property.title}, ${property.locality}`,
    description: property.summary,
  };
}

export default async function PropertyPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const property = await getPropertyBySlug(slug);
  if (!property) notFound();

  const publicImages = getPublicImageUrls(property);
  const publicDescription = getPublicDescription(property);

  return (
    <main className="mx-auto w-full max-w-[1360px] flex-1 px-4 py-7 sm:px-6 lg:px-8 lg:py-10">
      <Link
        className="inline-flex items-center gap-2 text-sm font-extrabold text-stone-600 transition hover:text-emerald-900"
        href="/"
      >
        <ArrowLeft aria-hidden="true" className="size-4" />
        Back to all properties
      </Link>

      <section className="mt-5 overflow-hidden rounded-[30px] border border-stone-200 bg-white shadow-[0_18px_60px_rgba(31,45,39,0.08)]">
        <div className="grid lg:grid-cols-[1.15fr_0.85fr]">
          <div className="relative bg-stone-200">
            <PropertyGallery images={publicImages} title={property.title} />
            <div className="pointer-events-none absolute inset-x-0 top-0 flex items-center justify-between gap-3 p-5">
              <span className="rounded-full bg-white/95 px-3 py-1.5 text-xs font-extrabold text-emerald-950 shadow-sm backdrop-blur">
                {property.sourceName}
              </span>
              <span className="rounded-full bg-[#173f35]/95 px-3 py-1.5 text-xs font-extrabold text-white shadow-sm backdrop-blur">
                {property.matchScore}% match
              </span>
            </div>
          </div>

          <div className="flex flex-col p-6 sm:p-8 lg:p-10">
            <div className="flex flex-wrap items-center gap-2">
              {property.settings.slice(0, 3).map((setting) => (
                <span
                  className="rounded-full bg-[#edf4ef] px-2.5 py-1 text-xs font-extrabold text-emerald-950 ring-1 ring-inset ring-emerald-800/10"
                  key={setting.label}
                >
                  {setting.label}
                </span>
              ))}
            </div>
            <h1 className="mt-5 text-4xl font-black tracking-[-0.05em] text-stone-950 sm:text-5xl">
              {property.title}
            </h1>
            <p className="mt-3 flex items-center gap-2 text-base font-semibold text-stone-600">
              <MapPin aria-hidden="true" className="size-4" />
              {property.address}, Co. {property.county}
            </p>
            <div className="mt-3 inline-flex items-center gap-2 rounded-xl bg-stone-100 px-3 py-2 text-sm font-extrabold text-stone-800">
              <span className="text-[10px] uppercase tracking-[0.12em] text-stone-500">
                Eircode
              </span>
              <span>{property.eircode ?? "Not supplied"}</span>
            </div>
            <p className="mt-7 text-4xl font-black tracking-[-0.04em] text-[#173f35]">
              {formatCurrency(property.price)}
            </p>

            <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4">
              <PrimaryMetric icon={BedDouble} label="Bedrooms" value={property.bedrooms} />
              <PrimaryMetric icon={Bath} label="Bathrooms" value={property.bathrooms} />
              <PrimaryMetric
                icon={Ruler}
                label="Floor area"
                value={property.floorAreaSqm ? `${property.floorAreaSqm} m²` : "—"}
              />
              <PrimaryMetric
                icon={Building2}
                label="BER"
                value={property.berRating ?? "—"}
              />
            </div>

            <div className="mt-7 rounded-2xl border border-emerald-900/10 bg-[#edf4ef] p-5">
              <div className="flex items-start justify-between gap-5">
                <div>
                  <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-emerald-800">
                    Land size found
                  </p>
                  <p className="mt-1 text-4xl font-black tracking-[-0.04em] text-emerald-950">
                    {property.landAcres?.toFixed(1) ?? "—"} acres
                  </p>
                  <p className="mt-1 text-sm font-semibold text-emerald-900/70">
                    {property.landHectares?.toFixed(2) ?? "—"} hectares
                    {property.landSizeApproximate ? " · approximate" : ""}
                  </p>
                </div>
                <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-white text-emerald-900 shadow-sm">
                  <LandPlot aria-hidden="true" className="size-5" />
                </span>
              </div>
              <div className="mt-4 flex items-center gap-2 border-t border-emerald-900/10 pt-4">
                <EvidenceBadge level={property.landEvidence} />
                <p className="text-xs leading-5 text-emerald-950/70">
                  Confirm acreage and legal boundaries with the sales brochure or folio map.
                </p>
              </div>
            </div>

            <div className="mt-5">
              <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-stone-500">
                Setting evidence
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {property.settings.map((setting) => (
                  <span
                    className="inline-flex items-center gap-2 rounded-xl border border-stone-200 bg-stone-50 px-2.5 py-2 text-xs font-extrabold text-stone-800"
                    key={`${setting.label}-${setting.evidence}`}
                    title={setting.detail}
                  >
                    {setting.label}
                    <EvidenceBadge level={setting.evidence} />
                  </span>
                ))}
              </div>
            </div>

            <div className="mt-auto pt-7">
              {property.sourceUrl ? (
                <a
                  className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#f2c45b] text-sm font-extrabold text-[#2f280f] transition hover:bg-[#e8b84b]"
                  href={property.sourceUrl}
                  rel="noreferrer"
                  target="_blank"
                >
                  Open original listing
                  <ExternalLink aria-hidden="true" className="size-4" />
                </a>
              ) : (
                <div className="rounded-xl bg-stone-100 px-4 py-3 text-center text-xs font-semibold text-stone-600">
                  Demo record — no original listing attached
                </div>
              )}
              <p className="mt-3 text-center text-[11px] text-stone-500">
                First found {formatDate(property.firstSeen)} · last checked {formatDate(property.lastSeen)}
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="mt-7 grid items-start gap-7 lg:grid-cols-[minmax(0,1.15fr)_minmax(340px,0.85fr)]">
        <div className="space-y-7">
          <section className="rounded-[24px] border border-stone-200 bg-white p-6 shadow-sm sm:p-8">
            <p className="text-xs font-extrabold uppercase tracking-[0.13em] text-emerald-800">
              {publicDescription.isOriginalListingDescription
                ? "Original listing description"
                : "HouseCheck summary"}
            </p>
            <h2 className="mt-2 text-2xl font-black tracking-[-0.035em] text-stone-950">
              Property description
            </h2>
            <p className="mt-4 whitespace-pre-line text-base leading-7 text-stone-700">
              {publicDescription.text}
            </p>
            {publicDescription.isOriginalListingDescription ? (
              <p className="mt-4 rounded-xl bg-stone-50 px-3 py-2 text-xs leading-5 text-stone-500">
                Description attributed to {property.sourceName}. Check the original listing for the latest wording.
              </p>
            ) : null}

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {property.features.map((feature) => (
                <div
                  className="flex items-center gap-3 rounded-xl bg-stone-50 px-4 py-3 text-sm font-bold text-stone-800"
                  key={feature}
                >
                  <CheckCircle2 aria-hidden="true" className="size-4 shrink-0 text-emerald-700" />
                  {feature}
                </div>
              ))}
            </div>
          </section>

          <section className="overflow-hidden rounded-[24px] border border-stone-200 bg-white shadow-sm">
            <div className="border-b border-stone-200 p-6 sm:p-8">
              <p className="text-xs font-extrabold uppercase tracking-[0.13em] text-emerald-800">
                Location analysis
              </p>
              <h2 className="mt-2 text-2xl font-black tracking-[-0.035em] text-stone-950">
                Water, coast and woodland
              </h2>
              <p className="mt-2 text-sm leading-6 text-stone-600">
                Distances are calculated from the listing pin to mapped geographic features.
                They do not prove ownership, frontage or access rights.
              </p>
            </div>
            <div className="grid sm:grid-cols-3">
              <DistancePanel
                detail={property.nearestLake ?? "Nearest mapped water"}
                icon={Waves}
                label="Lake"
                value={formatDistance(property.distances.lakeKm)}
              />
              <DistancePanel
                detail="Nearest mapped coastline"
                icon={Waves}
                label="Coast"
                value={formatDistance(property.distances.coastKm)}
              />
              <DistancePanel
                detail={property.nearestForest ?? "Nearest mapped woodland"}
                icon={Trees}
                label="Forest"
                value={formatDistance(property.distances.forestKm)}
              />
            </div>
          </section>
        </div>

        <div className="space-y-7 lg:sticky lg:top-24">
          <section className="overflow-hidden rounded-[24px] border border-stone-200 bg-white shadow-sm">
            <div className="flex items-center justify-between gap-4 border-b border-stone-200 p-5">
              <div>
                <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-stone-500">
                  Approximate pin
                </p>
                <h2 className="mt-1 text-lg font-black text-stone-950">Map view</h2>
              </div>
              <MapPin aria-hidden="true" className="size-5 text-emerald-800" />
            </div>
            <iframe
              className="h-[360px] w-full border-0 bg-stone-100"
              loading="lazy"
              src={openStreetMapEmbed(property)}
              title={`Map showing ${property.title}`}
            />
            <div className="border-t border-stone-200 p-4 text-xs leading-5 text-stone-600">
              Map data © OpenStreetMap contributors. The pin may be deliberately offset by the listing agent.
            </div>
          </section>

          <section className="rounded-[24px] border border-amber-200 bg-amber-50 p-5 shadow-sm">
            <div className="flex items-start gap-3">
              <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-white text-amber-900 shadow-sm">
                <FileWarning aria-hidden="true" className="size-4" />
              </span>
              <div>
                <h2 className="font-black text-amber-950">Verify before relying on it</h2>
                <p className="mt-2 text-sm leading-6 text-amber-950/75">
                  Ask for the folio map, planning history, flood information and written confirmation of any lake, river or road access.
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-[24px] border border-stone-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="grid size-9 place-items-center rounded-xl bg-[#edf4ef] text-emerald-900">
                <ShieldCheck aria-hidden="true" className="size-4" />
              </span>
              <div>
                <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-stone-500">
                  Evidence model
                </p>
                <p className="mt-1 text-sm font-bold text-stone-900">
                  Agent claims and map checks are kept separate.
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

function PrimaryMetric({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof BedDouble;
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-2xl bg-stone-50 p-3.5">
      <Icon aria-hidden="true" className="size-4 text-stone-500" />
      <p className="mt-3 text-lg font-black text-stone-950">{value}</p>
      <p className="mt-0.5 text-[10px] font-extrabold uppercase tracking-[0.1em] text-stone-500">
        {label}
      </p>
    </div>
  );
}

function DistancePanel({
  icon: Icon,
  label,
  value,
  detail,
}: {
  icon: typeof Waves;
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="border-b border-stone-200 p-6 last:border-b-0 sm:border-b-0 sm:border-r sm:last:border-r-0">
      <span className="grid size-9 place-items-center rounded-xl bg-[#edf4ef] text-emerald-900">
        <Icon aria-hidden="true" className="size-4" />
      </span>
      <p className="mt-4 text-2xl font-black tracking-[-0.03em] text-stone-950">{value}</p>
      <p className="mt-1 text-xs font-extrabold uppercase tracking-[0.12em] text-stone-500">
        To {label}
      </p>
      <p className="mt-3 text-xs leading-5 text-stone-600">{detail}</p>
    </div>
  );
}

function openStreetMapEmbed(property: Property): string {
  const latOffset = 0.025;
  const lngOffset = 0.04;
  const left = property.longitude - lngOffset;
  const bottom = property.latitude - latOffset;
  const right = property.longitude + lngOffset;
  const top = property.latitude + latOffset;
  const bbox = `${left},${bottom},${right},${top}`;
  return `https://www.openstreetmap.org/export/embed.html?bbox=${encodeURIComponent(bbox)}&layer=mapnik&marker=${property.latitude}%2C${property.longitude}`;
}
