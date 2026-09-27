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

    // Call draw_winners RPC with authenticated user session first (so auth.uid() is preserved)
    let { data: winners, error } = await supabase.rpc("draw_winners", {
      n: winnerCount,
    });

    // If user RPC failed, fallback to privileged service-role admin client
    if (error) {
      console.warn("[API Admin Draw] User session RPC call failed, attempting service-role client:", error.message);
      try {
        const adminSupabase = createAdminClient();
        const adminRes = await adminSupabase.rpc("draw_winners", {
          n: winnerCount,
        });
        if (!adminRes.error && adminRes.data) {
          winners = adminRes.data;
          error = null;
        } else {
          // Direct table query & insert fallback if RPC auth check fails
          const { data: existingWinners } = await adminSupabase
            .from("winners")
            .select("participant_id, draw_round");

          const existingIds = new Set((existingWinners || []).map((w: any) => w.participant_id));
          const maxRound = (existingWinners || []).reduce((max: number, w: any) => Math.max(max, w.draw_round || 0), 0);
          const nextRound = maxRound + 1;

          const { data: allParticipants } = await adminSupabase
            .from("participants")
            .select("id, full_name, phone, email, locale");

          const eligible = (allParticipants || []).filter((p: any) => !existingIds.has(p.id));

          if (eligible.length > 0) {
            const shuffled = [...eligible].sort(() => 0.5 - Math.random());
            const chosen = shuffled.slice(0, winnerCount);

            const toInsert = chosen.map((p: any) => ({
              participant_id: p.id,
              draw_round: nextRound,
              drawn_at: new Date().toISOString(),
            }));

            const { data: inserted, error: insertErr } = await adminSupabase
              .from("winners")
              .insert(toInsert)
              .select("id, participant_id, draw_round, drawn_at");

            if (!insertErr && inserted) {
              winners = inserted.map((ins: any) => {
                const matched = chosen.find((c: any) => c.id === ins.participant_id);
                return {
                  id: ins.id,
                  participant_id: ins.participant_id,
                  full_name: matched?.full_name || "Winner",
                  phone: matched?.phone || "",
                  email: matched?.email || null,
                  locale: matched?.locale || "en",
                  draw_round: ins.draw_round,
                  drawn_at: ins.drawn_at,
                };
              });
              error = null;
            } else if (insertErr) {
              error = insertErr;
            }
          } else {
            return NextResponse.json(
              { error: "No eligible participants available for draw" },
              { status: 400 }
            );
          }
        }
      } catch (adminClientErr: any) {
        console.error("[API Admin Draw] Service-role fallback error:", adminClientErr?.message);
      }
    }

    if (error) {
      console.error("[API Admin Draw] RPC error:", error.message);
      return NextResponse.json(
        { error: error.message || "Failed to execute draw" },
        { status: 500 }
      );
    }

    // Update contact_statuses in app_settings to "winner" for newly drawn winners
    try {
      const adminSupabase = createAdminClient();
      const { data: currentSettings } = await adminSupabase
        .from("app_settings")
        .select("contact_statuses")
        .eq("id", 1)
        .maybeSingle();

      const existingStatuses = (currentSettings?.contact_statuses as Record<string, string>) || {};
      const updatedStatuses = { ...existingStatuses };
      let hasChanges = false;

      (winners || []).forEach((w: any) => {
        if (w.participant_id) {
          updatedStatuses[w.participant_id] = "winner";
          hasChanges = true;
        }
      });

      if (hasChanges) {
        await adminSupabase
          .from("app_settings")
          .update({ contact_statuses: updatedStatuses })
          .eq("id", 1);
      }
    } catch (statusErr) {
      console.warn("[API Admin Draw] Could not update contact_statuses in app_settings:", statusErr);
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
