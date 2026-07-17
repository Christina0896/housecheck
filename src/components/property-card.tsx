import Image from "next/image";
import Link from "next/link";
import {
  Bath,
  BedDouble,
  Building2,
  Check,
  ChevronRight,
  Compass,
  MapPin,
  Ruler,
  Sparkles,
  Trees,
  Waves,
} from "lucide-react";
import { EvidenceBadge } from "@/components/evidence-badge";
import { formatCurrency, formatDistance } from "@/lib/format";
import type { Property } from "@/lib/types";

function SettingIcon({ label }: { label: string }) {
  if (label.toLowerCase().includes("forest")) {
    return <Trees aria-hidden="true" className="size-3.5" />;
  }
  if (
    label.toLowerCase().includes("lake") ||
    label.toLowerCase().includes("coast") ||
    label.toLowerCase().includes("sea") ||
    label.toLowerCase().includes("river")
  ) {
    return <Waves aria-hidden="true" className="size-3.5" />;
  }
  return <Compass aria-hidden="true" className="size-3.5" />;
}

export function PropertyCard({
  property,
  selected,
  onToggleCompare,
}: {
  property: Property;
  selected: boolean;
  onToggleCompare: (propertyId: string) => void;
}) {
  return (
    <article className="group flex min-w-0 flex-col overflow-hidden rounded-[24px] border border-stone-200 bg-white shadow-[0_1px_2px_rgba(30,41,35,0.04),0_16px_40px_rgba(30,41,35,0.06)] transition duration-300 hover:-translate-y-1 hover:border-stone-300 hover:shadow-[0_4px_8px_rgba(30,41,35,0.05),0_24px_55px_rgba(30,41,35,0.10)]">
      <div className="relative aspect-[16/10] overflow-hidden bg-stone-200">
        <Image
          alt={`${property.title}, ${property.locality}`}
          className="object-cover transition duration-700 group-hover:scale-[1.035]"
          fill
          priority={property.matchScore > 90}
          sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
          src={property.imageUrl}
        />
        <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-3 p-4">
          <div className="flex flex-wrap gap-2">
            {property.isNew ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1.5 text-[11px] font-extrabold uppercase tracking-[0.08em] text-emerald-900 shadow-sm backdrop-blur">
                <Sparkles aria-hidden="true" className="size-3" />
                New
              </span>
            ) : null}
            {property.priceChanged ? (
              <span className="rounded-full bg-[#fff1ce]/95 px-2.5 py-1.5 text-[11px] font-extrabold uppercase tracking-[0.08em] text-amber-950 shadow-sm backdrop-blur">
                Price changed
              </span>
            ) : null}
          </div>
          <span className="rounded-full bg-[#173f35]/95 px-3 py-1.5 text-xs font-extrabold text-white shadow-sm backdrop-blur">
            {property.matchScore}% match
          </span>
        </div>
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/65 via-black/20 to-transparent px-4 pb-4 pt-12 text-white">
          <p className="text-[26px] font-black tracking-[-0.04em]">
            {formatCurrency(property.price)}
          </p>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 className="truncate text-xl font-extrabold tracking-[-0.03em] text-stone-950">
              {property.title}
            </h2>
            <p className="mt-1 flex items-center gap-1.5 text-sm text-stone-600">
              <MapPin aria-hidden="true" className="size-3.5 shrink-0" />
              {property.locality}, Co. {property.county}
            </p>
          </div>
          <div className="shrink-0 rounded-2xl bg-[#eef4ed] px-3 py-2 text-right ring-1 ring-emerald-900/10">
            <p className="text-lg font-black tracking-[-0.03em] text-emerald-950">
              {property.landAcres === null ? "—" : property.landAcres.toFixed(1)}
            </p>
            <p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-emerald-800">
              acres
            </p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 border-y border-stone-100 py-3 text-xs font-semibold text-stone-700">
          <span className="inline-flex items-center gap-1.5">
            <BedDouble aria-hidden="true" className="size-4 text-stone-500" />
            {property.bedrooms} beds
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Bath aria-hidden="true" className="size-4 text-stone-500" />
            {property.bathrooms} baths
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Ruler aria-hidden="true" className="size-4 text-stone-500" />
            {property.floorAreaSqm ? `${property.floorAreaSqm} m²` : "Area unknown"}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Building2 aria-hidden="true" className="size-4 text-stone-500" />
            BER {property.berRating ?? "—"}
          </span>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {property.settings.slice(0, 3).map((setting) => (
            <span
              className="inline-flex items-center gap-1.5 rounded-full bg-stone-100 px-2.5 py-1.5 text-xs font-bold text-stone-800"
              key={`${property.id}-${setting.label}`}
              title={setting.detail}
            >
              <SettingIcon label={setting.label} />
              {setting.label}
              {setting.detail ? (
                <span className="font-medium text-stone-500">· {setting.detail}</span>
              ) : null}
            </span>
          ))}
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2 rounded-2xl bg-[#f8f7f2] p-3 text-center">
          <DistanceMetric label="Lake" value={property.distances.lakeKm} />
          <DistanceMetric label="Coast" value={property.distances.coastKm} />
          <DistanceMetric label="Forest" value={property.distances.forestKm} />
        </div>

        <div className="mt-4 flex items-center justify-between gap-3">
          <EvidenceBadge level={property.landEvidence} />
          <span className="truncate text-[11px] font-medium text-stone-500">
            Land size source
          </span>
        </div>

        <div className="mt-5 flex gap-2">
          <button
            aria-pressed={selected}
            className={`inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl border px-3 text-sm font-extrabold transition ${
              selected
                ? "border-[#173f35] bg-[#173f35] text-white"
                : "border-stone-200 bg-white text-stone-800 hover:border-stone-400 hover:bg-stone-50"
            }`}
            onClick={() => onToggleCompare(property.id)}
            type="button"
          >
            <span
              className={`grid size-4 place-items-center rounded border ${
                selected ? "border-white/50 bg-white/15" : "border-stone-400"
              }`}
            >
              {selected ? <Check aria-hidden="true" className="size-3" /> : null}
            </span>
            Compare
          </button>
          <Link
            className="inline-flex h-11 flex-[1.3] items-center justify-center gap-1 rounded-xl bg-[#f2c45b] px-3 text-sm font-extrabold text-[#2f280f] transition hover:bg-[#e8b84b]"
            href={`/property/${property.slug}`}
          >
            View analysis
            <ChevronRight aria-hidden="true" className="size-4" />
          </Link>
        </div>
      </div>
    </article>
  );
}

function DistanceMetric({ label, value }: { label: string; value: number | null }) {
  return (
    <div>
      <p className="text-sm font-extrabold text-stone-900">{formatDistance(value)}</p>
      <p className="mt-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-stone-500">
        {label}
      </p>
    </div>
  );
}
