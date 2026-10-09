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

    // Fetch all participants & winners
    const adminSupabase = createAdminClient();
    const { data: participants, error } = await adminSupabase
      .from("participants")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[API Admin Export] DB Error:", error.message);
      return NextResponse.json({ error: "Failed to fetch participants" }, { status: 500 });
    }

    const { data: winners } = await adminSupabase.from("winners").select("participant_id");
    const winnerIds = new Set((winners || []).map((w) => w.participant_id));

    const { data: appSettings } = await adminSupabase
      .from("app_settings")
      .select("contact_statuses")
      .eq("id", 1)
      .maybeSingle();
    const statuses = (appSettings?.contact_statuses as Record<string, string>) || {};

    // Escape CSV cell helper and neutralize formula injection (CWE-1236)
    const escapeCsv = (val: string | number | boolean | null | undefined): string => {
      if (val === null || val === undefined) return '""';
      let str = String(val).replace(/"/g, '""');
      if (/^[=+@\-\t\r]/.test(str)) {
        str = `'${str}`;
      }
      return `"${str}"`;
    };

    // CSV Headers
    const headers = [
      "الاسم العائلي",
      "الاسم الأول",
      "المسمى الوظيفي",
      "الشركة",
      "واتساب",
      "التدريب المرغوب",
      "عدد الأفراد",
      "الحالة",
      "تاريخ التسجيل",
    ];

    const rows = (participants || []).map((p: any) => {
      let firstName = p.first_name || "";
      let lastName = p.last_name || "";
      let position = p.position || "";
      let company = p.company || "";
      let desiredTopic = p.desired_topic || "";
      let peopleCount = p.people_count || 1;

      if (!firstName && p.full_name) {
        let nameStr = p.full_name;
        if (nameStr.includes(" | ")) {
          const parts = nameStr.split(" | ");
          nameStr = parts[0];
          for (let i = 1; i < parts.length; i++) {
            if (parts[i].startsWith("Org: ")) company = parts[i].replace("Org: ", "").trim();
            else if (parts[i].startsWith("Pos: ")) position = parts[i].replace("Pos: ", "").trim();
          }
        }
        const nameParts = nameStr.trim().split(" ");
        firstName = nameParts[0] || "";
        lastName = nameParts.slice(1).join(" ") || "";
      }

      if (!desiredTopic && p.email && p.email.startsWith("Topic: ")) {
        const match = p.email.match(/Topic:\s*([^(|]+)(?:\(x?(\d+)\))?/);
        if (match) {
          desiredTopic = match[1].trim();
          if (match[2]) peopleCount = parseInt(match[2], 10) || 1;
        }
      }

      const isWinner = winnerIds.has(p.id);
      const rawStatus = isWinner
        ? "winner"
        : statuses[p.id] === "winner"
        ? "new"
        : statuses[p.id] || "new";
      const statusLabel =
        rawStatus === "winner" ? "فائز" : rawStatus === "contacted" ? "تم التواصل معه" : "جديد";

      return [
        escapeCsv(lastName || "—"),
        escapeCsv(firstName || "—"),
        escapeCsv(position || "—"),
        escapeCsv(company || "—"),
        escapeCsv(p.phone),
        escapeCsv(desiredTopic || "—"),
        escapeCsv(peopleCount),
        escapeCsv(statusLabel),
        escapeCsv(p.created_at),
      ];
    });

    // Prepend UTF-8 Byte Order Mark (\uFEFF) so Microsoft Excel correctly parses Arabic characters
    const csvContent =
      "\uFEFF" +
      headers.join(",") +
      "\r\n" +
      rows.map((r) => r.join(",")).join("\r\n");

    const dateStr = new Date().toISOString().slice(0, 10);
    const filename = `oceanic-formatech-participants-${dateStr}.csv`;

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
