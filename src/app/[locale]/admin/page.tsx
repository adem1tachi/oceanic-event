import { setRequestLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { AdminDashboardClient } from "@/components/admin/AdminDashboardClient";
import type { VoteData } from "@/components/VotingSection";

export const dynamic = "force-dynamic";

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
  let voteResults: VoteData[] = [];
  let participants: any[] = [];
  let winners: any[] = [];
  let settings: any = { isRegistrationOpen: true, eventDate: undefined, topics: [] };

  try {
    const adminSupabase = createAdminClient();

    // Query Settings
    const { data: settingsData } = await adminSupabase
      .from("app_settings")
      .select("*")
      .eq("id", 1)
      .single();

    const { data: topicsData } = await adminSupabase
      .from("topics")
      .select("id, slug, position, title, description, image_url")
      .order("position", { ascending: true });

    settings = {
      isRegistrationOpen: settingsData?.is_registration_open ?? true,
      eventDate: settingsData?.event_date || undefined,
      contactStatuses: (settingsData?.contact_statuses as Record<string, "new" | "contacted" | "winner">) || {},
      topics: topicsData?.map((t) => ({
        id: t.id,
        slug: t.slug,
        position: t.position,
        title: t.title || "",
        description: t.description || "",
        imageUrl: t.image_url || "",
      })) || [],
    };

    // Query vote counts
    const { data: countsData } = await adminSupabase
      .from("vote_counts")
      .select("topic_id, topic_slug, topic_position, count")
      .order("topic_position", { ascending: true });

    if (countsData) {
      voteResults = countsData.map((c) => ({
        topic_id: c.topic_id,
        topic_slug: c.topic_slug,
        topic_position: c.topic_position,
        count: Number(c.count),
      }));
    }

    // Query participants
    const { data: participantsData } = await adminSupabase
      .from("participants")
      .select("*")
      .order("created_at", { ascending: false });

    if (participantsData) {
      participants = participantsData;
    }

    // Query winners joined with participants
    const { data: winnersData } = await adminSupabase
      .from("winners")
      .select(`
        id,
        participant_id,
        draw_round,
        drawn_at,
        participants (
          full_name,
          phone,
          email,
          locale
        )
      `)
      .order("drawn_at", { ascending: false });

    if (winnersData) {
      winners = winnersData.map((w: any) => ({
        id: w.id,
        participant_id: w.participant_id,
        draw_round: w.draw_round,
        drawn_at: w.drawn_at,
        full_name: w.participants?.full_name || "Unknown",
        phone: w.participants?.phone || "",
        email: w.participants?.email || null,
        locale: w.participants?.locale || "en",
      }));
    }
  } catch (err) {
    console.error("[Admin Dashboard] Error fetching dashboard data:", err);
  }

  return (
    <AdminDashboardClient
      adminEmail={user.email ?? null}
      initialVoteResults={voteResults}
      initialParticipants={participants}
      initialWinners={winners}
      initialSettings={settings}
    />
  );
}
