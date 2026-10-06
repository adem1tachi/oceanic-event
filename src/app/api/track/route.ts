import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { eventType, visitorId, sessionId, url, metadata } = body;

    if (!eventType || !visitorId) {
      return NextResponse.json(
        { error: "eventType and visitorId are required" },
        { status: 400 }
      );
    }

    // Sanitize event type
    const sanitizedEventType =
      eventType === "link_click" ? "link_click" : "page_view";

    const adminSupabase = createAdminClient();

    const { error } = await adminSupabase.from("site_analytics").insert({
      event_type: sanitizedEventType,
      visitor_id: String(visitorId).slice(0, 100),
      session_id: sessionId ? String(sessionId).slice(0, 100) : null,
      url: url ? String(url).slice(0, 500) : null,
      metadata: typeof metadata === "object" && metadata !== null ? metadata : {},
    });

    if (error) {
      console.warn("[Analytics API] Insertion notice:", error.message);
      // Non-blocking for client, return ok with warning
      return NextResponse.json({ success: true, notice: error.message });
    }

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (err: any) {
    console.error("[Analytics API] Exception:", err?.message || err);
    return NextResponse.json({ success: false, error: "Tracking failed" }, { status: 500 });
  }
}
