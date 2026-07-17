"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BadgeCheck,
  Check,
  Copyright,
  ExternalLink,
  FileImage,
  ImagePlus,
  LoaderCircle,
  LogOut,
  RefreshCw,
  RotateCcw,
  Save,
  Trash2,
  Trees,
  Upload,
  Waves,
  X,
} from "lucide-react";
import { useState } from "react";
import { EvidenceBadge } from "@/components/evidence-badge";
import { formatCurrency } from "@/lib/format";
import type {
  ReviewCounts,
  ReviewProperty,
  ReviewStatus,
  SettingLabel,
} from "@/lib/types";

const settingOptions: Array<{
  label: SettingLabel;
  description: string;
  icon: typeof Trees;
}> = [
  {
    label: "Woodland on property",
    description: "Trees or woodland are inside the red property boundary.",
    icon: Trees,
  },
  {
    label: "Forest edge",
    description: "The boundary touches forest outside the property.",
    icon: Trees,
  },
  {
    label: "Near forest",
    description: "Forest is nearby but does not touch the boundary.",
    icon: Trees,
  },
  {
    label: "River frontage",
    description: "The legal boundary directly meets a river.",
    icon: Waves,
  },
  {
    label: "Riverside",
    description: "The property is beside a river, but frontage is not confirmed.",
    icon: Waves,
  },
  {
    label: "Lakeside",
    description: "The property is directly beside a lake.",
    icon: Waves,
  },
  {
    label: "Near lake",
    description: "A lake is nearby without confirmed frontage.",
    icon: Waves,
  },
  {
    label: "Seaside",
    description: "The property is directly beside the sea or shore.",
    icon: Waves,
  },
  {
    label: "Near coast",
    description: "The coastline is nearby without confirmed frontage.",
    icon: Waves,
  },
  {
    label: "Countryside",
    description: "A rural setting outside a town or village centre.",
    icon: Trees,
  },
  {
    label: "Village",
    description: "Located in or immediately beside a village.",
    icon: Trees,
  },
];

const statusContent: Record<
  ReviewStatus,
  { label: string; emptyTitle: string; emptyDetail: string }
> = {
  pending: {
    label: "Pending",
    emptyTitle: "Review queue clear",
    emptyDetail: "New imports will remain hidden here until you approve them.",
  },
  approved: {
    label: "Approved",
    emptyTitle: "No approved properties",
    emptyDetail: "Approved properties will appear in the public HouseCheck search.",
  },
  rejected: {
    label: "Rejected",
    emptyTitle: "No rejected properties",
    emptyDetail: "Properties you reject will stay hidden in this section.",
  },
};

export function ReviewQueue({
  initialProperties,
  counts,
  status,
}: {
  initialProperties: ReviewProperty[];
  counts: ReviewCounts;
  status: ReviewStatus;
}) {
  const router = useRouter();
  const [properties, setProperties] = useState(initialProperties);
  const [refreshing, setRefreshing] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const refresh = () => {
    setRefreshing(true);
    router.refresh();
    window.setTimeout(() => setRefreshing(false), 700);
  };

  const logout = async () => {
    setLoggingOut(true);
    await fetch("/api/review/logout", { method: "POST" });
    router.refresh();
  };

  const removeProperty = (propertyId: string) => {
    setProperties((current) => current.filter((item) => item.id !== propertyId));
    router.refresh();
  };

  return (
    <main className="mx-auto w-full max-w-[1380px] flex-1 px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
      <section className="overflow-hidden rounded-[30px] bg-[#173f35] px-6 py-8 text-white shadow-[0_24px_70px_rgba(20,48,39,0.18)] sm:px-9 sm:py-10">
        <div className="flex flex-col gap-7 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-extrabold uppercase tracking-[0.12em] text-white/85 ring-1 ring-inset ring-white/15">
              <BadgeCheck aria-hidden="true" className="size-4" />
              Manual approval
            </div>
            <h1 className="mt-5 max-w-3xl text-4xl font-black tracking-[-0.05em] sm:text-5xl">
              Check the boundary before publishing.
            </h1>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-white/70 sm:text-base">
              New houses are private by default. Correct the acreage and setting,
              upload boundary evidence, then approve the listing for HouseCheck.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-white/10 px-3 text-xs font-extrabold text-white ring-1 ring-inset ring-white/15 hover:bg-white/15"
              onClick={refresh}
              type="button"
            >
              <RefreshCw
                aria-hidden="true"
                className={`size-4 ${refreshing ? "animate-spin" : ""}`}
              />
              Refresh
            </button>
            <button
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-white/10 px-3 text-xs font-extrabold text-white ring-1 ring-inset ring-white/15 hover:bg-white/15 disabled:opacity-60"
              disabled={loggingOut}
              onClick={() => void logout()}
              type="button"
            >
              {loggingOut ? (
                <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
              ) : (
                <LogOut aria-hidden="true" className="size-4" />
              )}
              Lock
            </button>
          </div>
        </div>
      </section>

      <nav
        aria-label="Review status"
        className="mt-6 flex flex-wrap gap-2 rounded-2xl border border-stone-200 bg-white p-2 shadow-sm"
      >
        {(Object.keys(statusContent) as ReviewStatus[]).map((itemStatus) => (
          <Link
            aria-current={itemStatus === status ? "page" : undefined}
            className={`inline-flex h-10 items-center gap-2 rounded-xl px-4 text-sm font-extrabold transition ${
              itemStatus === status
                ? "bg-[#173f35] text-white"
                : "text-stone-600 hover:bg-stone-100 hover:text-stone-950"
            }`}
            href={`/review?status=${itemStatus}`}
            key={itemStatus}
          >
            {statusContent[itemStatus].label}
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] ${
                itemStatus === status ? "bg-white/15" : "bg-stone-100"
              }`}
            >
              {counts[itemStatus]}
            </span>
          </Link>
        ))}
      </nav>

      <section className="mt-6 rounded-2xl border border-emerald-900/10 bg-[#edf4ef] p-5">
        <div className="flex items-start gap-3">
          <Trees aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-emerald-900" />
          <div>
            <h2 className="text-sm font-black text-emerald-950">
              The Toonlane image is “Woodland on property”
            </h2>
            <p className="mt-1 text-xs leading-5 text-emerald-950/75">
              The red boundary contains substantial woodland. “Forest edge” is only
              for a property that touches external forest, while “Near forest” means
              the forest is close but separate.
            </p>
          </div>
        </div>
      </section>

      {properties.length === 0 ? (
        <section className="mt-6 grid min-h-[360px] place-items-center rounded-[28px] border border-dashed border-stone-300 bg-white p-8 text-center">
          <div>
            <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-emerald-50 text-emerald-800">
              <BadgeCheck aria-hidden="true" className="size-6" />
            </span>
            <h2 className="mt-4 text-xl font-black text-stone-950">
              {statusContent[status].emptyTitle}
            </h2>
            <p className="mt-2 max-w-sm text-sm leading-6 text-stone-600">
              {statusContent[status].emptyDetail}
            </p>
          </div>
        </section>
      ) : (
        <div className="mt-6 space-y-6">
          {properties.map((property) => (
            <ReviewCard
              currentTab={status}
              key={property.id}
              onMove={removeProperty}
              property={property}
            />
          ))}
        </div>
      )}
    </main>
  );
}

function ReviewCard({
  property,
  currentTab,
  onMove,
}: {
  property: ReviewProperty;
  currentTab: ReviewStatus;
  onMove: (propertyId: string) => void;
}) {
  const router = useRouter();
  const [selectedLabels, setSelectedLabels] = useState<SettingLabel[]>(
    property.settings.map((setting) => setting.label),
  );
  const [landAcres, setLandAcres] = useState(
    property.landAcres === null ? "" : String(property.landAcres),
  );
  const [eircode, setEircode] = useState(property.eircode ?? "");
  const [description, setDescription] = useState(property.description);
  const [imageUrls, setImageUrls] = useState<string[]>(
    property.imageUrls.length > 0 ? property.imageUrls : [property.imageUrl],
  );
  const [contentRightsConfirmed, setContentRightsConfirmed] = useState(
    property.contentRightsConfirmed,
  );
  const [reviewNotes, setReviewNotes] = useState(property.reviewNotes);
  const [evidenceUrl, setEvidenceUrl] = useState(property.boundaryEvidenceUrl);
  const [uploading, setUploading] = useState(false);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [removingPhoto, setRemovingPhoto] = useState<string | null>(null);
  const [savingStatus, setSavingStatus] = useState<ReviewStatus | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const toggleSetting = (label: SettingLabel) => {
    setSelectedLabels((current) =>
      current.includes(label)
        ? current.filter((item) => item !== label)
        : [...current, label],
    );
  };

  const uploadEvidence = async (file: File) => {
    setUploading(true);
    setError("");
    setMessage("");

    try {
      const formData = new FormData();
      formData.set("file", file);
      const response = await fetch(
        `/api/review/properties/${encodeURIComponent(property.id)}/evidence`,
        { method: "POST", body: formData },
      );
      const body = (await response.json()) as {
        error?: string;
        signedUrl?: string | null;
      };
      if (!response.ok) throw new Error(body.error ?? "Could not upload image");
      setEvidenceUrl(body.signedUrl ?? null);
      setMessage("Boundary image uploaded privately.");
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not upload image");
    } finally {
      setUploading(false);
    }
  };


  const uploadPhotos = async (files: File[]) => {
    if (files.length === 0) return;
    setUploadingPhotos(true);
    setError("");
    setMessage("");

    try {
      const formData = new FormData();
      files.forEach((file) => formData.append("files", file));
      const response = await fetch(
        `/api/review/properties/${encodeURIComponent(property.id)}/images`,
        { method: "POST", body: formData },
      );
      const body = (await response.json()) as {
        error?: string;
        imageUrls?: string[];
      };
      if (!response.ok) throw new Error(body.error ?? "Could not upload photos");
      setImageUrls(body.imageUrls ?? []);
      setContentRightsConfirmed(false);
      setMessage(`${files.length} photo${files.length === 1 ? "" : "s"} uploaded.`);
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not upload photos");
    } finally {
      setUploadingPhotos(false);
    }
  };

  const removePhoto = async (url: string) => {
    setRemovingPhoto(url);
    setError("");
    setMessage("");

    try {
      const response = await fetch(
        `/api/review/properties/${encodeURIComponent(property.id)}/images`,
        {
          method: "DELETE",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ url }),
        },
      );
      const body = (await response.json()) as {
        error?: string;
        imageUrls?: string[];
      };
      if (!response.ok) throw new Error(body.error ?? "Could not remove photo");
      setImageUrls(body.imageUrls ?? []);
      setContentRightsConfirmed(false);
      setMessage("Photo removed.");
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not remove photo");
    } finally {
      setRemovingPhoto(null);
    }
  };

  const saveReview = async (nextStatus: ReviewStatus) => {
    setSavingStatus(nextStatus);
    setError("");
    setMessage("");

    const parsedAcres = landAcres.trim() === "" ? null : Number(landAcres);
    if (parsedAcres !== null && (!Number.isFinite(parsedAcres) || parsedAcres < 0)) {
      setError("Enter a valid acreage value.");
      setSavingStatus(null);
      return;
    }
    if (nextStatus === "approved" && !contentRightsConfirmed) {
      setError("Confirm permission to display the description and photographs.");
      setSavingStatus(null);
      return;
    }
    if (nextStatus === "approved" && description.trim().length < 20) {
      setError("Add the complete listing description before publishing.");
      setSavingStatus(null);
      return;
    }
    if (
      nextStatus === "approved" &&
      (imageUrls.length === 0 ||
        imageUrls.every((url) => url.includes("property-placeholder")))
    ) {
      setError("Add at least one real property photograph before publishing.");
      setSavingStatus(null);
      return;
    }

    try {
      const response = await fetch(
        `/api/review/properties/${encodeURIComponent(property.id)}`,
        {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            reviewStatus: nextStatus,
            reviewNotes,
            landAcres: parsedAcres,
            eircode: eircode.trim() || null,
            description,
            imageUrls,
            contentRightsConfirmed,
            settings: selectedLabels.map((label) => ({
              label,
              detail:
                property.settings.find((setting) => setting.label === label)?.detail ??
                "Confirmed during manual boundary review",
            })),
          }),
        },
      );
      const body = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(body.error ?? "Could not save review");

      if (nextStatus === currentTab) {
        setMessage("Review saved.");
        router.refresh();
      } else {
        onMove(property.id);
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not save review");
    } finally {
      setSavingStatus(null);
    }
  };

  return (
    <article className="overflow-hidden rounded-[28px] border border-stone-200 bg-white shadow-[0_16px_50px_rgba(31,45,39,0.07)]">
      <div className="grid lg:grid-cols-[0.78fr_1.22fr]">
        <div className="border-b border-stone-200 bg-stone-50 lg:border-b-0 lg:border-r">
          <div className="relative aspect-[16/10] bg-stone-200 lg:aspect-auto lg:min-h-[430px]">
            <Image
              alt={`${property.title}, ${property.locality}`}
              className="object-cover"
              fill
              sizes="(max-width: 1024px) 100vw, 40vw"
              src={imageUrls[0] ?? property.imageUrl}
            />
            <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-2 p-4">
              <span className="rounded-full bg-white/95 px-3 py-1.5 text-xs font-extrabold capitalize text-stone-900 shadow-sm backdrop-blur">
                {property.reviewStatus}
              </span>
              <span className="rounded-full bg-[#173f35]/95 px-3 py-1.5 text-xs font-extrabold text-white shadow-sm backdrop-blur">
                {property.matchScore}% match
              </span>
            </div>
          </div>

          <div className="space-y-4 p-5">
            <div>
              <p className="text-2xl font-black tracking-[-0.04em] text-stone-950">
                {formatCurrency(property.price)}
              </p>
              <h2 className="mt-1 text-lg font-black text-stone-900">
                {property.title}
              </h2>
              <p className="mt-1 text-xs leading-5 text-stone-500">
                {property.address}, Co. {property.county}
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2 rounded-2xl bg-white p-3 ring-1 ring-stone-200">
              <Metric label="Acres" value={property.landAcres?.toFixed(2) ?? "—"} />
              <Metric label="Beds" value={String(property.bedrooms)} />
              <Metric label="BER" value={property.berRating ?? "—"} />
            </div>

            <div className="flex flex-wrap gap-2">
              {property.settings.map((setting) => (
                <span
                  className="inline-flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1.5 text-xs font-bold text-stone-700 ring-1 ring-stone-200"
                  key={`${property.id}-${setting.label}`}
                >
                  {setting.label}
                  <EvidenceBadge level={setting.evidence} />
                </span>
              ))}
            </div>

            {property.sourceUrl ? (
              <a
                className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-stone-200 bg-white text-xs font-extrabold text-stone-800 hover:bg-stone-100"
                href={property.sourceUrl}
                rel="noreferrer"
                target="_blank"
              >
                Open original listing
                <ExternalLink aria-hidden="true" className="size-4" />
              </a>
            ) : null}
          </div>
        </div>

        <div className="p-5 sm:p-7 lg:p-8">
          <div className="grid gap-5 sm:grid-cols-3">
            <label>
              <span className="filter-label">Confirmed acreage</span>
              <input
                className="filter-input mt-2"
                inputMode="decimal"
                min="0"
                onChange={(event) => setLandAcres(event.target.value)}
                step="0.01"
                type="number"
                value={landAcres}
              />
            </label>
            <label>
              <span className="filter-label">Eircode</span>
              <input
                autoCapitalize="characters"
                className="filter-input mt-2 uppercase"
                maxLength={8}
                onChange={(event) => setEircode(event.target.value.toUpperCase())}
                placeholder="P12 A1B2"
                value={eircode}
              />
              <span className="mt-2 block text-[11px] leading-4 text-stone-500">
                Use the exact Eircode only when the listing or agent confirms it.
              </span>
            </label>
            <div>
              <span className="filter-label">Current land evidence</span>
              <div className="mt-3">
                <EvidenceBadge level={property.landEvidence} />
              </div>
              <p className="mt-2 text-[11px] leading-4 text-stone-500">
                Saving marks the acreage and selected setting tags as buyer verified.
              </p>
            </div>
          </div>

          <fieldset className="mt-6">
            <legend className="filter-label">Confirmed setting</legend>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {settingOptions.map((option) => {
                const selected = selectedLabels.includes(option.label);
                const Icon = option.icon;
                return (
                  <button
                    aria-pressed={selected}
                    className={`flex min-h-20 items-start gap-3 rounded-2xl border p-3 text-left transition ${
                      selected
                        ? "border-emerald-800 bg-emerald-50 text-emerald-950"
                        : "border-stone-200 bg-white text-stone-700 hover:border-stone-300"
                    }`}
                    key={option.label}
                    onClick={() => toggleSetting(option.label)}
                    type="button"
                  >
                    <span
                      className={`mt-0.5 grid size-7 shrink-0 place-items-center rounded-lg ${
                        selected ? "bg-emerald-800 text-white" : "bg-stone-100"
                      }`}
                    >
                      {selected ? (
                        <Check aria-hidden="true" className="size-4" />
                      ) : (
                        <Icon aria-hidden="true" className="size-4" />
                      )}
                    </span>
                    <span>
                      <span className="block text-sm font-black">{option.label}</span>
                      <span className="mt-1 block text-[11px] leading-4 opacity-75">
                        {option.description}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </fieldset>

          <section className="mt-6 rounded-2xl border border-stone-200 bg-stone-50 p-4 sm:p-5">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="filter-label">Complete listing description</p>
                <p className="mt-1 text-[11px] leading-5 text-stone-500">
                  Check the wording against the original listing before publication.
                </p>
              </div>
              <span className="text-[11px] font-bold text-stone-500">
                {description.length.toLocaleString()} characters
              </span>
            </div>
            <textarea
              className="mt-3 min-h-56 w-full resize-y rounded-xl border border-stone-200 bg-white px-4 py-3 text-sm leading-6 text-stone-800 outline-none focus:border-emerald-700 focus:ring-3 focus:ring-emerald-700/10"
              onChange={(event) => {
                setDescription(event.target.value);
                setContentRightsConfirmed(false);
              }}
              placeholder="Paste or verify the complete property description here."
              value={description}
            />
          </section>

          <section className="mt-6 rounded-2xl border border-stone-200 bg-white p-4 sm:p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="filter-label">Property photographs</p>
                <p className="mt-1 text-[11px] leading-5 text-stone-500">
                  These are public after approval. Upload the actual house and land photographs, not the private boundary evidence.
                </p>
              </div>
              <label className="inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#173f35] px-4 text-xs font-extrabold text-white hover:bg-[#205447]">
                {uploadingPhotos ? (
                  <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
                ) : (
                  <ImagePlus aria-hidden="true" className="size-4" />
                )}
                Add photos
                <input
                  accept="image/jpeg,image/png,image/webp"
                  className="sr-only"
                  disabled={uploadingPhotos}
                  multiple
                  onChange={(event) => {
                    const files = Array.from(event.target.files ?? []);
                    if (files.length > 0) void uploadPhotos(files);
                    event.currentTarget.value = "";
                  }}
                  type="file"
                />
              </label>
            </div>

            {imageUrls.length > 0 ? (
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
                {imageUrls.map((url, index) => (
                  <div
                    className="group relative aspect-[4/3] overflow-hidden rounded-xl border border-stone-200 bg-stone-100"
                    key={`${url}-${index}`}
                  >
                    <Image
                      alt={`${property.title} photograph ${index + 1}`}
                      className="object-cover"
                      fill
                      sizes="(max-width: 640px) 50vw, 220px"
                      src={url}
                    />
                    <div className="absolute inset-x-0 top-0 flex items-center justify-between gap-2 p-2">
                      <span className="rounded-full bg-black/65 px-2 py-1 text-[10px] font-extrabold text-white backdrop-blur">
                        {index === 0 ? "Main photo" : `Photo ${index + 1}`}
                      </span>
                      <button
                        aria-label={`Remove photograph ${index + 1}`}
                        className="grid size-8 place-items-center rounded-full bg-white/95 text-red-700 shadow-sm hover:bg-red-50 disabled:opacity-60"
                        disabled={removingPhoto === url}
                        onClick={() => void removePhoto(url)}
                        type="button"
                      >
                        {removingPhoto === url ? (
                          <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
                        ) : (
                          <Trash2 aria-hidden="true" className="size-4" />
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-4 rounded-xl border border-dashed border-stone-300 bg-stone-50 p-6 text-center text-sm font-semibold text-stone-500">
                No public property photographs have been added.
              </div>
            )}
          </section>

          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            <div>
              <span className="filter-label">Boundary evidence</span>
              <label className="mt-2 flex min-h-28 cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-stone-300 bg-stone-50 p-4 text-center transition hover:border-emerald-700 hover:bg-emerald-50/40">
                {uploading ? (
                  <LoaderCircle aria-hidden="true" className="size-6 animate-spin text-emerald-800" />
                ) : (
                  <Upload aria-hidden="true" className="size-6 text-emerald-800" />
                )}
                <span className="mt-2 text-sm font-extrabold text-stone-800">
                  Upload aerial or folio image
                </span>
                <span className="mt-1 text-[11px] text-stone-500">
                  JPG, PNG or WebP · maximum 6 MB · stored privately
                </span>
                <input
                  accept="image/jpeg,image/png,image/webp"
                  className="sr-only"
                  disabled={uploading}
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) void uploadEvidence(file);
                    event.currentTarget.value = "";
                  }}
                  type="file"
                />
              </label>
            </div>

            <label>
              <span className="filter-label">Review notes</span>
              <textarea
                className="mt-2 min-h-28 w-full resize-y rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5 text-sm font-medium text-stone-800 outline-none focus:border-emerald-700 focus:bg-white focus:ring-3 focus:ring-emerald-700/10"
                onChange={(event) => setReviewNotes(event.target.value)}
                placeholder="Example: red boundary shows woodland across most of the five acres."
                value={reviewNotes}
              />
            </label>
          </div>

          {evidenceUrl ? (
            <div className="mt-5 overflow-hidden rounded-2xl border border-stone-200 bg-stone-100">
              <div className="flex items-center gap-2 border-b border-stone-200 bg-white px-4 py-3 text-xs font-extrabold text-stone-700">
                <FileImage aria-hidden="true" className="size-4 text-emerald-800" />
                Private boundary evidence
              </div>
              <div className="relative aspect-[16/9]">
                <Image
                  alt={`Boundary evidence for ${property.title}`}
                  className="object-contain"
                  fill
                  sizes="700px"
                  src={evidenceUrl}
                />
              </div>
            </div>
          ) : null}

          <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <input
              checked={contentRightsConfirmed}
              className="mt-1 size-4 accent-emerald-800"
              onChange={(event) => setContentRightsConfirmed(event.target.checked)}
              type="checkbox"
            />
            <span className="flex min-w-0 gap-3">
              <Copyright aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-amber-900" />
              <span>
                <span className="block text-sm font-black text-amber-950">
                  Permission to display source content
                </span>
                <span className="mt-1 block text-xs leading-5 text-amber-950/75">
                  I confirm that HouseCheck may display this listing description and these photographs. Approval is blocked until this is confirmed.
                </span>
              </span>
            </span>
          </label>

          {error ? (
            <p className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-sm font-semibold text-red-800">
              {error}
            </p>
          ) : null}
          {message ? (
            <p className="mt-4 rounded-xl bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-800">
              {message}
            </p>
          ) : null}

          <ReviewActions
            currentStatus={currentTab}
            disabled={
              savingStatus !== null ||
              uploading ||
              uploadingPhotos ||
              removingPhoto !== null
            }
            onSave={(nextStatus) => void saveReview(nextStatus)}
            savingStatus={savingStatus}
          />
        </div>
      </div>
    </article>
  );
}

function ReviewActions({
  currentStatus,
  savingStatus,
  disabled,
  onSave,
}: {
  currentStatus: ReviewStatus;
  savingStatus: ReviewStatus | null;
  disabled: boolean;
  onSave: (status: ReviewStatus) => void;
}) {
  return (
    <div className="mt-7 flex flex-col gap-2 sm:flex-row">
      {currentStatus !== "pending" ? (
        <ActionButton
          disabled={disabled}
          icon={RotateCcw}
          label="Return to pending"
          loading={savingStatus === "pending"}
          onClick={() => onSave("pending")}
          tone="neutral"
        />
      ) : (
        <ActionButton
          disabled={disabled}
          icon={Save}
          label="Save hidden"
          loading={savingStatus === "pending"}
          onClick={() => onSave("pending")}
          tone="neutral"
        />
      )}

      {currentStatus !== "rejected" ? (
        <ActionButton
          disabled={disabled}
          icon={X}
          label="Reject"
          loading={savingStatus === "rejected"}
          onClick={() => onSave("rejected")}
          tone="danger"
        />
      ) : null}

      <ActionButton
        disabled={disabled}
        icon={BadgeCheck}
        label={currentStatus === "approved" ? "Save approved" : "Approve and publish"}
        loading={savingStatus === "approved"}
        onClick={() => onSave("approved")}
        tone="primary"
      />
    </div>
  );
}

function ActionButton({
  icon: Icon,
  label,
  loading,
  disabled,
  onClick,
  tone,
}: {
  icon: typeof Save;
  label: string;
  loading: boolean;
  disabled: boolean;
  onClick: () => void;
  tone: "neutral" | "danger" | "primary";
}) {
  const className =
    tone === "primary"
      ? "bg-[#173f35] text-white hover:bg-[#0f3027] sm:flex-1"
      : tone === "danger"
        ? "border border-red-200 bg-red-50 text-red-800 hover:bg-red-100"
        : "border border-stone-200 bg-white text-stone-800 hover:bg-stone-50";

  return (
    <button
      className={`inline-flex h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-extrabold disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
      disabled={disabled}
      onClick={onClick}
      type="button"
    >
      {loading ? (
        <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
      ) : (
        <Icon aria-hidden="true" className="size-4" />
      )}
      {label}
    </button>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center">
      <p className="text-lg font-black text-stone-950">{value}</p>
      <p className="mt-0.5 text-[10px] font-extrabold uppercase tracking-[0.12em] text-stone-500">
        {label}
      </p>
    </div>
  );
}
