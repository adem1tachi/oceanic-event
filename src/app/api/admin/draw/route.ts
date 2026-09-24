import { NextRequest, NextResponse } from "next/server";
import { raffleDrawSchema } from "@/lib/validators";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: NextRequest) {
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

    // Validate body
    const body = await request.json();
    const validation = raffleDrawSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid winner count", details: validation.error.format() },
        { status: 400 }
      );
    }

    const { winnerCount } = validation.data;

    // Call draw_winners RPC via admin client (or user client since user is in admins)
    const adminSupabase = createAdminClient();
    const { data: winners, error } = await adminSupabase.rpc("draw_winners", {
      n: winnerCount,
    });

    if (error) {
      console.error("[API Admin Draw] RPC error:", error.message);
      return NextResponse.json(
        { error: error.message || "Failed to execute draw" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      winners: winners || [],
      count: (winners || []).length,
    });
  } catch (err) {
    console.error("[API Admin Draw] Exception:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
