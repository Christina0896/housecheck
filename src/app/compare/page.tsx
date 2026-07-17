import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  LandPlot,
  MapPin,
  Scale,
  Trees,
  Waves,
} from "lucide-react";
import { EvidenceBadge } from "@/components/evidence-badge";
import { formatCurrency, formatDistance } from "@/lib/format";
import { getProperties } from "@/lib/property-data";
import { getPublicImageUrls } from "@/lib/property-public";
import type { Property } from "@/lib/types";

export const metadata = {
  title: "Compare properties",
  description: "Compare shortlisted homes by price, acreage and setting.",
};

export default async function ComparePage({
  searchParams,
}: {
  searchParams: Promise<{ ids?: string }>;
}) {
  const { ids = "" } = await searchParams;
  const selectedIds = ids.split(",").filter(Boolean).slice(0, 4);
  const allProperties = await getProperties();
  const properties = selectedIds
    .map((id) => allProperties.find((property) => property.id === id))
    .filter((property): property is Property => Boolean(property));

  return (
    <main className="mx-auto w-full max-w-[1480px] flex-1 px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
      <Link
        className="inline-flex items-center gap-2 text-sm font-extrabold text-stone-600 transition hover:text-emerald-900"
        href="/"
      >
        <ArrowLeft aria-hidden="true" className="size-4" />
        Back to search
      </Link>

      <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-emerald-800">
            Shortlist
          </p>
          <h1 className="mt-2 text-4xl font-black tracking-[-0.05em] text-stone-950 sm:text-5xl">
            Compare homes
          </h1>
          <p className="mt-3 text-sm leading-6 text-stone-600">
            Compare the details that are normally buried inside listing descriptions.
          </p>
        </div>
        <span className="inline-flex self-start items-center gap-2 rounded-full bg-[#edf4ef] px-3 py-2 text-xs font-extrabold text-emerald-950 ring-1 ring-inset ring-emerald-800/10">
          <Scale aria-hidden="true" className="size-4" />
          {properties.length} selected
        </span>
      </div>

      {properties.length < 2 ? (
        <section className="mt-8 grid min-h-[420px] place-items-center rounded-[28px] border border-dashed border-stone-300 bg-white p-8 text-center">
          <div>
            <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-stone-100 text-stone-600">
              <Scale aria-hidden="true" className="size-6" />
            </span>
            <h2 className="mt-4 text-xl font-black text-stone-950">
              Select at least two homes
            </h2>
            <p className="mt-2 text-sm leading-6 text-stone-600">
              Return to the search page and mark two to four properties for comparison.
            </p>
            <Link
              className="mt-5 inline-flex rounded-xl bg-[#173f35] px-4 py-2.5 text-sm font-extrabold text-white"
              href="/"
            >
              Browse properties
            </Link>
          </div>
        </section>
      ) : (
        <section className="mt-8 overflow-x-auto rounded-[28px] border border-stone-200 bg-white shadow-[0_18px_60px_rgba(31,45,39,0.07)]">
          <table className="data-table min-w-[900px] w-full table-fixed">
            <thead>
              <tr>
                <th className="w-44 bg-[#f8f7f2] text-xs font-extrabold uppercase tracking-[0.12em] text-stone-500">
                  Property
                </th>
                {properties.map((property) => (
                  <th key={property.id} className="min-w-56 p-0">
                    <Link className="group block" href={`/property/${property.slug}`}>
                      <div className="relative aspect-[4/3] overflow-hidden bg-stone-200">
                        <Image
                          alt={property.title}
                          className="object-cover transition duration-500 group-hover:scale-[1.03]"
                          fill
                          sizes="300px"
                          src={getPublicImageUrls(property)[0]}
                        />
                        <span className="absolute right-3 top-3 rounded-full bg-[#173f35]/95 px-2.5 py-1 text-[11px] font-extrabold text-white">
                          {property.matchScore}% match
                        </span>
                      </div>
                      <div className="p-4">
                        <p className="text-lg font-black tracking-[-0.025em] text-stone-950">
                          {property.title}
                        </p>
                        <p className="mt-1 flex items-center gap-1 text-xs font-semibold text-stone-500">
                          <MapPin aria-hidden="true" className="size-3" />
                          {property.locality}, {property.county}
                        </p>
                      </div>
                    </Link>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <CompareRow label="Asking price">
                {properties.map((property) => (
                  <CompareCell key={property.id} emphasis>
                    {formatCurrency(property.price)}
                  </CompareCell>
                ))}
              </CompareRow>
              <CompareRow label="Eircode">
                {properties.map((property) => (
                  <CompareCell key={property.id}>
                    <p className="font-extrabold text-stone-900">
                      {property.eircode ?? "Not supplied"}
                    </p>
                  </CompareCell>
                ))}
              </CompareRow>
              <CompareRow icon={LandPlot} label="Land size">
                {properties.map((property) => (
                  <CompareCell key={property.id}>
                    <p className="text-lg font-black text-emerald-950">
                      {property.landAcres?.toFixed(1) ?? "—"} acres
                    </p>
                    <div className="mt-2">
                      <EvidenceBadge level={property.landEvidence} />
                    </div>
                  </CompareCell>
                ))}
              </CompareRow>
              <CompareRow label="House">
                {properties.map((property) => (
                  <CompareCell key={property.id}>
                    <p className="font-extrabold text-stone-900">
                      {property.bedrooms} beds · {property.bathrooms} baths
                    </p>
                    <p className="mt-1 text-xs text-stone-500">
                      {property.floorAreaSqm ? `${property.floorAreaSqm} m²` : "Area unknown"} · BER {property.berRating ?? "—"}
                    </p>
                  </CompareCell>
                ))}
              </CompareRow>
              <CompareRow icon={Waves} label="Nearest lake">
                {properties.map((property) => (
                  <CompareCell key={property.id}>
                    <p className="font-extrabold text-stone-900">
                      {formatDistance(property.distances.lakeKm)}
                    </p>
                    <p className="mt-1 text-xs text-stone-500">
                      {property.nearestLake ?? "Mapped water"}
                    </p>
                  </CompareCell>
                ))}
              </CompareRow>
              <CompareRow icon={Waves} label="Coastline">
                {properties.map((property) => (
                  <CompareCell key={property.id}>
                    <p className="font-extrabold text-stone-900">
                      {formatDistance(property.distances.coastKm)}
                    </p>
                  </CompareCell>
                ))}
              </CompareRow>
              <CompareRow icon={Trees} label="Woodland">
                {properties.map((property) => (
                  <CompareCell key={property.id}>
                    <p className="font-extrabold text-stone-900">
                      {formatDistance(property.distances.forestKm)}
                    </p>
                    <p className="mt-1 text-xs text-stone-500">
                      {property.nearestForest ?? "Mapped woodland"}
                    </p>
                  </CompareCell>
                ))}
              </CompareRow>
              <CompareRow label="Setting tags">
                {properties.map((property) => (
                  <CompareCell key={property.id}>
                    <div className="flex flex-wrap gap-1.5">
                      {property.settings.map((setting) => (
                        <span
                          className="rounded-full bg-stone-100 px-2 py-1 text-[11px] font-bold text-stone-700"
                          key={setting.label}
                        >
                          {setting.label}
                        </span>
                      ))}
                    </div>
                  </CompareCell>
                ))}
              </CompareRow>
              <CompareRow label="Notable features">
                {properties.map((property) => (
                  <CompareCell key={property.id}>
                    <ul className="space-y-2">
                      {property.features.slice(0, 4).map((feature) => (
                        <li className="flex items-start gap-2 text-xs leading-5 text-stone-700" key={feature}>
                          <CheckCircle2
                            aria-hidden="true"
                            className="mt-0.5 size-3.5 shrink-0 text-emerald-700"
                          />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </CompareCell>
                ))}
              </CompareRow>
              <tr>
                <th className="bg-[#f8f7f2]" />
                {properties.map((property) => (
                  <td key={property.id} className="p-4">
                    <Link
                      className="inline-flex h-10 w-full items-center justify-center rounded-xl bg-[#173f35] text-sm font-extrabold text-white transition hover:bg-[#0f3027]"
                      href={`/property/${property.slug}`}
                    >
                      Open analysis
                    </Link>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </section>
      )}
    </main>
  );
}

function CompareRow({
  icon: Icon,
  label,
  children,
}: {
  icon?: typeof LandPlot;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <tr>
      <th className="bg-[#f8f7f2] text-xs font-extrabold uppercase tracking-[0.1em] text-stone-600">
        <span className="flex items-center gap-2">
          {Icon ? <Icon aria-hidden="true" className="size-4 text-emerald-800" /> : null}
          {label}
        </span>
      </th>
      {children}
    </tr>
  );
}

function CompareCell({
  children,
  emphasis = false,
}: {
  children: React.ReactNode;
  emphasis?: boolean;
}) {
  return (
    <td className={emphasis ? "text-lg font-black text-[#173f35]" : "text-sm"}>
      {children}
    </td>
  );
}
