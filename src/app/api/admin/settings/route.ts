import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = createServerSupabaseClient();
    
    // Get app settings
    const { data: appSettings } = await supabase
      .from("app_settings")
      .select("*")
      .eq("id", 1)
      .single();

    return NextResponse.json({
      success: true,
      settings: {
        isRegistrationOpen: appSettings?.is_registration_open ?? true,
        eventDate: appSettings?.event_date || undefined,
        contactStatuses: appSettings?.contact_statuses || {},
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Failed to load settings" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify admin
    const { data: adminRecord } = await supabase
      .from("admins")
      .select("user_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!adminRecord) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();

    // 1. Update App Settings if provided
    const updates: any = {};
    if (body.isRegistrationOpen !== undefined) updates.is_registration_open = body.isRegistrationOpen;
    if (body.eventDate !== undefined) updates.event_date = body.eventDate;
    if (body.contactStatuses !== undefined) {
      // Disallow manual assignment of "winner" status
      const sanitized: Record<string, string> = {};
      if (typeof body.contactStatuses === "object" && body.contactStatuses !== null) {
        for (const [id, st] of Object.entries(body.contactStatuses)) {
          if (st === "contacted") {
            sanitized[id] = "contacted";
          } else if (st === "new") {
            sanitized[id] = "new";
          } else if (st !== "winner") {
            sanitized[id] = "new";
          }
        }
      }
      updates.contact_statuses = sanitized;
    }

    if (Object.keys(updates).length > 0) {
      const { error: settingsUpdateErr } = await supabase
        .from("app_settings")
        .update(updates)
        .eq("id", 1);

      if (settingsUpdateErr) {
        console.error("[API Admin Settings] Failed to update app_settings:", settingsUpdateErr);
        return NextResponse.json({ error: settingsUpdateErr.message }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Failed to save settings" }, { status: 500 });
  }
}
