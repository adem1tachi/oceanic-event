import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import fs from "fs";
import path from "path";

export async function POST() {
  try {
    const supabase = createServerSupabaseClient();

    // Verify session
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify admin allowlist
    const { data: adminRecord } = await supabase
      .from("admins")
      .select("user_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!adminRecord) {
      return NextResponse.json({ error: "Forbidden: Not an admin" }, { status: 403 });
    }

    let adminSupabase: any = null;
    try {
      adminSupabase = createAdminClient();
    } catch {
      adminSupabase = supabase;
    }

    // 1. Fetch current winners before truncating to guarantee their statuses return to "new"
    let winnerParticipantIds: string[] = [];
    try {
      const { data: currentWinners } = await adminSupabase
        .from("winners")
        .select("participant_id");
      if (currentWinners) {
        winnerParticipantIds = currentWinners
          .map((w: any) => w.participant_id)
          .filter(Boolean);
      }
    } catch (fetchErr) {
      console.warn("[API Admin Reset] Could not fetch current winners before reset:", fetchErr);
    }

    // 2. Call reset_draw RPC with user session first (so auth.uid() is preserved)
    let { error } = await supabase.rpc("reset_draw");

    // If user RPC failed, fallback to service-role client
    if (error) {
      console.warn("[API Admin Reset] User session RPC call failed, trying service-role:", error.message);
      try {
        const adminRes = await adminSupabase.rpc("reset_draw");
        if (!adminRes.error) {
          error = null;
        } else {
          // Direct table truncate/delete fallback
          const deleteRes = await adminSupabase
            .from("winners")
            .delete()
            .neq("id", "00000000-0000-0000-0000-000000000000");
          if (!deleteRes.error) {
            error = null;
          } else {
            error = deleteRes.error;
          }
        }
      } catch (adminClientErr: any) {
        console.error("[API Admin Reset] Service-role fallback error:", adminClientErr?.message);
      }
    }

    if (error) {
      console.error("[API Admin Reset] Error calling reset_draw:", error.message);
      return NextResponse.json(
        { error: error.message || "Failed to reset raffle draw" },
        { status: 500 }
      );
    }

    // 3. Reset all winner contact statuses in database app_settings to default "new"
    try {
      const { data: appSettings } = await adminSupabase
        .from("app_settings")
        .select("contact_statuses")
        .eq("id", 1)
        .maybeSingle();

      const existingStatuses = (appSettings?.contact_statuses as Record<string, string>) || {};
      const updatedStatuses = { ...existingStatuses };
      let changed = false;

      // Set any previous winner's status to "new"
      winnerParticipantIds.forEach((id) => {
        updatedStatuses[id] = "new";
        changed = true;
      });

      // Also reset any status marked as "winner"
      for (const [id, st] of Object.entries(updatedStatuses)) {
        if (st === "winner") {
          updatedStatuses[id] = "new";
          changed = true;
        }
      }

      if (changed) {
        await adminSupabase
          .from("app_settings")
          .update({ contact_statuses: updatedStatuses })
          .eq("id", 1);
      }
    } catch (settingsResetErr) {
      console.warn("[API Admin Reset] Error resetting app_settings contact_statuses:", settingsResetErr);
    }

    // 4. Reset statuses in local settings.json if it exists
    try {
      const settingsFilePath = path.join(process.cwd(), "src", "data", "settings.json");
      if (fs.existsSync(settingsFilePath)) {
        const fileData = fs.readFileSync(settingsFilePath, "utf-8");
        const parsed = JSON.parse(fileData);
        if (parsed.contactStatuses) {
          let jsonChanged = false;
          winnerParticipantIds.forEach((id) => {
            parsed.contactStatuses[id] = "new";
            jsonChanged = true;
          });
          for (const key of Object.keys(parsed.contactStatuses)) {
            if (parsed.contactStatuses[key] === "winner") {
              parsed.contactStatuses[key] = "new";
              jsonChanged = true;
            }
          }
          if (jsonChanged) {
            fs.writeFileSync(settingsFilePath, JSON.stringify(parsed, null, 2), "utf-8");
          }
        }
      }
    } catch (fileErr) {
      console.warn("[API Admin Reset] Error updating settings.json:", fileErr);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[API Admin Reset] Exception:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
