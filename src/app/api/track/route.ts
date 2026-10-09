import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  try {
    // 1. IP-based Rate Limiting (max 60 events per minute per IP)
    const clientIp = getClientIp(request.headers);
    const rateLimit = checkRateLimit(`track:${clientIp}`, 60, 60 * 1000);

    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Too many tracking requests. Please slow down." },
        {
          status: 429,
          headers: {
            "Retry-After": "60",
          },
        }
      );
    }

    const body = await request.json().catch(() => ({}));
    const { eventType, visitorId, sessionId, url, metadata } = body;

    if (!eventType || !visitorId) {
      return NextResponse.json(
        { error: "eventType and visitorId are required" },
        { status: 400 }
      );
    }

    // 2. Strict sanitization of fields
    const sanitizedEventType =
      eventType === "link_click" ? "link_click" : "page_view";

    const cleanVisitorId = String(visitorId).trim().slice(0, 80);
    const cleanSessionId = sessionId ? String(sessionId).trim().slice(0, 80) : null;
    const cleanUrl = url ? String(url).trim().slice(0, 400) : null;

    // 3. Strict size and depth limits on metadata (prevent DoS and DB storage exhaustion)
    let sanitizedMetadata: Record<string, any> = {};
    if (typeof metadata === "object" && metadata !== null && !Array.isArray(metadata)) {
      const serialized = JSON.stringify(metadata);
      // Hard cap on metadata payload size at 500 bytes
      if (serialized.length <= 500) {
        // Only keep flat primitive key-value pairs
        for (const [key, val] of Object.entries(metadata)) {
          if (typeof val === "string" || typeof val === "number" || typeof val === "boolean" || val === null) {
            sanitizedMetadata[String(key).slice(0, 40)] = typeof val === "string" ? val.slice(0, 150) : val;
          }
        }
      }
    }

    const adminSupabase = createAdminClient();

    const { error } = await adminSupabase.from("site_analytics").insert({
      event_type: sanitizedEventType,
      visitor_id: cleanVisitorId,
      session_id: cleanSessionId,
      url: cleanUrl,
      metadata: sanitizedMetadata,
    });

    if (error) {
      console.warn("[Analytics API] Insertion notice:", error.message);
      return NextResponse.json({ success: true, notice: error.message });
    }

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (err: any) {
    console.error("[Analytics API] Exception:", err?.message || err);
    return NextResponse.json({ success: false, error: "Tracking failed" }, { status: 500 });
  }
}
