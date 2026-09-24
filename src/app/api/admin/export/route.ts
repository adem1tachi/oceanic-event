import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = createServerSupabaseClient();

    // Verify authenticated user
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

    // Fetch all participants
    const adminSupabase = createAdminClient();
    const { data: participants, error } = await adminSupabase
      .from("participants")
      .select("id, full_name, phone, email, consent, locale, created_at")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[API Admin Export] DB Error:", error.message);
      return NextResponse.json({ error: "Failed to fetch participants" }, { status: 500 });
    }

    // Escape CSV cell helper
    const escapeCsv = (val: string | number | boolean | null | undefined): string => {
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    // CSV Headers
    const headers = [
      "Participant ID",
      "Full Name",
      "Phone",
      "Email",
      "Consent",
      "Locale",
      "Registered At",
    ];

    const rows = (participants || []).map((p) => [
      escapeCsv(p.id),
      escapeCsv(p.full_name),
      escapeCsv(p.phone),
      escapeCsv(p.email || ""),
      escapeCsv(p.consent),
      escapeCsv(p.locale),
      escapeCsv(p.created_at),
    ]);

    // Prepend UTF-8 Byte Order Mark (\uFEFF) so Microsoft Excel correctly parses Arabic characters
    const csvContent =
      "\uFEFF" +
      headers.join(",") +
      "\r\n" +
      rows.map((r) => r.join(",")).join("\r\n");

    const dateStr = new Date().toISOString().slice(0, 10);
    const filename = `formatech-participants-${dateStr}.csv`;

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("[API Admin Export] Exception:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
