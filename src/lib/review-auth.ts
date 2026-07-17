import "server-only";

import { createHash, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import type { NextRequest } from "next/server";

export const REVIEW_COOKIE_NAME = "housecheck-review";

export function isReviewConfigured(): boolean {
  return Boolean(getConfiguredReviewKey());
}

export function isValidReviewKey(candidate: string): boolean {
  const configured = getConfiguredReviewKey();
  if (!configured || !candidate) return false;
  return safeEqual(candidate, configured);
}

export function getExpectedReviewToken(): string | null {
  const configured = getConfiguredReviewKey();
  if (!configured) return null;
  return createHash("sha256").update(configured).digest("hex");
}

export async function isReviewAuthorized(): Promise<boolean> {
  const expected = getExpectedReviewToken();
  if (!expected) return false;
  const cookieStore = await cookies();
  const supplied = cookieStore.get(REVIEW_COOKIE_NAME)?.value ?? "";
  return safeEqual(supplied, expected);
}

export function isReviewRequestAuthorized(request: NextRequest): boolean {
  const expected = getExpectedReviewToken();
  if (!expected) return false;
  const supplied = request.cookies.get(REVIEW_COOKIE_NAME)?.value ?? "";
  return safeEqual(supplied, expected);
}

function getConfiguredReviewKey(): string {
  return (
    process.env.REVIEW_ADMIN_KEY?.trim() ||
    process.env.INGEST_API_KEY?.trim() ||
    ""
  );
}

function safeEqual(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  if (leftBuffer.length !== rightBuffer.length) return false;
  return timingSafeEqual(leftBuffer, rightBuffer);
}
