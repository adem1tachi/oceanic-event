import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

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

    // Call reset_draw RPC with user session first (so auth.uid() is preserved)
    let { error } = await supabase.rpc("reset_draw");

    // If user RPC failed, fallback to service-role client
    if (error) {
      console.warn("[API Admin Reset] User session RPC call failed, trying service-role:", error.message);
      try {
        const adminSupabase = createAdminClient();
        const adminRes = await adminSupabase.rpc("reset_draw");
        error = adminRes.error;
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

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[API Admin Reset] Exception:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
