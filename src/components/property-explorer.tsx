"use client";

import Link from "next/link";
import {
  ArrowDownUp,
  BarChart3,
  ChevronDown,
  Filter,
  House,
  LandPlot,
  MapPinned,
  Search,
  Sparkles,
  Trees,
  Waves,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { PropertyCard } from "@/components/property-card";
import { formatCurrency } from "@/lib/format";
import type { Property, SettingLabel } from "@/lib/types";

const settingOptions: Array<{ label: SettingLabel; icon: typeof Waves }> = [
  { label: "Lakeside", icon: Waves },
  { label: "Near lake", icon: Waves },
  { label: "Seaside", icon: Waves },
  { label: "Near coast", icon: Waves },
  { label: "Forest edge", icon: Trees },
  { label: "Near forest", icon: Trees },
];

type SortOption = "match" | "price-low" | "price-high" | "land-high" | "newest";

export function PropertyExplorer({ properties }: { properties: Property[] }) {
  const [query, setQuery] = useState("");
  const [county, setCounty] = useState("All counties");
  const [maxPrice, setMaxPrice] = useState("600000");
  const [minAcres, setMinAcres] = useState("0");
  const [selectedSettings, setSelectedSettings] = useState<SettingLabel[]>([]);
  const [maxLakeKm, setMaxLakeKm] = useState("");
  const [maxCoastKm, setMaxCoastKm] = useState("");
  const [maxForestKm, setMaxForestKm] = useState("");
  const [sort, setSort] = useState<SortOption>("match");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [comparisonStorageReady, setComparisonStorageReady] = useState(false);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      const saved = window.localStorage.getItem("housecheck-compare");
      if (saved) {
        try {
          const ids = JSON.parse(saved) as string[];
          setSelectedIds(
            ids.filter((id) => properties.some((item) => item.id === id)),
          );
        } catch {
          window.localStorage.removeItem("housecheck-compare");
        }
      }
      setComparisonStorageReady(true);
    }, 0);

    return () => window.clearTimeout(timeout);
  }, [properties]);

  useEffect(() => {
    if (!comparisonStorageReady) return;
    window.localStorage.setItem("housecheck-compare", JSON.stringify(selectedIds));
  }, [comparisonStorageReady, selectedIds]);

  const counties = useMemo(
    () => Array.from(new Set(properties.map((item) => item.county))).sort(),
    [properties],
  );

  const filteredProperties = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const result = properties.filter((property) => {
      const searchMatch =
        !normalizedQuery ||
        [
          property.title,
          property.address,
          property.locality,
          property.county,
          property.summary,
          property.features.join(" "),
        ]
          .join(" ")
          .toLowerCase()
          .includes(normalizedQuery);
      const countyMatch = county === "All counties" || property.county === county;
      const priceMatch = property.price <= Number(maxPrice || Number.MAX_SAFE_INTEGER);
      const acreageMatch = (property.landAcres ?? 0) >= Number(minAcres || 0);
      const settingMatch =
        selectedSettings.length === 0 ||
        selectedSettings.some((selected) =>
          property.settings.some((setting) => setting.label === selected),
        );
      const lakeMatch = distanceMatches(property.distances.lakeKm, maxLakeKm);
      const coastMatch = distanceMatches(property.distances.coastKm, maxCoastKm);
      const forestMatch = distanceMatches(property.distances.forestKm, maxForestKm);

      return (
        searchMatch &&
        countyMatch &&
        priceMatch &&
        acreageMatch &&
        settingMatch &&
        lakeMatch &&
        coastMatch &&
        forestMatch
      );
    });

    return result.sort((a, b) => {
      switch (sort) {
        case "price-low":
          return a.price - b.price;
        case "price-high":
          return b.price - a.price;
        case "land-high":
          return (b.landAcres ?? 0) - (a.landAcres ?? 0);
        case "newest":
          return b.firstSeen.localeCompare(a.firstSeen);
        default:
          return b.matchScore - a.matchScore;
      }
    });
  }, [
    properties,
    query,
    county,
    maxPrice,
    minAcres,
    selectedSettings,
    maxLakeKm,
    maxCoastKm,
    maxForestKm,
    sort,
  ]);

  const activeFilterCount =
    Number(county !== "All counties") +
    Number(maxPrice !== "600000") +
    Number(minAcres !== "0") +
    selectedSettings.length +
    Number(Boolean(maxLakeKm)) +
    Number(Boolean(maxCoastKm)) +
    Number(Boolean(maxForestKm));

  const toggleSetting = (setting: SettingLabel) => {
    setSelectedSettings((current) =>
      current.includes(setting)
        ? current.filter((item) => item !== setting)
        : [...current, setting],
    );
  };

  const toggleCompare = (propertyId: string) => {
    setSelectedIds((current) => {
      if (current.includes(propertyId)) {
        return current.filter((id) => id !== propertyId);
      }
      if (current.length >= 4) return current;
      return [...current, propertyId];
    });
  };

  const clearFilters = () => {
    setQuery("");
    setCounty("All counties");
    setMaxPrice("600000");
    setMinAcres("0");
    setSelectedSettings([]);
    setMaxLakeKm("");
    setMaxCoastKm("");
    setMaxForestKm("");
  };

  return (
    <>
      <section className="relative overflow-hidden border-b border-stone-200 bg-[#f8f7f2]">
        <div className="hero-grid absolute inset-0 opacity-50" />
        <div className="absolute -right-24 top-10 size-[420px] rounded-full bg-[#d9eadf]/65 blur-3xl" />
        <div className="absolute -left-32 bottom-[-220px] size-[440px] rounded-full bg-[#f8d98e]/55 blur-3xl" />
        <div className="relative mx-auto grid w-full max-w-[1480px] gap-10 px-4 py-12 sm:px-6 sm:py-16 lg:grid-cols-[1.2fr_0.8fr] lg:items-end lg:px-8 lg:py-20">
          <div>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-emerald-900/10 bg-white/80 px-3 py-1.5 text-xs font-extrabold uppercase tracking-[0.1em] text-emerald-900 shadow-sm backdrop-blur">
              <Sparkles aria-hidden="true" className="size-3.5" />
              Acreage and surroundings, visible immediately
            </div>
            <h1 className="max-w-4xl text-balance text-4xl font-black leading-[0.98] tracking-[-0.055em] text-[#162c25] sm:text-6xl lg:text-[72px]">
              Find the house.
              <br />
              <span className="text-[#477363]">Understand the land.</span>
            </h1>
            <p className="mt-6 max-w-2xl text-pretty text-base leading-7 text-stone-600 sm:text-lg sm:leading-8">
              HouseCheck reads listing descriptions, exposes acreage, and measures
              distance to lakes, coastline and woodland before you open every listing.
            </p>
          </div>

          <div className="rounded-[28px] border border-white/80 bg-white/75 p-4 shadow-[0_24px_80px_rgba(38,58,49,0.11)] backdrop-blur-xl sm:p-5">
            <div className="grid grid-cols-2 gap-3">
              <HeroMetric
                icon={House}
                label="Listings analysed"
                value={String(properties.length)}
              />
              <HeroMetric
                icon={LandPlot}
                label="With acreage found"
                value={String(properties.filter((item) => item.landAcres !== null).length)}
              />
              <HeroMetric
                icon={Waves}
                label="Near water"
                value={String(
                  properties.filter((item) =>
                    item.settings.some((setting) =>
                      ["Lakeside", "Near lake", "Seaside", "Near coast"].includes(
                        setting.label,
                      ),
                    ),
                  ).length,
                )}
              />
              <HeroMetric
                icon={MapPinned}
                label="New this week"
                value={String(properties.filter((item) => item.isNew).length)}
              />
            </div>
            <p className="mt-4 rounded-xl bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-950 ring-1 ring-amber-900/10">
              <strong>Demo mode:</strong> sample records are shown until Supabase and the
              scheduled scraper are connected.
            </p>
          </div>
        </div>
      </section>

      <main className="mx-auto w-full max-w-[1480px] flex-1 px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        <div className="mb-6 flex items-center gap-3 rounded-2xl border border-stone-200 bg-white p-3 shadow-sm lg:hidden">
          <div className="relative flex-1">
            <Search
              aria-hidden="true"
              className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-stone-500"
            />
            <input
              className="h-11 w-full rounded-xl border border-stone-200 bg-stone-50 pl-10 pr-3 text-sm outline-none transition focus:border-emerald-700 focus:bg-white focus:ring-3 focus:ring-emerald-700/10"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search place or feature"
              value={query}
            />
          </div>
          <button
            className="relative inline-flex size-11 items-center justify-center rounded-xl bg-[#173f35] text-white"
            onClick={() => setMobileFiltersOpen((open) => !open)}
            type="button"
          >
            <Filter aria-hidden="true" className="size-5" />
            {activeFilterCount ? (
              <span className="absolute -right-1.5 -top-1.5 grid size-5 place-items-center rounded-full bg-[#f2c45b] text-[10px] font-black text-stone-900">
                {activeFilterCount}
              </span>
            ) : null}
          </button>
        </div>

        <div className="grid items-start gap-7 lg:grid-cols-[280px_minmax(0,1fr)] xl:grid-cols-[300px_minmax(0,1fr)]">
          <aside
            className={`${mobileFiltersOpen ? "block" : "hidden"} rounded-[24px] border border-stone-200 bg-white p-5 shadow-sm lg:sticky lg:top-24 lg:block`}
          >
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-stone-500">
                  Refine results
                </p>
                <h2 className="mt-1 text-xl font-black tracking-[-0.03em] text-stone-950">
                  Filters
                </h2>
              </div>
              {activeFilterCount ? (
                <button
                  className="text-xs font-extrabold text-emerald-800 hover:text-emerald-950"
                  onClick={clearFilters}
                  type="button"
                >
                  Clear all
                </button>
              ) : null}
            </div>

            <div className="mt-5 hidden lg:block">
              <label className="filter-label" htmlFor="desktop-search">
                Search
              </label>
              <div className="relative mt-2">
                <Search
                  aria-hidden="true"
                  className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-stone-500"
                />
                <input
                  className="filter-input pl-10"
                  id="desktop-search"
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Town, county, feature"
                  value={query}
                />
              </div>
            </div>

            <FilterSelect
              label="County"
              onChange={setCounty}
              options={["All counties", ...counties]}
              value={county}
            />

            <FilterSelect
              label="Maximum price"
              onChange={setMaxPrice}
              options={[
                ["350000", "€350,000"],
                ["400000", "€400,000"],
                ["450000", "€450,000"],
                ["500000", "€500,000"],
                ["600000", "€600,000"],
                ["750000", "€750,000"],
              ]}
              value={maxPrice}
            />

            <FilterSelect
              label="Minimum land"
              onChange={setMinAcres}
              options={[
                ["0", "Any acreage"],
                ["0.5", "0.5+ acre"],
                ["1", "1+ acre"],
                ["2", "2+ acres"],
                ["3", "3+ acres"],
                ["5", "5+ acres"],
              ]}
              value={minAcres}
            />

            <fieldset className="mt-6 border-t border-stone-100 pt-5">
              <legend className="filter-label">Setting</legend>
              <div className="mt-3 grid grid-cols-2 gap-2">
                {settingOptions.map(({ label, icon: Icon }) => {
                  const active = selectedSettings.includes(label);
                  return (
                    <button
                      aria-pressed={active}
                      className={`flex min-h-11 items-center gap-2 rounded-xl border px-3 text-left text-xs font-bold transition ${
                        active
                          ? "border-emerald-800 bg-emerald-50 text-emerald-950"
                          : "border-stone-200 bg-white text-stone-700 hover:border-stone-300"
                      }`}
                      key={label}
                      onClick={() => toggleSetting(label)}
                      type="button"
                    >
                      <Icon aria-hidden="true" className="size-4 shrink-0" />
                      {label}
                    </button>
                  );
                })}
              </div>
            </fieldset>

            <div className="mt-6 border-t border-stone-100 pt-5">
              <p className="filter-label">Maximum distance</p>
              <div className="mt-3 space-y-3">
                <CompactDistanceSelect
                  label="Lake"
                  onChange={setMaxLakeKm}
                  value={maxLakeKm}
                />
                <CompactDistanceSelect
                  label="Coast"
                  onChange={setMaxCoastKm}
                  value={maxCoastKm}
                />
                <CompactDistanceSelect
                  label="Forest"
                  onChange={setMaxForestKm}
                  value={maxForestKm}
                />
              </div>
            </div>

            <button
              className="mt-6 inline-flex h-11 w-full items-center justify-center rounded-xl bg-[#173f35] text-sm font-extrabold text-white lg:hidden"
              onClick={() => setMobileFiltersOpen(false)}
              type="button"
            >
              Show {filteredProperties.length} results
            </button>
          </aside>

          <section className="min-w-0">
            <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-emerald-800">
                  Analysed properties
                </p>
                <h2 className="mt-1 text-3xl font-black tracking-[-0.04em] text-stone-950">
                  {filteredProperties.length} matching homes
                </h2>
                <p className="mt-1 text-sm text-stone-600">
                  Acreage is visible on every card. Map distances are straight-line estimates.
                </p>
              </div>

              <label className="relative inline-flex items-center gap-2 self-start sm:self-auto">
                <ArrowDownUp aria-hidden="true" className="size-4 text-stone-500" />
                <span className="sr-only">Sort properties</span>
                <select
                  className="h-10 appearance-none rounded-xl border border-stone-200 bg-white py-0 pl-3 pr-9 text-sm font-bold text-stone-800 outline-none focus:border-emerald-700 focus:ring-3 focus:ring-emerald-700/10"
                  onChange={(event) => setSort(event.target.value as SortOption)}
                  value={sort}
                >
                  <option value="match">Best match</option>
                  <option value="price-low">Price: low to high</option>
                  <option value="price-high">Price: high to low</option>
                  <option value="land-high">Most land</option>
                  <option value="newest">Newest first</option>
                </select>
                <ChevronDown
                  aria-hidden="true"
                  className="pointer-events-none absolute right-3 size-4 text-stone-500"
                />
              </label>
            </div>

            {activeFilterCount ? (
              <div className="mb-5 flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold text-stone-500">Active:</span>
                {county !== "All counties" ? (
                  <ActiveFilter label={county} onRemove={() => setCounty("All counties")} />
                ) : null}
                {minAcres !== "0" ? (
                  <ActiveFilter
                    label={`${minAcres}+ acres`}
                    onRemove={() => setMinAcres("0")}
                  />
                ) : null}
                {maxPrice !== "600000" ? (
                  <ActiveFilter
                    label={`Under ${formatCurrency(Number(maxPrice))}`}
                    onRemove={() => setMaxPrice("600000")}
                  />
                ) : null}
                {selectedSettings.map((setting) => (
                  <ActiveFilter
                    key={setting}
                    label={setting}
                    onRemove={() => toggleSetting(setting)}
                  />
                ))}
              </div>
            ) : null}

            {filteredProperties.length ? (
              <div className="grid gap-5 md:grid-cols-2 2xl:grid-cols-3">
                {filteredProperties.map((property) => (
                  <PropertyCard
                    key={property.id}
                    onToggleCompare={toggleCompare}
                    property={property}
                    selected={selectedIds.includes(property.id)}
                  />
                ))}
              </div>
            ) : (
              <div className="grid min-h-[420px] place-items-center rounded-[28px] border border-dashed border-stone-300 bg-white p-8 text-center">
                <div>
                  <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-stone-100 text-stone-600">
                    <Search aria-hidden="true" className="size-6" />
                  </span>
                  <h3 className="mt-4 text-xl font-black text-stone-950">
                    No properties match
                  </h3>
                  <p className="mt-2 max-w-sm text-sm leading-6 text-stone-600">
                    Increase the price or distance, or remove one of the setting filters.
                  </p>
                  <button
                    className="mt-5 rounded-xl bg-[#173f35] px-4 py-2.5 text-sm font-extrabold text-white"
                    onClick={clearFilters}
                    type="button"
                  >
                    Reset filters
                  </button>
                </div>
              </div>
            )}
          </section>
        </div>
      </main>

      {selectedIds.length ? (
        <div className="fixed inset-x-0 bottom-4 z-50 mx-auto w-[calc(100%-2rem)] max-w-xl rounded-2xl border border-white/20 bg-[#102f27]/95 p-3 text-white shadow-[0_24px_70px_rgba(15,35,29,0.35)] backdrop-blur-xl sm:bottom-6">
          <div className="flex items-center gap-3">
            <div className="hidden size-10 place-items-center rounded-xl bg-white/10 sm:grid">
              <BarChart3 aria-hidden="true" className="size-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-extrabold">
                {selectedIds.length} {selectedIds.length === 1 ? "home" : "homes"} selected
              </p>
              <p className="truncate text-xs text-white/65">
                Choose up to four properties for a side-by-side comparison.
              </p>
            </div>
            <button
              aria-label="Clear comparison"
              className="grid size-9 place-items-center rounded-lg text-white/70 transition hover:bg-white/10 hover:text-white"
              onClick={() => setSelectedIds([])}
              type="button"
            >
              <X aria-hidden="true" className="size-4" />
            </button>
            <Link
              className={`inline-flex h-10 items-center rounded-xl px-4 text-sm font-extrabold transition ${
                selectedIds.length < 2
                  ? "pointer-events-none bg-white/10 text-white/40"
                  : "bg-[#f2c45b] text-[#2f280f] hover:bg-[#e8b84b]"
              }`}
              href={`/compare?ids=${selectedIds.join(",")}`}
              aria-disabled={selectedIds.length < 2}
            >
              Compare
            </Link>
          </div>
        </div>
      ) : null}
    </>
  );
}

function distanceMatches(value: number | null, maximum: string): boolean {
  if (!maximum) return true;
  return value !== null && value <= Number(maximum);
}

function HeroMetric({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof House;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-stone-200/70 bg-white/90 p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <p className="text-3xl font-black tracking-[-0.04em] text-[#173f35]">{value}</p>
        <span className="grid size-8 place-items-center rounded-xl bg-[#edf4ef] text-emerald-800">
          <Icon aria-hidden="true" className="size-4" />
        </span>
      </div>
      <p className="mt-2 text-xs font-bold text-stone-600">{label}</p>
    </div>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<string | [string, string]>;
}) {
  const id = label.toLowerCase().replace(/\s+/g, "-");
  return (
    <div className="mt-5">
      <label className="filter-label" htmlFor={id}>
        {label}
      </label>
      <div className="relative mt-2">
        <select
          className="filter-input appearance-none pr-9"
          id={id}
          onChange={(event) => onChange(event.target.value)}
          value={value}
        >
          {options.map((option) => {
            const [optionValue, optionLabel] = Array.isArray(option)
              ? option
              : [option, option];
            return (
              <option key={optionValue} value={optionValue}>
                {optionLabel}
              </option>
            );
          })}
        </select>
        <ChevronDown
          aria-hidden="true"
          className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-stone-500"
        />
      </div>
    </div>
  );
}

function CompactDistanceSelect({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="flex items-center justify-between gap-3 text-xs font-bold text-stone-700">
      <span>{label}</span>
      <select
        className="h-9 min-w-32 rounded-lg border border-stone-200 bg-white px-2 text-xs font-bold outline-none focus:border-emerald-700"
        onChange={(event) => onChange(event.target.value)}
        value={value}
      >
        <option value="">Any distance</option>
        <option value="0.25">Under 250 m</option>
        <option value="0.5">Under 500 m</option>
        <option value="1">Under 1 km</option>
        <option value="3">Under 3 km</option>
        <option value="5">Under 5 km</option>
      </select>
    </label>
  );
}

function ActiveFilter({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <button
      className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1.5 text-xs font-bold text-emerald-950 ring-1 ring-inset ring-emerald-800/10"
      onClick={onRemove}
      type="button"
    >
      {label}
      <X aria-hidden="true" className="size-3" />
    </button>
  );
}
