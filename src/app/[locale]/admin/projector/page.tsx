import { setRequestLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { ProjectorMode } from "@/components/admin/ProjectorMode";
import type { WinnerItem } from "@/components/admin/RaffleManager";

export const dynamic = "force-dynamic";

export default async function ProjectorPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  setRequestLocale(locale);

  // Verify Admin Session
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/admin/login");
    return null;
  }

  const { data: adminRecord } = await supabase
    .from("admins")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!adminRecord) {
    redirect("/admin/login");
    return null;
  }

  let winners: WinnerItem[] = [];
  let leadingTopicSlug = "topic-a";

  try {
    const adminSupabase = createAdminClient();

    // Query leading topic
    const { data: countsData } = await adminSupabase
      .from("vote_counts")
      .select("topic_slug, count")
      .order("count", { ascending: false })
      .limit(1);

    if (countsData && countsData.length > 0) {
      leadingTopicSlug = countsData[0].topic_slug;
    }

    // Query all winners
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
        full_name: w.participants?.full_name || "Anonymous",
        phone: w.participants?.phone || "",
        email: w.participants?.email || null,
        locale: w.participants?.locale || "en",
      }));
    }
  } catch (err) {
    console.error("[Projector Page] Error loading projector data:", err);
  }

  return (
    <ProjectorMode
      winners={winners}
      leadingTopicSlug={leadingTopicSlug}
    />
  );
}
