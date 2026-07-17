import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json({
    ok: true,
    service: "housecheck-web",
    databaseConfigured: Boolean(
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
        process.env.SUPABASE_SERVICE_ROLE_KEY,
    ),
    reviewConfigured: Boolean(
      process.env.REVIEW_ADMIN_KEY?.trim() || process.env.INGEST_API_KEY?.trim(),
    ),
    timestamp: new Date().toISOString(),
  });
}
