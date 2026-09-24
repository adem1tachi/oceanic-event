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

    // Call reset_draw RPC via admin client
    const adminSupabase = createAdminClient();
    const { error } = await adminSupabase.rpc("reset_draw");

    if (error) {
      console.error("[API Admin Reset] Error calling reset_draw:", error.message);
      return NextResponse.json(
        { error: "Failed to reset raffle draw" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[API Admin Reset] Exception:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
