import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  getExpectedReviewToken,
  isReviewConfigured,
  isValidReviewKey,
  REVIEW_COOKIE_NAME,
} from "@/lib/review-auth";

const loginSchema = z.object({ key: z.string().min(1).max(500) });

export async function POST(request: NextRequest) {
  if (!isReviewConfigured()) {
    return NextResponse.json(
      { error: "Review access is not configured" },
      { status: 503 },
    );
  }

  let input: z.infer<typeof loginSchema>;
  try {
    input = loginSchema.parse(await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  if (!isValidReviewKey(input.key)) {
    return NextResponse.json({ error: "Incorrect review key" }, { status: 401 });
  }

  const token = getExpectedReviewToken();
  if (!token) {
    return NextResponse.json(
      { error: "Review access is not configured" },
      { status: 503 },
    );
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(REVIEW_COOKIE_NAME, token, {
    httpOnly: true,
    maxAge: 60 * 60 * 12,
    path: "/",
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
  });
  return response;
}
