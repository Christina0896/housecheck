import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { isReviewRequestAuthorized } from "@/lib/review-auth";
import { getSupabaseServerClient } from "@/lib/supabase-server";

const allowedTypes = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
]);
const maxBytes = 10 * 1024 * 1024;
const maxImages = 30;
const fallbackImage =
  "https://raw.githubusercontent.com/Christina0896/housecheck/main/public/property-placeholder.svg";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  if (!isReviewRequestAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const formData = await request.formData();
  const files = formData
    .getAll("files")
    .filter((item): item is File => item instanceof File && item.size > 0);

  if (files.length === 0) {
    return NextResponse.json({ error: "Select at least one image" }, { status: 400 });
  }
  if (files.length > 12) {
    return NextResponse.json(
      { error: "Upload a maximum of 12 images at a time" },
      { status: 400 },
    );
  }

  for (const file of files) {
    if (!allowedTypes.has(file.type)) {
      return NextResponse.json(
        { error: `${file.name || "Image"} must be JPG, PNG or WebP` },
        { status: 400 },
      );
    }
    if (file.size > maxBytes) {
      return NextResponse.json(
        { error: `${file.name || "Image"} is larger than 10 MB` },
        { status: 400 },
      );
    }
  }

  const supabase = getSupabaseServerClient();
  const { data: current, error: currentError } = await supabase
    .from("properties")
    .select("image_urls, image_url")
    .eq("id", id)
    .single();

  if (currentError) {
    return NextResponse.json({ error: "Property not found" }, { status: 404 });
  }

  const existing = toImageUrls(current.image_urls, String(current.image_url ?? ""));
  if (existing.length + files.length > maxImages) {
    return NextResponse.json(
      { error: `A property can contain a maximum of ${maxImages} images` },
      { status: 400 },
    );
  }

  const uploadedPaths: string[] = [];
  const uploadedUrls: string[] = [];

  try {
    for (const file of files) {
      const extension = allowedTypes.get(file.type)!;
      const path = `${id}/${Date.now()}-${randomUUID()}.${extension}`;
      const { error: uploadError } = await supabase.storage
        .from("property-images")
        .upload(path, await file.arrayBuffer(), {
          cacheControl: "31536000",
          contentType: file.type,
          upsert: false,
        });

      if (uploadError) throw uploadError;
      uploadedPaths.push(path);

      const { data: publicData } = supabase.storage
        .from("property-images")
        .getPublicUrl(path);
      uploadedUrls.push(publicData.publicUrl);
    }

    const imageUrls = dedupe([...existing, ...uploadedUrls]);
    const { error: updateError } = await supabase
      .from("properties")
      .update({
        image_urls: imageUrls,
        image_url: imageUrls[0] ?? fallbackImage,
        content_rights_confirmed: false,
      })
      .eq("id", id);

    if (updateError) throw updateError;

    return NextResponse.json({ ok: true, imageUrls });
  } catch (error) {
    if (uploadedPaths.length > 0) {
      await supabase.storage.from("property-images").remove(uploadedPaths);
    }
    console.error("Property photo upload failed:", error);
    return NextResponse.json({ error: "Photo upload failed" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  if (!isReviewRequestAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const body = (await request.json().catch(() => null)) as { url?: unknown } | null;
  const url = typeof body?.url === "string" ? body.url.trim() : "";
  if (!url) {
    return NextResponse.json({ error: "Image URL required" }, { status: 400 });
  }

  const supabase = getSupabaseServerClient();
  const { data: current, error: currentError } = await supabase
    .from("properties")
    .select("image_urls, image_url")
    .eq("id", id)
    .single();

  if (currentError) {
    return NextResponse.json({ error: "Property not found" }, { status: 404 });
  }

  const imageUrls = toImageUrls(current.image_urls, String(current.image_url ?? ""))
    .filter((item) => item !== url);
  const primary = imageUrls[0] ?? fallbackImage;

  const { error: updateError } = await supabase
    .from("properties")
    .update({
      image_urls: imageUrls,
      image_url: primary,
      content_rights_confirmed: false,
    })
    .eq("id", id);

  if (updateError) {
    return NextResponse.json({ error: "Could not remove photo" }, { status: 500 });
  }

  const storagePath = getPropertyImageStoragePath(url);
  if (storagePath) {
    await supabase.storage.from("property-images").remove([storagePath]);
  }

  return NextResponse.json({ ok: true, imageUrls });
}

function toImageUrls(value: unknown, fallback: string): string[] {
  const items = Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
  return dedupe([...items, ...(fallback ? [fallback] : [])]);
}

function dedupe(values: string[]): string[] {
  const seen = new Set<string>();
  return values
    .map((value) => value.trim())
    .filter((value) => {
      if (!value || seen.has(value)) return false;
      seen.add(value);
      return true;
    });
}

function getPropertyImageStoragePath(url: string): string | null {
  const marker = "/storage/v1/object/public/property-images/";
  const markerIndex = url.indexOf(marker);
  if (markerIndex < 0) return null;
  return decodeURIComponent(url.slice(markerIndex + marker.length));
}
