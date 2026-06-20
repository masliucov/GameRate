import { revalidateTag } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";

import { GAMES_TAG } from "@/lib/rawg";

// Constant-time comparison to avoid leaking the secret via timing.
function isValidSecret(provided: string, expected: string): boolean {
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

function extractBearer(request: NextRequest): string {
  const header = request.headers.get("authorization") ?? "";
  return header.startsWith("Bearer ") ? header.slice("Bearer ".length) : "";
}

export async function POST(request: NextRequest) {
  const expected = process.env.REVALIDATE_SECRET;
  if (!expected) {
    return NextResponse.json(
      { revalidated: false, error: "REVALIDATE_SECRET is not configured" },
      { status: 500 }
    );
  }

  const provided = extractBearer(request);
  if (!provided || !isValidSecret(provided, expected)) {
    return NextResponse.json(
      { revalidated: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  // Called by an external cron on a site with little organic traffic, so expire
  // immediately: the next (possibly only) visitor re-fetches fresh data instead
  // of being served stale via stale-while-revalidate. See Next.js revalidateTag.
  revalidateTag(GAMES_TAG, { expire: 0 });

  return NextResponse.json({ revalidated: true, tag: GAMES_TAG, now: Date.now() });
}
