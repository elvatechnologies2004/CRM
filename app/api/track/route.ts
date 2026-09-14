import { NextResponse } from "next/server";
import { trackEvent } from "@/lib/analytics/track";

// Privacy-conscious client-tracking endpoint (Step 99).
// Only allow-listed event names are recorded; properties are sanitized and
// capped server-side (see lib/analytics/track.ts). Best-effort — never
// fails the caller, never stores PII beyond a page/feature slug.

export async function POST(request: Request) {
  try {
    // Cheap guard: enforce a JSON content type so we don't accept raw spam.
    const contentType = request.headers.get("content-type") ?? "";
    if (!contentType.includes("application/json")) {
      return NextResponse.json({ ok: false }, { status: 415 });
    }

    const body = (await request.json()) as {
      eventName?: unknown;
      properties?: unknown;
    };
    const eventName = typeof body?.eventName === "string" ? body.eventName.slice(0, 100) : "";

    // Reject tiny payloads (spam probes). Must pair with server allow-list.
    if (eventName.length < 3) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }

    const properties =
      body?.properties && typeof body.properties === "object" && !Array.isArray(body.properties)
        ? (body.properties as Record<string, string | number | boolean | null>)
        : {};

    await trackEvent({ eventName, properties });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
}