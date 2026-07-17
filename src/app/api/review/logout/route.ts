import { NextResponse } from "next/server";
import { REVIEW_COOKIE_NAME } from "@/lib/review-auth";

export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(REVIEW_COOKIE_NAME, "", {
    expires: new Date(0),
    httpOnly: true,
    path: "/",
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
  });
  return response;
}
