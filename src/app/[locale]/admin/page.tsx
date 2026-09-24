import { setRequestLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { ResultsOverview } from "@/components/admin/ResultsOverview";
import { ParticipantsTable, type ParticipantItem } from "@/components/admin/ParticipantsTable";
import { RaffleManager, type WinnerItem } from "@/components/admin/RaffleManager";
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
  let participants: ParticipantItem[] = [];
  let winners: WinnerItem[] = [];

  try {
    const adminSupabase = createAdminClient();

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
      .select("id, full_name, phone, email, locale, created_at")
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
    <div className="min-h-screen bg-bg flex flex-col">
      <AdminHeader adminEmail={user.email} />

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-8 flex flex-col gap-8">
        {/* Results & Leading Course Section */}
        <section aria-label="Results and Course Selection">
          <ResultsOverview results={voteResults} />
        </section>

        {/* End of Day Raffle Draw Manager */}
        <section aria-label="Raffle Draw Manager">
          <RaffleManager
            initialWinners={winners}
            totalParticipants={participants.length}
          />
        </section>

        {/* Registered Participants Table with CSV Export */}
        <section aria-label="Participants List">
          <ParticipantsTable participants={participants} />
        </section>
      </main>

      <footer className="border-t border-border bg-bg-surface py-4 text-center text-xs text-token-muted">
        <p>Forma Tak 2026 • Administrative Management Portal</p>
      </footer>
    </div>
  );
}
