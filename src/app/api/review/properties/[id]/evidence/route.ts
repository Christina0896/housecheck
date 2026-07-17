import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { isReviewRequestAuthorized } from "@/lib/review-auth";
import { getSupabaseServerClient } from "@/lib/supabase-server";

const allowedTypes = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
]);
const maxBytes = 6 * 1024 * 1024;

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  if (!isReviewRequestAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Image file required" }, { status: 400 });
  }
  if (!allowedTypes.has(file.type)) {
    return NextResponse.json(
      { error: "Use a JPG, PNG or WebP image" },
      { status: 400 },
    );
  }
  if (file.size <= 0 || file.size > maxBytes) {
    return NextResponse.json(
      { error: "Image must be between 1 byte and 6 MB" },
      { status: 400 },
    );
  }

  const supabase = getSupabaseServerClient();
  const { data: current, error: currentError } = await supabase
    .from("properties")
    .select("boundary_evidence_path")
    .eq("id", id)
    .single();

  if (currentError) {
    return NextResponse.json({ error: "Property not found" }, { status: 404 });
  }

  const extension = allowedTypes.get(file.type)!;
  const path = `${id}/${randomUUID()}.${extension}`;
  const { error: uploadError } = await supabase.storage
    .from("property-evidence")
    .upload(path, await file.arrayBuffer(), {
      cacheControl: "3600",
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    console.error("Evidence upload failed:", uploadError);
    return NextResponse.json({ error: "Evidence upload failed" }, { status: 500 });
  }

  const { error: updateError } = await supabase
    .from("properties")
    .update({ boundary_evidence_path: path })
    .eq("id", id);

  if (updateError) {
    await supabase.storage.from("property-evidence").remove([path]);
    return NextResponse.json({ error: "Could not attach evidence" }, { status: 500 });
  }

  const previousPath = current.boundary_evidence_path
    ? String(current.boundary_evidence_path)
    : null;
  if (previousPath && previousPath !== path) {
    await supabase.storage.from("property-evidence").remove([previousPath]);
  }

  const { data: signedData } = await supabase.storage
    .from("property-evidence")
    .createSignedUrl(path, 60 * 60);

  return NextResponse.json({
    ok: true,
    path,
    signedUrl: signedData?.signedUrl ?? null,
  });
}
