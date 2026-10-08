import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: adminRecord } = await supabase
      .from("admins")
      .select("user_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!adminRecord) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const adminSupabase = createAdminClient();

    // 1. Fetch participants
    const { data: participants } = await adminSupabase
      .from("participants")
      .select("*")
      .order("created_at", { ascending: false });

    // 2. Fetch winners
    const { data: winners } = await adminSupabase
      .from("winners")
      .select("*")
      .order("drawn_at", { ascending: false });

    // 3. Settings from Database
    const { data: appSettings } = await adminSupabase
      .from("app_settings")
      .select("*")
      .eq("id", 1)
      .single();

    const backupData = {
      version: "2.0",
      exportedAt: new Date().toISOString(),
      appName: "OCEANIC x Formatech 2026",
      participants: participants || [],
      winners: winners || [],
      settings: appSettings || {},
    };

    return new NextResponse(JSON.stringify(backupData, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="oceanic-formatech-backup-${new Date().toISOString().slice(0, 10)}.json"`,
      },
    });
  } catch (err: any) {
    console.error("[API Admin Backup GET] Error:", err);
    return NextResponse.json({ error: err?.message || "Failed to generate backup" }, { status: 500 });
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

    const { data: adminRecord } = await supabase
      .from("admins")
      .select("user_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!adminRecord) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const backupPayload = await request.json();

    if (!backupPayload || typeof backupPayload !== "object") {
      return NextResponse.json({ error: "Invalid backup file format" }, { status: 400 });
    }

    const adminSupabase = createAdminClient();
    let restoredParticipants = 0;

    // 1. Restore Participants (upsert by phone)
    if (Array.isArray(backupPayload.participants) && backupPayload.participants.length > 0) {
      for (const p of backupPayload.participants) {
        if (p.phone) {
          const { error } = await adminSupabase.from("participants").upsert(
            {
              full_name: p.full_name || "Visitor",
              phone: p.phone,
              email: p.email || null,
              first_name: p.first_name || null,
              last_name: p.last_name || null,
              position: p.position || null,
              company: p.company || null,
              desired_topic: p.desired_topic || null,
              people_count: p.people_count || 1,
              consent: Boolean(p.consent),
              locale: p.locale || "en",
              created_at: p.created_at || new Date().toISOString(),
            },
            { onConflict: "phone" }
          );
          if (!error) restoredParticipants++;
        }
      }
    }

    // 2. Restore App Settings to Supabase
    if (backupPayload.settings && typeof backupPayload.settings === "object") {
      const s = backupPayload.settings;
      const updates: any = {};
      if (s.is_registration_open !== undefined) updates.is_registration_open = s.is_registration_open;
      else if (s.isRegistrationOpen !== undefined) updates.is_registration_open = s.isRegistrationOpen;

      if (s.event_date !== undefined) updates.event_date = s.event_date;
      else if (s.eventDate !== undefined) updates.event_date = s.eventDate;

      if (s.contact_statuses !== undefined) updates.contact_statuses = s.contact_statuses;
      else if (s.contactStatuses !== undefined) updates.contact_statuses = s.contactStatuses;

      if (Object.keys(updates).length > 0) {
        await adminSupabase.from("app_settings").update(updates).eq("id", 1);
      }
    }


    return NextResponse.json({
      success: true,
      restoredCount: restoredParticipants,
      message: `تم استعادة النسخة الاحتياطية بنجاح (${restoredParticipants} مشارك)`,
    });
  } catch (err: any) {
    console.error("[API Admin Backup POST] Error:", err);
    return NextResponse.json({ error: err?.message || "Failed to restore backup" }, { status: 500 });
  }
}
