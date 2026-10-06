import { setRequestLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { AdminDashboardClient } from "@/components/admin/AdminDashboardClient";

export const dynamic = "force-dynamic";

export interface SiteAnalyticsSummary {
  totalVisits: number;
  uniqueVisitors: number;
  returnRate: number; // Percentage, e.g. 24.5
  returningVisitors: number;
  officialClicks: number;
}

export default async function AdminDashboardPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  setRequestLocale(locale);

  // 1. Verify Authentication & Admin Status
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/admin/login");
    return null;
  }

  // Check admins allowlist
  const { data: adminRecord } = await supabase
    .from("admins")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!adminRecord) {
    redirect("/admin/login");
    return null;
  }

  // 2. Load Dashboard Data via Privileged Admin Client
  let participants: any[] = [];
  let settings: any = { isRegistrationOpen: true, eventDate: undefined };
  let analyticsSummary: SiteAnalyticsSummary = {
    totalVisits: 0,
    uniqueVisitors: 0,
    returnRate: 0,
    returningVisitors: 0,
    officialClicks: 0,
  };

  try {
    const adminSupabase = createAdminClient();

    // Query App Settings
    const { data: settingsData } = await adminSupabase
      .from("app_settings")
      .select("*")
      .eq("id", 1)
      .maybeSingle();

    settings = {
      isRegistrationOpen: settingsData?.is_registration_open ?? true,
      eventDate: settingsData?.event_date || undefined,
      contactStatuses: (settingsData?.contact_statuses as Record<string, "new" | "contacted">) || {},
    };

    // Query Participants (Leads who downloaded the guide)
    const { data: participantsData } = await adminSupabase
      .from("participants")
      .select("*")
      .order("created_at", { ascending: false });

    if (participantsData) {
      participants = participantsData;
    }

    // Query Analytics Events
    const { data: analyticsEvents, error: analyticsError } = await adminSupabase
      .from("site_analytics")
      .select("event_type, visitor_id, created_at");

    if (analyticsEvents && !analyticsError) {
      const pageViews = analyticsEvents.filter((e) => e.event_type === "page_view");
      const linkClicks = analyticsEvents.filter((e) => e.event_type === "link_click");

      const visitorFrequency: Record<string, number> = {};
      pageViews.forEach((pv) => {
        visitorFrequency[pv.visitor_id] = (visitorFrequency[pv.visitor_id] || 0) + 1;
      });

      const uniqueVisitorCount = Object.keys(visitorFrequency).length;
      const returningVisitorCount = Object.values(visitorFrequency).filter((c) => c > 1).length;
      const returnRatePercent =
        uniqueVisitorCount > 0
          ? Number(((returningVisitorCount / uniqueVisitorCount) * 100).toFixed(1))
          : 0;

      analyticsSummary = {
        totalVisits: pageViews.length,
        uniqueVisitors: uniqueVisitorCount,
        returnRate: returnRatePercent,
        returningVisitors: returningVisitorCount,
        officialClicks: linkClicks.length,
      };
    }
  } catch (err) {
    console.error("[Admin Dashboard] Error fetching dashboard data:", err);
  }

  return (
    <AdminDashboardClient
      adminEmail={user.email ?? null}
      initialParticipants={participants}
      initialSettings={settings}
      initialAnalytics={analyticsSummary}
    />
  );
}
