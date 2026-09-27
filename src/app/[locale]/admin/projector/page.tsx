import { setRequestLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  ProjectorMode,
  type ProjectorWinner,
  type ProjectorParticipant,
  type LeadingTopicInfo,
} from "@/components/admin/ProjectorMode";

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

  let winners: ProjectorWinner[] = [];
  let allParticipants: ProjectorParticipant[] = [];
  let leadingTopic: LeadingTopicInfo = {
    slug: "topic-a",
    title: "Winning Training Topic",
    votesCount: 0,
  };

  try {
    const adminSupabase = createAdminClient();

    // 1. Query leading topic from vote_counts
    const { data: countsData } = await adminSupabase
      .from("vote_counts")
      .select("topic_slug, count")
      .order("count", { ascending: false })
      .limit(1);

    if (countsData && countsData.length > 0) {
      const topSlug = countsData[0].topic_slug;
      const count = Number(countsData[0].count) || 0;

      const { data: topicData } = await adminSupabase
        .from("topics")
        .select("title")
        .eq("slug", topSlug)
        .maybeSingle();

      leadingTopic = {
        slug: topSlug,
        title: topicData?.title || topSlug,
        votesCount: count,
      };
    }

    // 2. Query all participants
    const { data: participantsData } = await adminSupabase
      .from("participants")
      .select("id, full_name, first_name, last_name, company, position, phone, email, desired_topic")
      .order("created_at", { ascending: false });

    if (participantsData) {
      allParticipants = participantsData.map((p: any) => ({
        id: p.id,
        full_name: p.full_name,
        first_name: p.first_name,
        last_name: p.last_name,
        company: p.company,
        position: p.position,
        phone: p.phone,
        email: p.email,
        desired_topic: p.desired_topic,
      }));
    }

    // 3. Query all winners joined with participants
    const { data: winnersData } = await adminSupabase
      .from("winners")
      .select(`
        id,
        participant_id,
        draw_round,
        drawn_at,
        participants (
          full_name,
          first_name,
          last_name,
          phone,
          company,
          position
        )
      `)
      .order("drawn_at", { ascending: false });

    if (winnersData) {
      winners = winnersData.map((w: any) => {
        const p = w.participants;
        const name =
          p?.full_name ||
          (p?.first_name || p?.last_name
            ? `${p.first_name || ""} ${p.last_name || ""}`.trim()
            : "Participant");
        return {
          id: w.id,
          participantId: w.participant_id,
          name,
          phone: p?.phone || "",
          company: p?.company || "",
          position: p?.position || "",
          drawRound: w.draw_round || 1,
          drawnAt: w.drawn_at,
        };
      });
    }
  } catch (err) {
    console.error("[Projector Page] Error loading projector data:", err);
  }

  return (
    <ProjectorMode
      initialWinners={winners}
      allParticipants={allParticipants}
      leadingTopic={leadingTopic}
    />
  );
}
