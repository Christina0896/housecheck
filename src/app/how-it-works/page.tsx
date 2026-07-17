import Link from "next/link";
import {
  ArrowRight,
  Bot,
  Database,
  FileSearch,
  LandPlot,
  MapPinned,
  Scale,
  ShieldCheck,
} from "lucide-react";

export const metadata = {
  title: "How it works",
  description: "How HouseCheck collects, structures and verifies property information.",
};

const steps = [
  {
    icon: FileSearch,
    number: "01",
    title: "Discover listings",
    copy: "A scheduled Playwright worker visits configured property-search pages, records new listing URLs and skips properties it has already seen.",
  },
  {
    icon: Bot,
    number: "02",
    title: "Extract hidden details",
    copy: "The parser reads the full description and features, then converts phrases such as ‘c. 4.7 acres’ into structured acreage and land-type fields.",
  },
  {
    icon: MapPinned,
    number: "03",
    title: "Check the surroundings",
    copy: "Coordinates are compared with OpenStreetMap data to estimate straight-line distance to lakes, coastline and mapped woodland.",
  },
  {
    icon: Database,
    number: "04",
    title: "Store and compare",
    copy: "Clean records are saved in PostgreSQL through Supabase, including first-seen dates, price changes, evidence levels and analysis results.",
  },
];

export default function HowItWorksPage() {
  return (
    <main className="flex-1">
      <section className="relative overflow-hidden border-b border-stone-200 bg-[#173f35] text-white">
        <div className="hero-grid absolute inset-0 opacity-20" />
        <div className="relative mx-auto max-w-5xl px-4 py-20 text-center sm:px-6 sm:py-28 lg:px-8">
          <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-[#f2c45b]">
            Data method
          </p>
          <h1 className="mt-5 text-balance text-4xl font-black leading-[1.02] tracking-[-0.055em] sm:text-6xl">
            From a long description to a useful property profile.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-pretty text-base leading-7 text-white/70 sm:text-lg sm:leading-8">
            HouseCheck keeps estate-agent claims separate from map-derived estimates, so every result shows where the information came from.
          </p>
        </div>
      </section>

      <section className="mx-auto w-full max-w-[1280px] px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
        <div className="grid gap-5 md:grid-cols-2">
          {steps.map(({ icon: Icon, number, title, copy }) => (
            <article
              className="rounded-[26px] border border-stone-200 bg-white p-6 shadow-sm sm:p-8"
              key={number}
            >
              <div className="flex items-center justify-between gap-4">
                <span className="grid size-11 place-items-center rounded-2xl bg-[#edf4ef] text-emerald-900">
                  <Icon aria-hidden="true" className="size-5" />
                </span>
                <span className="text-sm font-black tracking-[0.12em] text-stone-300">{number}</span>
              </div>
              <h2 className="mt-7 text-2xl font-black tracking-[-0.035em] text-stone-950">
                {title}
              </h2>
              <p className="mt-3 text-sm leading-7 text-stone-600">{copy}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="border-y border-stone-200 bg-[#f1f0e9]">
        <div className="mx-auto grid w-full max-w-[1280px] gap-8 px-4 py-14 sm:px-6 sm:py-20 lg:grid-cols-2 lg:px-8">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-emerald-800">
              Evidence, not certainty
            </p>
            <h2 className="mt-3 text-3xl font-black tracking-[-0.045em] text-stone-950 sm:text-4xl">
              Three levels make the source clear.
            </h2>
          </div>
          <div className="space-y-3">
            <EvidenceRow
              icon={MapPinned}
              label="Map checked"
              copy="Calculated from the listing coordinate and public map geometry."
            />
            <EvidenceRow
              icon={LandPlot}
              label="Agent stated"
              copy="Extracted from the listing wording, brochure or feature list."
            />
            <EvidenceRow
              icon={Scale}
              label="Estimated"
              copy="Useful for screening, but not confirmed by a legal boundary or site visit."
            />
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-[1280px] px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
        <div className="grid overflow-hidden rounded-[30px] border border-amber-200 bg-amber-50 lg:grid-cols-[auto_1fr_auto] lg:items-center">
          <div className="p-6 pb-0 lg:p-8">
            <span className="grid size-12 place-items-center rounded-2xl bg-white text-amber-900 shadow-sm">
              <ShieldCheck aria-hidden="true" className="size-5" />
            </span>
          </div>
          <div className="p-6 lg:p-8">
            <h2 className="text-xl font-black text-amber-950">Legal and technical limits</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-amber-950/75">
              A map pin cannot prove a property boundary, lake frontage, right of way or ownership of nearby woodland. Automated collection must also respect each source website’s terms, robots rules and rate limits. The included worker is deliberately configurable and rate-limited.
            </p>
          </div>
          <div className="p-6 pt-0 lg:p-8">
            <Link
              className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#173f35] px-4 text-sm font-extrabold text-white"
              href="/"
            >
              Explore demo
              <ArrowRight aria-hidden="true" className="size-4" />
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

function EvidenceRow({
  icon: Icon,
  label,
  copy,
}: {
  icon: typeof MapPinned;
  label: string;
  copy: string;
}) {
  return (
    <div className="flex items-start gap-4 rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
      <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-[#edf4ef] text-emerald-900">
        <Icon aria-hidden="true" className="size-4" />
      </span>
      <div>
        <p className="font-black text-stone-950">{label}</p>
        <p className="mt-1 text-sm leading-6 text-stone-600">{copy}</p>
      </div>
    </div>
  );
}
